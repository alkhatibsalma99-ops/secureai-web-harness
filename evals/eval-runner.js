const fs = require("fs");
const path = require("path");
const {
  spawnSync,
  spawn,
} = require("child_process");

// =====================================================
// CONFIG
// =====================================================

const HARNESS_ROOT = path.resolve(
  __dirname,
  ".."
);

const STUDYTASK_REPO =
  process.env.STUDYTASK_REPO ||
  path.resolve(
    HARNESS_ROOT,
    "..",
    "studytask"
  );

const TASKS_FILE = path.join(
  __dirname,
  "tasks.json"
);

const WORKTREE_ROOT =
  process.env.EVAL_WORKTREE_ROOT ||
  path.join(
    process.env.TEMP ||
      process.env.TMP ||
      "C:\\Temp",
    "secureai-eval-worktrees"
  );

const RESULTS_DIR = path.join(
  __dirname,
  "results"
);

const RUNS_PER_TASK = Number(
  process.env.RUNS_PER_TASK || 1
);

const TASK_ID =
  process.env.TASK_ID || null;

const DRY_RUN =
  process.env.DRY_RUN === "1";

const OPENCODE_MODEL =
  process.env.OPENCODE_MODEL ||
  "opencode-go/glm-5.3-flash";

// =====================================================
// HELPERS
// =====================================================

function ensureDir(dir) {
  fs.mkdirSync(
    dir,
    {
      recursive: true,
    }
  );
}

function runCommand(
  command,
  args,
  options = {}
) {
  const result = spawnSync(
    command,
    args,
    {
      encoding: "utf8",
      shell: true,
      ...options,
    }
  );

  return {
    status:
      result.status,

    stdout:
      result.stdout || "",

    stderr:
      result.stderr || "",

    error:
      result.error || null,

    signal:
      result.signal || null,
  };
}

function git(
  args,
  cwd = STUDYTASK_REPO
) {
  const result =
    runCommand(
      "git",
      args,
      {
        cwd,
      }
    );

  if (
    result.status !== 0
  ) {
    throw new Error(
      [
        "Git command failed:",
        `git ${args.join(" ")}`,
        "",
        result.stderr,
      ].join("\n")
    );
  }

  return result.stdout.trim();
}

// =====================================================
// VALIDATION
// =====================================================

function validateEnvironment(tasks) {
  console.log(
    "\n=== Environment Check ==="
  );

  if (
    !fs.existsSync(
      STUDYTASK_REPO
    )
  ) {
    throw new Error(
      `StudyTask repository not found:\n${STUDYTASK_REPO}`
    );
  }

  console.log(
    `StudyTask: ${STUDYTASK_REPO}`
  );

  console.log(
    `OpenCode model: ${OPENCODE_MODEL}`
  );

  if (
    !fs.existsSync(
      TASKS_FILE
    )
  ) {
    throw new Error(
      `tasks.json not found:\n${TASKS_FILE}`
    );
  }

  for (
    const task of tasks
  ) {
    const promptPath =
      path.join(
        __dirname,
        task.promptFile
      );

    const checkPath =
      path.join(
        __dirname,
        task.checkFile
      );

    const expectedPath =
      path.join(
        __dirname,
        task.expectedFile
      );

    if (
      !fs.existsSync(
        promptPath
      )
    ) {
      throw new Error(
        `${task.id}: prompt.txt not found:\n${promptPath}`
      );
    }

    if (
      !fs.existsSync(
        checkPath
      )
    ) {
      throw new Error(
        `${task.id}: check.js not found:\n${checkPath}`
      );
    }

    if (
      !fs.existsSync(
        expectedPath
      )
    ) {
      throw new Error(
        `${task.id}: expected.md not found:\n${expectedPath}`
      );
    }

    const tagCheck =
      runCommand(
        "git",
        [
          "rev-parse",
          "--verify",
          `refs/tags/${task.startState}`,
        ],
        {
          cwd:
            STUDYTASK_REPO,
        }
      );

    if (
      tagCheck.status !== 0
    ) {
      throw new Error(
        `${task.id}: Git tag "${task.startState}" does not exist.`
      );
    }

    console.log(
      `OK ${task.id} -> ${task.startState}`
    );
  }

  console.log(
    "Environment check passed.\n"
  );
}

// =====================================================
// WORKTREE
// =====================================================

