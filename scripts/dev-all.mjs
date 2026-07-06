import { spawn } from "node:child_process";

const processes = [
  {
    name: "api",
    command: "npm",
    args: ["run", "dev", "-w", "backend/api"],
  },
  {
    name: "web",
    command: "npm",
    args: ["run", "dev", "-w", "frontend/web"],
  },
];

let isShuttingDown = false;

const children = processes.map(({ name, command, args }) => {
  const child = spawn(command, args, {
    shell: true,
    stdio: ["inherit", "pipe", "pipe"],
  });

  child.stdout.on("data", (data) => {
    process.stdout.write(`[${name}] ${data}`);
  });

  child.stderr.on("data", (data) => {
    process.stderr.write(`[${name}] ${data}`);
  });

  child.on("exit", (code) => {
    if (isShuttingDown) return;
    console.error(`\n[${name}] process exited with code ${code ?? "unknown"}.`);
    if (name === "api" && code !== 0) {
      console.error(`[dev] Backend crashed. To debug run: npm run dev:backend`);
      console.error(`[dev] Frontend (http://localhost:3000) may still be running — shutting down in 2s...\n`);
    }
    // Give processes a moment to flush output before killing
    setTimeout(() => shutdown(code ?? 1), 2000);
  });

  return child;
});

function shutdown(code = 0) {
  isShuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
