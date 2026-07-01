import fs from "node:fs/promises";
import path from "node:path";
import { app, BrowserWindow } from "electron";

interface WindowState {
  width: number;
  height: number;
  isMaximized: boolean;
}

const prefsPath = path.join(app.getPath("userData"), "prefs.json");

export async function getWindowState(): Promise<WindowState> {
  try {
    const raw = await fs.readFile(prefsPath, "utf-8");
    return (
      JSON.parse(raw).windowState ?? {
        width: 1024,
        height: 768,
        isMaximized: false
      }
    );
  } catch {
    return { width: 1024, height: 768, isMaximized: false };
  }
}

export async function saveWindowState(win: BrowserWindow): Promise<void> {
  const isMaximized = win.isMaximized();
  const { width, height } = win.getBounds();
  const current = await getWindowState().catch(() => ({}));
  await fs.writeFile(
    prefsPath,
    JSON.stringify({
      ...current,
      windowState: { width, height, isMaximized }
    })
  );
}