function removeWorktree(
  worktreePath
) {
  if (!worktreePath) {
    return;
  }

  console.log(
    `Cleaning worktree: ${worktreePath}`
  );

  const result =
    runCommand(
      "git",
      [
        "worktree",
        "remove",
        "--force",
        worktreePath,
      ],
      {
        cwd:
          STUDYTASK_REPO,
      }
    );

  if (
    result.status !== 0
  ) {
    console.warn(
      "Warning: worktree could not be removed immediately."
    );

    if (
      result.stderr
    ) {
      console.warn(
        result.stderr
      );
    }
  }

  runCommand(
    "git",
    [
      "worktree",
      "prune",
    ],
    {
      cwd:
        STUDYTASK_REPO,
    }
  );
}

function createWorktree(
  task,
  runNumber
) {
  const uniqueId =
    `${Date.now()}-${process.pid}`;

  const worktreeName =
    `${task.id.toLowerCase()}-run-${runNumber}-${uniqueId}`;

  const worktreePath =
    path.join(
      WORKTREE_ROOT,
      worktreeName
    );

  console.log(
    `Creating worktree from ${task.startState}`
  );

  console.log(
    `Worktree: ${worktreePath}`
  );

  git([
    "worktree",
    "add",
    "--detach",
    worktreePath,
    task.startState,
  ]);

  return worktreePath;
}

// =====================================================
// COPY HARNESS INTO WORKTREE
// =====================================================

function copyDirectory(
  source,
  destination
) {
  if (
    !fs.existsSync(source)
  ) {
    return;
  }

  fs.cpSync(
    source,
    destination,
    {
      recursive: true,
    }
  );
}

function installHarness(
  worktreePath
) {
  console.log(
    "Installing harness into temporary worktree..."
  );

  const agentsSource =
    path.join(
      HARNESS_ROOT,
      "AGENTS.md"
    );

  if (
    fs.existsSync(
      agentsSource
    )
  ) {
    fs.copyFileSync(
      agentsSource,
      path.join(
        worktreePath,
        "AGENTS.md"
      )
    );
  }

  const specSource =
    path.join(
      HARNESS_ROOT,
      "specification.md"
    );

  if (
    fs.existsSync(
      specSource
    )
  ) {
    fs.copyFileSync(
      specSource,
      path.join(
        worktreePath,
        "specification.md"
      )
    );
  }

  copyDirectory(
    path.join(
      HARNESS_ROOT,
      ".opencode"
    ),
    path.join(
      worktreePath,
      ".opencode"
    )
  );

  copyDirectory(
    path.join(
      HARNESS_ROOT,
      "tools"
    ),
    path.join(
      worktreePath,
      "tools"
    )
  );
}

// =====================================================
// INSTALL DEPENDENCIES
// =====================================================

function installDependencies(
  worktreePath
) {
  const packageJson =
    path.join(
      worktreePath,
      "package.json"
    );

  if (
    !fs.existsSync(
      packageJson
    )
  ) {
    console.log(
      "No package.json found. Skipping npm install."
    );

    return;
  }

  console.log(
    "Installing target dependencies..."
  );

  const hasLock =
    fs.existsSync(
      path.join(
        worktreePath,
        "package-lock.json"
      )
    );

  const npmArgs =
    hasLock
      ? [
          "ci",
          "--silent",
        ]
      : [
          "install",
          "--silent",
        ];

  const result =
    runCommand(
      "npm",
      npmArgs,
      {
        cwd:
          worktreePath,
      }
    );

  if (
    result.status !== 0
  ) {
    throw new Error(
      `npm install failed:\n${result.stderr}`
    );
  }
}

// =====================================================
// OPENCODE OUTPUT PARSER
// =====================================================

