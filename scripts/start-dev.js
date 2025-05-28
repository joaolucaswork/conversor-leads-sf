#!/usr/bin/env node
/**
 * Custom development startup script
 * Starts backend, frontend, and Electron in the correct sequence
 */

const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

// Configuration
const BACKEND_PORT = 8000;
const FRONTEND_PORT = 5173;
const CHECK_INTERVAL = 1000; // 1 second
const MAX_RETRIES = 60; // 60 seconds total

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(prefix, message, color = colors.reset) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

function checkServer(port, path = "/") {
  return new Promise((resolve) => {
    const options = {
      hostname: "localhost",
      port: port,
      path: path,
      method: "GET",
      timeout: 5000, // Increased timeout
    };

    const req = http.request(options, (res) => {
      // Accept any successful response
      const success = res.statusCode >= 200 && res.statusCode < 500;
      resolve(success);
    });

    req.on("error", (err) => {
      // Log error for debugging but don't fail immediately
      if (err.code !== "ECONNREFUSED") {
        log("DEBUG", `Connection error: ${err.message}`, colors.yellow);
      }
      resolve(false);
    });

    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function waitForServer(
  port,
  path = "/",
  maxRetries = MAX_RETRIES,
  name = "Server"
) {
  log(name, `Waiting for server on port ${port}...`, colors.yellow);

  for (let i = 0; i < maxRetries; i++) {
    const isReady = await checkServer(port, path);
    if (isReady) {
      log(name, `Server ready on port ${port}!`, colors.green);
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL));
  }

  log(name, `Timeout waiting for server on port ${port}`, colors.red);
  return false;
}

function startProcess(command, args, name, color) {
  log(name, `Starting: ${command} ${args.join(" ")}`, color);

  const process = spawn(command, args, {
    stdio: "pipe",
    shell: true,
    cwd: path.join(__dirname, ".."),
  });

  process.stdout.on("data", (data) => {
    const lines = data
      .toString()
      .split("\n")
      .filter((line) => line.trim());
    lines.forEach((line) => log(name, line, color));
  });

  process.stderr.on("data", (data) => {
    const lines = data
      .toString()
      .split("\n")
      .filter((line) => line.trim());
    lines.forEach((line) => log(name, line, colors.red));
  });

  process.on("close", (code) => {
    if (code !== 0) {
      log(name, `Process exited with code ${code}`, colors.red);
    }
  });

  return process;
}

async function main() {
  log("STARTUP", "Starting development environment...", colors.bright);

  const processes = [];

  try {
    // 1. Start Backend
    log("STARTUP", "Step 1: Starting backend server...", colors.cyan);
    const backend = startProcess(
      "python",
      ["backend/start_dev_server.py"],
      "BACKEND",
      colors.blue
    );
    processes.push(backend);

    // Wait for backend to be ready
    const backendReady = await waitForServer(BACKEND_PORT, "/", 30, "BACKEND");
    if (!backendReady) {
      throw new Error("Backend failed to start");
    }

    // 2. Start Frontend
    log("STARTUP", "Step 2: Starting frontend server...", colors.cyan);
    const frontend = startProcess(
      "npm",
      ["run", "frontend"],
      "FRONTEND",
      colors.green
    );
    processes.push(frontend);

    // Wait for frontend to be ready (longer timeout for Vite)
    const frontendReady = await waitForServer(
      FRONTEND_PORT,
      "/",
      60,
      "FRONTEND"
    );
    if (!frontendReady) {
      throw new Error("Frontend failed to start");
    }

    // 3. Start Electron
    log("STARTUP", "Step 3: Starting Electron application...", colors.cyan);
    const electron = startProcess(
      "cross-env",
      ["VITE_DEV_SERVER_URL=http://localhost:5173", "electron", "."],
      "ELECTRON",
      colors.magenta
    );
    processes.push(electron);

    log("STARTUP", "All services started successfully!", colors.green);
    log("STARTUP", `Backend: http://localhost:${BACKEND_PORT}`, colors.blue);
    log("STARTUP", `Frontend: http://localhost:${FRONTEND_PORT}`, colors.green);
    log(
      "STARTUP",
      "Electron: Desktop application window should open",
      colors.magenta
    );
    log("STARTUP", "Press Ctrl+C to stop all services", colors.yellow);
  } catch (error) {
    log("ERROR", error.message, colors.red);

    // Kill all processes
    processes.forEach((proc) => {
      if (proc && !proc.killed) {
        proc.kill("SIGTERM");
      }
    });

    process.exit(1);
  }

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    log("SHUTDOWN", "Shutting down all services...", colors.yellow);

    processes.forEach((proc) => {
      if (proc && !proc.killed) {
        proc.kill("SIGTERM");
      }
    });

    setTimeout(() => {
      log("SHUTDOWN", "Goodbye!", colors.green);
      process.exit(0);
    }, 1000);
  });
}

main().catch((error) => {
  log("ERROR", error.message, colors.red);
  process.exit(1);
});
