const { spawn } = require("child_process");
const path = require("path");

const projectPath = process.argv[2];

if (!projectPath) {
  console.error("DEADLINE CHECK: FAILED");
  console.error("Missing StudyTask project path.");
  process.exit(1);
}

const absoluteProjectPath = path.resolve(projectPath);
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

const invalidDeadlines = [
  "abc",
  "morgen",
  "0",
  "2026",
  "2026-13-45",
  "12/25/2026",
];

const validDeadline = "2026-12-25";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createTask(title, deadline) {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      deadline,
    }),
  });

  return {
    status: response.status,
    body: await response.text(),
  };
}

async function runChecks() {
  console.log("=================================");
  console.log("StudyTask Deadline Verification");
  console.log("=================================");

  let failed = false;

  for (const deadline of invalidDeadlines) {
    const result = await createTask(
      `Invalid deadline test: ${deadline}`,
      deadline
    );

    if (result.status >= 200 && result.status < 300) {
      console.log(`FAIL: Invalid deadline accepted: "${deadline}"`);
      console.log(`Expected: HTTP 400`);
      console.log(`Received: HTTP ${result.status}`);
      failed = true;
    } else {
      console.log(`PASS: Invalid deadline rejected: "${deadline}"`);
    }
  }

  const validResult = await createTask(
    "Valid deadline test",
    validDeadline
  );

  if (validResult.status >= 200 && validResult.status < 300) {
    console.log(`PASS: Valid deadline accepted: "${validDeadline}"`);
  } else {
    console.log(`FAIL: Valid deadline rejected: "${validDeadline}"`);
    console.log(`Received: HTTP ${validResult.status}`);
    failed = true;
  }

  console.log("=================================");

  if (failed) {
    console.log("DEADLINE CHECK: FAILED");
    process.exitCode = 1;
  } else {
    console.log("DEADLINE CHECK: PASSED");
    process.exitCode = 0;
  }
}

const server = spawn("node", ["server.js"], {
  cwd: absoluteProjectPath,
  stdio: ["ignore", "pipe", "pipe"],
});

server.stdout.on("data", (data) => {
  console.log(`[StudyTask] ${data.toString().trim()}`);
});

server.stderr.on("data", (data) => {
  console.error(`[StudyTask Error] ${data.toString().trim()}`);
});

(async () => {
  try {
    await wait(1500);
    await runChecks();
  } catch (error) {
    console.error("DEADLINE CHECK: FAILED");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    server.kill();
  }
})();