function parseOpenCodeOutput(
  output
) {
  let totalTokens = 0;
  let totalCost = 0;
  let stepFinishCount = 0;

  const lines =
    output.split(/\r?\n/);

  for (
    const line of lines
  ) {
    const trimmed =
      line.trim();

    if (!trimmed) {
      continue;
    }

    try {
      const event =
        JSON.parse(
          trimmed
        );

      const type =
        event.type ||
        event.event ||
        event.data?.type;

      if (
        type ===
          "step_finish" ||
        type ===
          "session.step.ended"
      ) {
        stepFinishCount++;

        const part =
          event.part ||
          event.data ||
          {};

        const tokens =
          part.tokens ||
          event.tokens ||
          event.data?.tokens ||
          {};

        if (
          typeof tokens.total ===
          "number"
        ) {
          totalTokens +=
            tokens.total;
        } else {
          const input =
            typeof tokens.input ===
            "number"
              ? tokens.input
              : 0;

          const output =
            typeof tokens.output ===
            "number"
              ? tokens.output
              : 0;

          const reasoning =
            typeof tokens.reasoning ===
            "number"
              ? tokens.reasoning
              : 0;

          const cacheRead =
            typeof tokens.cacheRead ===
            "number"
              ? tokens.cacheRead
              : typeof tokens.cache_read ===
                "number"
              ? tokens.cache_read
              : typeof tokens.cache?.read ===
                "number"
              ? tokens.cache.read
              : 0;

          const cacheWrite =
            typeof tokens.cacheWrite ===
            "number"
              ? tokens.cacheWrite
              : typeof tokens.cache_write ===
                "number"
              ? tokens.cache_write
              : typeof tokens.cache?.write ===
                "number"
              ? tokens.cache.write
              : 0;

          totalTokens +=
            input +
            output +
            reasoning +
            cacheRead +
            cacheWrite;
        }

        const cost =
          part.cost ??
          event.cost ??
          event.data?.cost;

        if (
          typeof cost ===
          "number"
        ) {
          totalCost +=
            cost;
        }
      }
    } catch {
      // Ignore non-JSON lines
    }
  }

  console.log(
    `OpenCode metrics: ${stepFinishCount} step_finish event(s), ` +
      `${totalTokens} tokens, cost=${totalCost}`
  );

  return {
    tokens:
      totalTokens,

    cost:
      totalCost,

    stepFinishCount,
  };
}

// =====================================================
// OPENCODE RUN
// =====================================================

function runOpenCode(
  task,
  worktreePath
) {
  const promptPath =
    path.join(
      __dirname,
      task.promptFile
    );

  const prompt =
    fs.readFileSync(
      promptPath,
      "utf8"
    );

  const localPromptPath =
    path.join(
      worktreePath,
      "EVAL_PROMPT.md"
    );

  fs.writeFileSync(
    localPromptPath,
    prompt,
    "utf8"
  );

  console.log(
    `Running OpenCode for ${task.id}...`
  );

  console.log(
    `Model: ${OPENCODE_MODEL}`
  );

  console.log(
    `Time budget: ${task.budget.maxMinutes} minute(s)`
  );

  console.log(
    "OpenCode is running headlessly. Output will appear when the run finishes."
  );

  const agentPrompt =
    "Read EVAL_PROMPT.md and implement the requested task. " +
    "Work only inside this repository. " +
    "Do not access files outside this repository. " +
    "Preserve existing functionality. " +
    "Run appropriate checks before finishing. " +
    "Do not start a persistent server, watcher, dev server, or background process.";

  const startedAt =
    Date.now();

  const result =
    runCommand(
      "opencode",
      [
        "run",
        "--pure",
        "--model",
        OPENCODE_MODEL,
        "--format",
        "json",
        agentPrompt,
      ],
      {
        cwd:
          worktreePath,

        timeout:
          task.budget
            .maxMinutes *
          60 *
          1000,
      }
    );

  const finishedAt =
    Date.now();

  const runtimeMs =
    finishedAt -
    startedAt;

  const metrics =
    parseOpenCodeOutput(
      result.stdout
    );

  return {
    exitCode:
      result.status,

    stdout:
      result.stdout,

    stderr:
      result.stderr,

    runtimeMs,

    runtimeSeconds:
      runtimeMs / 1000,

    tokens:
      metrics.tokens,

    cost:
      metrics.cost,

    stepFinishCount:
      metrics.stepFinishCount,

    timedOut:
      result.signal !== null,
  };
}

// =====================================================
// SERVER
// =====================================================

function startServer(
  worktreePath
) {
  console.log(
    "Starting StudyTask server..."
  );

  const server =
    spawn(
      process.execPath,
      [
        "server.js",
      ],
      {
        cwd:
          worktreePath,

        windowsHide:
          true,

        shell:
          false,

        stdio: [
          "ignore",
          "pipe",
          "pipe",
        ],
      }
    );

  server.stdout.on(
    "data",
    (data) => {
      const text =
        data
          .toString()
          .trim();

      if (text) {
        console.log(
          `[SERVER] ${text}`
        );
      }
    }
  );

  server.stderr.on(
    "data",
    (data) => {
      const text =
        data
          .toString()
          .trim();

      if (text) {
        console.error(
          `[SERVER ERROR] ${text}`
        );
      }
    }
  );

  server.on(
    "error",
    (error) => {
      console.error(
        `[SERVER SPAWN ERROR] ${error.message}`
      );
    }
  );

  server.on(
    "exit",
    (
      code,
      signal
    ) => {
      console.log(
        `[SERVER EXIT] code=${code} signal=${signal}`
      );
    }
  );

  return server;
}

