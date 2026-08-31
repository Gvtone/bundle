import { app, BrowserWindow, ipcMain, Menu } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import { getWindowState, saveWindowState } from "./pref-store";
import { registerIpcHandlers } from "./ipc-handlers";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Self-contained branded loading indicator shown immediately on window
// create, before Vite/React/the initial template-list IPC round trip
// finish — a data URL avoids needing Forge/Vite to bundle a separate
// static asset for a screen this simple. Fixed light-theme colors since
// the user's dark/light preference lives in the renderer's own
// localStorage, not anywhere the main process can read before it exists.
const SPLASH_HTML = `<!doctype html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#ede9e1;font-family:system-ui,sans-serif;-webkit-app-region:drag;">
  <div style="display:flex;flex-direction:column;align-items:center;gap:16px;">
    <div style="width:40px;height:40px;border-radius:8px;background:#6e7d63;display:flex;align-items:center;justify-content:center;">
      <div style="width:14px;height:14px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
    </div>
    <span style="font-weight:700;color:#34302a;font-size:14px;">Bundle</span>
  </div>
  <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
</body>
</html>`;

async function createWindow() {
  const splash = new BrowserWindow({
    width: 280,
    height: 280,
    frame: false,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    show: true
  });
  splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(SPLASH_HTML)}`);

  const { width, height, isMaximized } = await getWindowState();

  const mainWindow = new BrowserWindow({
    width,
    height,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    },
    titleBarStyle: "hidden",
    ...(process.platform !== "darwin"
      ? {
          titleBarOverlay: {
            height: 40,
            color: "#00000000",
            symbolColor: "#888888"
          }
        }
      : {})
  });

  if (isMaximized) mainWindow.maximize();

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Two independent signals gate the swap — whichever fires last wins:
  //  - "ready-to-show" is Electron's own event for "the page has actually
  //    been painted, not just loaded — safe to display with no flash."
  //    Firing this alone isn't enough on its own, since it can fire on the
  //    very first paint of an empty/loading shell, well before real data
  //    has arrived.
  //  - "app:renderer-ready" is the renderer's explicit signal (via
  //    notifyReady() — see RootLayout.tsx) that the initial template list
  //    has actually loaded, not just that some frame was painted.
  // Waiting on both avoids ever showing a window that's either unpainted
  // or painted-but-still-blank-of-real-content. Confirmed via timestamped
  // logging (2026-08-31) that both signals do land together at the actual
  // end of loading, not early — the ~2.5s gap users saw under `npm start`
  // is Vite dev-server handshake/transform time before React even mounts,
  // not a bug in this gating logic. Packaged builds don't pay that cost.
  let pageReady = false;
  let dataReady = false;
  const maybeShowMainWindow = () => {
    if (!pageReady || !dataReady) return;
    if (splash.isDestroyed()) return;
    splash.destroy();
    mainWindow.show();
  };

  mainWindow.once("ready-to-show", () => {
    pageReady = true;
    maybeShowMainWindow();
  });

  const onRendererReady = () => {
    dataReady = true;
    maybeShowMainWindow();
  };
  ipcMain.once("app:renderer-ready", onRendererReady);
  mainWindow.once("closed", () => {
    ipcMain.removeListener("app:renderer-ready", onRendererReady);
  });

  mainWindow.webContents.openDevTools();
  mainWindow.on("close", e => {
    e.preventDefault();
    saveWindowState(mainWindow).finally(() => mainWindow.destroy());
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  Menu.setApplicationMenu(null);
  registerIpcHandlers();
  createWindow().catch(console.error);
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
