import { spawn } from "node:child_process";
const database =
  "postgresql://matrix:local-preview-only@127.0.0.1:55432/matrix_rebuild";
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "-p", "3010"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      STORAGE_DATABASE_URL: database,
      STORAGE_DATABASE_URL_UNPOOLED: database,
      NEXTAUTH_URL: "http://localhost:3010",
      ADMIN_PASSWORD: "local-preview-only",
      NEXTAUTH_SECRET: "local-preview-secret-not-for-production-2026",
    },
  },
);
child.on("exit", (code) => process.exit(code ?? 0));
