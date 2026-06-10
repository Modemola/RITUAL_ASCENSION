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
    console.error(`[${name}] exited with code ${code ?? "unknown"}`);
    shutdown(code ?? 1);
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
