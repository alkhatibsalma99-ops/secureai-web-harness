import { tool } from "@opencode-ai/plugin";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

export default tool({
  description:
    "Verify that the StudyTask API correctly validates task deadlines.",

  args: {
    projectPath: tool.schema
      .string()
      .describe("Path to the StudyTask target software repository"),
  },

  async execute(args, context) {
    const scriptPath = path.join(
      context.worktree,
      "tools",
      "deadline_check.js"
    );

    try {
      const { stdout, stderr } = await execFileAsync(
        "node",
        [scriptPath, args.projectPath],
        {
          cwd: context.worktree,
        }
      );

      return `${stdout}\n${stderr}`.trim();
    } catch (error) {
      return `${error.stdout || ""}\n${error.stderr || ""}`.trim();
    }
  },
});