function sleep(ms) {
  return new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        ms
      )
  );
}

// =====================================================
// AUTOMATIC CHECK
// =====================================================

async function runAutomaticCheck(
  task,
  worktreePath
) {
  const checkPath =
    path.join(
      __dirname,
      task.checkFile
    );

  const server =
    startServer(
      worktreePath
    );

  try {
    // Give the server enough time to start.
    await sleep(
      2500
    );

    if (
      server.exitCode !==
        null ||
      server.killed
    ) {
      console.error(
        "StudyTask server is not running. Automatic check may fail."
      );
    }

    console.log(
      `Running automatic check for ${task.id}...`
    );

    const result =
      runCommand(
        process.execPath,
        [
          checkPath,
        ],
        {
          cwd:
            HARNESS_ROOT,

          shell:
            false,

          env: {
            ...process.env,

            STUDYTASK_URL:
              "http://127.0.0.1:3000",
          },
        }
      );

    return {
      passed:
        result.status === 0,

      exitCode:
        result.status,

      stdout:
        result.stdout,

      stderr:
        result.stderr,
    };
  } finally {
    if (
      server &&
      !server.killed &&
      server.exitCode === null
    ) {
      try {
        server.kill();
      } catch {
        // ignore
      }
    }

    // Give Node a moment to close the child process.
    await sleep(
      300
    );
  }
}

// =====================================================
// EXECUTE ONE RUN
// =====================================================

async function executeRun(
  task,
  runNumber
) {
  console.log(
    "\n======================================"
  );

  console.log(
    `${task.id} - Run ${runNumber}`
  );

  console.log(
    "======================================"
  );

  const worktreePath =
    createWorktree(
      task,
      runNumber
    );

  try {
    installHarness(
      worktreePath
    );

    installDependencies(
      worktreePath
    );

    if (DRY_RUN) {
      console.log(
        "DRY RUN: OpenCode and check skipped."
      );

      return {
        task:
          task.id,

        name:
          task.name,

        size:
          task.size,

        run:
          runNumber,

        passed:
          null,

        tokens:
          0,

        cost:
          0,

        runtimeSeconds:
          0,

        dryRun:
          true,
      };
    }

    const agentResult =
      await runOpenCode(
        task,
        worktreePath
      );

    console.log(
      `OpenCode exit code: ${agentResult.exitCode}`
    );

    if (
      agentResult.timedOut
    ) {
      console.log(
        "OpenCode run reached its time budget."
      );
    }

    if (
      agentResult.stderr
    ) {
      console.log(
        "\nOpenCode stderr:"
      );

      console.log(
        agentResult.stderr
      );
    }

    const checkResult =
      await runAutomaticCheck(
        task,
        worktreePath
      );

    console.log(
      "\n--- Automatic Check Output ---"
    );

    console.log(
      checkResult.stdout
    );

    if (
      checkResult.stderr
    ) {
      console.log(
        "\nCheck stderr:"
      );

      console.log(
        checkResult.stderr
      );
    }

    return {
      task:
        task.id,

      name:
        task.name,

      size:
        task.size,

      run:
        runNumber,

      model:
        OPENCODE_MODEL,

      passed:
        checkResult.passed,

      agentExitCode:
        agentResult.exitCode,

      checkExitCode:
        checkResult.exitCode,

      tokens:
        agentResult.tokens,

      cost:
        agentResult.cost,

      stepFinishCount:
        agentResult.stepFinishCount,

      timedOut:
        agentResult.timedOut,

      runtimeSeconds:
        Number(
          agentResult
            .runtimeSeconds
            .toFixed(2)
        ),
    };
  } finally {
    removeWorktree(
      worktreePath
    );
  }
}

// =====================================================
// SUMMARY
// =====================================================

