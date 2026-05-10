import { app, BrowserWindow, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DESKTOP_ROOT = path.resolve(__dirname, "..");
const WEBAPP_ROOT = path.resolve(DESKTOP_ROOT, "..", "medicare-companion-main");

const DEFAULT_DEV_PORT = Number(process.env.MEDICARE_WEB_PORT || "5188");
const WEBAPP_URL = process.env.MEDICARE_WEBAPP_URL?.trim();

let mainWindow = null;
let devServerProcess = null;
let resolvedStartUrl = "";

function isWin() {
  return process.platform === "win32";
}

async function waitForServer(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.ok || (res.status >= 300 && res.status < 400)) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  throw new Error(`Timed out waiting for dev server at ${url}`);
}

function startWebappDevServer(port) {
  const viteArgs = [
    "vite",
    "dev",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
  ];

  // Windows: spawn npx.cmd directly often yields EINVAL under Electron; use cmd.exe /c.
  if (isWin()) {
    const cmd = process.env.ComSpec || "cmd.exe";
    devServerProcess = spawn(cmd, ["/d", "/c", "npx", ...viteArgs], {
      cwd: WEBAPP_ROOT,
      stdio: "inherit",
      env: { ...process.env },
      windowsHide: false,
    });
  } else {
    devServerProcess = spawn("npx", viteArgs, {
      cwd: WEBAPP_ROOT,
      stdio: "inherit",
      env: { ...process.env },
      windowsHide: false,
    });
  }

  devServerProcess.on("error", (err) => {
    console.error("[medicare-desktop] Failed to start Vite dev server:", err);
  });
}

function stopWebappDevServer() {
  if (!devServerProcess) return;
  const proc = devServerProcess;
  devServerProcess = null;
  try {
    if (isWin()) {
      const cmd = process.env.ComSpec || "cmd.exe";
      spawn(cmd, ["/d", "/c", "taskkill", "/pid", String(proc.pid), "/f", "/t"], {
        windowsHide: true,
        stdio: "ignore",
      });
    } else {
      proc.kill("SIGTERM");
    }
  } catch {
    /* ignore */
  }
}

function createWindow(startUrl) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 640,
    title: "MedProz — Your AI Medical Helpline",
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(startUrl);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    resolvedStartUrl = WEBAPP_URL || "";

    if (!resolvedStartUrl) {
      const port = DEFAULT_DEV_PORT;
      resolvedStartUrl = `http://127.0.0.1:${port}`;
      startWebappDevServer(port);
      await waitForServer(resolvedStartUrl, 120_000);
    }

    createWindow(resolvedStartUrl);

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0 && resolvedStartUrl) {
        createWindow(resolvedStartUrl);
      }
    });
  } catch (e) {
    console.error(e);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  stopWebappDevServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopWebappDevServer();
});
