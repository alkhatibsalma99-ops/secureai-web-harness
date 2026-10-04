const { execSync } = require("child_process");
const path = require("path");

const projectPath = process.argv[2];

if (!projectPath) {
  console.error("ERROR: Please provide the target project path.");
  process.exit(1);
}

const absolutePath = path.resolve(projectPath);

console.log("Running project checks...");
console.log(`Target project: ${absolutePath}`);

function runCommand(command, label) {
  try {
    console.log(`\n--- ${label} ---`);

    const output = execSync(command, {
      cwd: absolutePath,
      encoding: "utf8",
      stdio: "pipe",
    });

    console.log(output || `${label}: PASSED`);

    return {
      name: label,
      status: "passed",
    };
  } catch (error) {
    console.error(error.stdout?.toString() || "");
    console.error(error.stderr?.toString() || "");

    return {
      name: label,
      status: "failed",
    };
  }
}

const results = [];

results.push(runCommand("npm test -- --runInBand", "Tests"));
results.push(runCommand("npm run build", "Build"));

console.log("\n======================");
console.log("CHECK RESULTS");
console.log("======================");

results.forEach((result) => {
  console.log(`${result.name}: ${result.status.toUpperCase()}`);
});

const failed = results.some((result) => result.status === "failed");

if (failed) {
  process.exit(1);
}

console.log("\nAll checks passed.");
process.exit(0);