import { ipcMain, BrowserWindow, dialog } from "electron";
import fs from "node:fs/promises";
import {
  saveTemplate,
  listTemplates,
  loadTemplate,
  deleteTemplate
} from "./template-store";
import {
  saveFillValues,
  loadFillValues,
  clearFillValues
} from "./fill-values-store";
import { savePreset, listPresets, deletePreset } from "./preset-store";
import { buildDocx } from "./document-store";
import { sanitizeFilename } from "../shared/sanitizeFilename";
import type { ExportPayload, FillValuesSnapshot } from "../shared/types";

export function registerIpcHandlers() {
  ipcMain.handle("template:save", async (_event, template, content) => {
    return saveTemplate(template, content);
  });

  ipcMain.handle("template:list", async () => {
    return listTemplates();
  });

  ipcMain.handle("template:load", async (_event, id: string) => {
    return loadTemplate(id);
  });

  ipcMain.handle("template:delete", async (_event, id: string) => {
    return deleteTemplate(id);
  });

  ipcMain.handle("document:export", async (event, payload: ExportPayload) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) throw new Error("No window found for export request");

    let filePath: string;
    if (payload.destinationPath) {
      filePath = payload.destinationPath;
    } else {
      const filename = sanitizeFilename(payload.templateName);
      const saveResult = await dialog.showSaveDialog(win, {
        defaultPath: `${filename}.${payload.format}`,
        filters:
          payload.format === "pdf"
            ? [{ name: "PDF", extensions: ["pdf"] }]
            : [{ name: "Word Document", extensions: ["docx"] }]
      });
      if (saveResult.canceled || !saveResult.filePath) {
        return { canceled: true };
      }
      filePath = saveResult.filePath;
    }

    const buffer =
      payload.format === "pdf"
        ? await win.webContents.printToPDF({
            pageSize: "Letter",
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            printBackground: true
          })
        : await buildDocx(payload);

    await fs.writeFile(filePath, buffer);
    return { canceled: false, filePath };
  });

  ipcMain.handle("document:print", async event => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) throw new Error("No window found for print request");

    return new Promise<void>((resolve, reject) => {
      win.webContents.print(
        { margins: { marginType: "none" }, printBackground: true },
        (success, failureReason) => {
          if (success || failureReason === "Print job canceled") {
            resolve();
          } else {
            reject(new Error(failureReason));
          }
        }
      );
    });
  });

  ipcMain.handle("document:choose-folder", async event => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) throw new Error("No window found for folder picker request");

    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"]
    });

    const folderPath = filePaths[0];
    if (canceled || !folderPath) return { canceled: true };
    return { canceled: false, folderPath };
  });

  ipcMain.handle(
    "values:save",
    async (_event, templateId: string, snapshot: FillValuesSnapshot) => {
      return saveFillValues(templateId, snapshot);
    }
  );

  ipcMain.handle("values:load", async (_event, templateId: string) => {
    return loadFillValues(templateId);
  });

  ipcMain.handle("values:clear", async (_event, templateId: string) => {
    return clearFillValues(templateId);
  });

  ipcMain.handle(
    "preset:save",
    async (
      _event,
      templateId: string,
      name: string,
      snapshot: FillValuesSnapshot
    ) => {
      return savePreset(templateId, name, snapshot);
    }
  );

  ipcMain.handle("preset:list", async (_event, templateId: string) => {
    return listPresets(templateId);
  });

  ipcMain.handle(
    "preset:delete",
    async (_event, templateId: string, presetId: string) => {
      return deletePreset(templateId, presetId);
    }
  );
}
