import { tool } from "@opencode-ai/plugin";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

export default tool({
  description:
    "Verify the StudyTask title validation. The tool checks empty titles, whitespace-only titles, overly long titles and a valid title.",

  args: {},

  async execute(args, context) {
    const scriptPath = path.join(
      context.worktree,
      "tools",
      "title_check.js"
    );

    try {
      const { stdout, stderr } = await execFileAsync(
        "node",
        [scriptPath],
        {
          cwd: context.worktree,
        }
      );

      return `${stdout}\n${stderr}`.trim();
    } catch (error) {
      const stdout = error.stdout?.toString() || "";
      const stderr = error.stderr?.toString() || "";

      return `${stdout}\n${stderr}`.trim();
    }
  },
});