import { tool } from "@opencode-ai/plugin";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

export default tool({
  description:
    "Run the StudyTask automated project checks. This tool runs the tests and build check and returns the result to the coding agent.",

  args: {
    projectPath: tool.schema
      .string()
      .describe("Path to the StudyTask target software repository"),
  },

  async execute(args, context) {
    const scriptPath = path.join(
      context.worktree,
      "tools",
      "run_project_checks.js"
    );

    const { stdout, stderr } = await execFileAsync(
      "node",
      [scriptPath, args.projectPath],
      {
        cwd: context.worktree,
      }
    );

    return `${stdout}\n${stderr}`.trim();
  },
});