function createSummary(
  results
) {
  const summary = [];

  const taskIds = [
    ...new Set(
      results.map(
        (r) => r.task
      )
    ),
  ];

  for (
    const id of taskIds
  ) {
    const runs =
      results.filter(
        (r) =>
          r.task === id &&
          r.passed !== null
      );

    if (
      runs.length === 0
    ) {
      continue;
    }

    const passed =
      runs.filter(
        (r) =>
          r.passed
      ).length;

    const successRate =
      (passed /
        runs.length) *
      100;

    const avgTokens =
      runs.reduce(
        (
          sum,
          r
        ) =>
          sum +
          (r.tokens || 0),
        0
      ) /
      runs.length;

    const avgCost =
      runs.reduce(
        (
          sum,
          r
        ) =>
          sum +
          (r.cost || 0),
        0
      ) /
      runs.length;

    const avgRuntime =
      runs.reduce(
        (
          sum,
          r
        ) =>
          sum +
          (r.runtimeSeconds ||
            0),
        0
      ) /
      runs.length;

    summary.push({
      task:
        id,

      model:
        OPENCODE_MODEL,

      runs:
        runs.length,

      passes:
        passed,

      successRate:
        Number(
          successRate.toFixed(
            1
          )
        ),

      avgTokens:
        Math.round(
          avgTokens
        ),

      avgCost:
        Number(
          avgCost.toFixed(
            6
          )
        ),

      avgRuntimeSeconds:
        Number(
          avgRuntime.toFixed(
            2
          )
        ),
    });
  }

  return summary;
}

// =====================================================
// SAVE RESULTS
// =====================================================

function saveResults(
  results,
  summary
) {
  ensureDir(
    RESULTS_DIR
  );

  const timestamp =
    new Date()
      .toISOString()
      .replace(
        /[:.]/g,
        "-"
      );

  const jsonPath =
    path.join(
      RESULTS_DIR,
      `results-${timestamp}.json`
    );

  const data = {
    createdAt:
      new Date()
        .toISOString(),

    model:
      OPENCODE_MODEL,

    taskFilter:
      TASK_ID,

    runsPerTask:
      RUNS_PER_TASK,

    results,

    summary,
  };

  fs.writeFileSync(
    jsonPath,
    JSON.stringify(
      data,
      null,
      2
    )
  );

  console.log(
    `\nResults written to:\n${jsonPath}`
  );
}

// =====================================================
// MAIN
// =====================================================

async function main() {
  console.log(
    "======================================"
  );

  console.log(
    "StudyTask M3 Eval Runner"
  );

  console.log(
    "======================================"
  );

  let tasks =
    JSON.parse(
      fs.readFileSync(
        TASKS_FILE,
        "utf8"
      )
    );

  if (TASK_ID) {
    tasks =
      tasks.filter(
        (task) =>
          task.id ===
          TASK_ID
      );

    if (
      tasks.length === 0
    ) {
      throw new Error(
        `Task "${TASK_ID}" not found in tasks.json`
      );
    }
  }

  console.log(
    `Tasks: ${tasks.length}`
  );

  if (TASK_ID) {
    console.log(
      `Task filter: ${TASK_ID}`
    );
  }

  console.log(
    `Model: ${OPENCODE_MODEL}`
  );

  console.log(
    `Runs per task: ${RUNS_PER_TASK}`
  );

  console.log(
    `Dry run: ${DRY_RUN}`
  );

  console.log(
    `Worktree root: ${WORKTREE_ROOT}`
  );

  validateEnvironment(
    tasks
  );

  ensureDir(
    WORKTREE_ROOT
  );

  const results = [];

  for (
    const task of tasks
  ) {
    for (
      let run = 1;
      run <=
      RUNS_PER_TASK;
      run++
    ) {
      try {
        const result =
          await executeRun(
            task,
            run
          );

        results.push(
          result
        );
      } catch (error) {
        console.error(
          `\n${task.id} Run ${run} ERROR:`
        );

        console.error(
          error.message
        );

        results.push({
          task:
            task.id,

          name:
            task.name,

          size:
            task.size,

          model:
            OPENCODE_MODEL,

          run,

          passed:
            false,

          tokens:
            0,

          cost:
            0,

          runtimeSeconds:
            0,

          error:
            error.message,
        });
      }
    }
  }

  const summary =
    createSummary(
      results
    );

  console.log(
    "\n=== RESULT TABLE ==="
  );

  if (
    summary.length > 0
  ) {
    console.table(
      summary
    );
  } else {
    console.log(
      "No measured runs because DRY_RUN is active."
    );
  }

  saveResults(
    results,
    summary
  );

  console.log(
    "\nEval runner finished."
  );
}

// =====================================================
// START
// =====================================================

main().catch(
  (error) => {
    console.error(
      "\nEVAL RUNNER FAILED:"
    );

    console.error(
      error
    );

    process.exit(1);
  }
);