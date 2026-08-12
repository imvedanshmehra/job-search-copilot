#!/usr/bin/env node
import { spawnSync } from "node:child_process";

// pnpm forwards the "--" separator literally instead of stripping it,
// so `pnpm format -- --check` would otherwise reach prettier as a stray
// "--check" file pattern. Filter it out before spawning prettier.
const extraArgs = process.argv.slice(2).filter((arg) => arg !== "--");

const result = spawnSync("prettier", [".", ...extraArgs], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
