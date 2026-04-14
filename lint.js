import process from "node:process";

import { linting } from "./deps.js";

const exitCode = await linting.runLintCli({
    argv: process.argv.slice(2),
    cwd: process.cwd(),
    stdout: process.stdout,
    stderr: process.stderr,
});

process.exit(exitCode);
