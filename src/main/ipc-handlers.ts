import { ipcMain, BrowserWindow, dialog, shell } from "electron";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
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
import { resolvePageDimensions } from "../shared/pageLayout";
import type { PageLayout } from "../shared/pageLayout";
import type { ExportPayload, FillValuesSnapshot } from "../shared/types";

// Both PDF export and Print generate the PDF the same way — Print reuses
// this instead of webContents.print(), whose page-size/margin fidelity
// goes through the OS print pipeline (driver-dependent, e.g. "Microsoft
// Print to PDF" snapping custom sizes to its own supported list) and
// proved unreliable across two different unit conventions. printToPDF
// generates the PDF directly, no OS/driver involvement, and is confirmed
// correct.
function pdfPrintOptions(pageDimensions: {
  width: number;
  height: number;
  margins: number;
}) {
  return {
    pageSize: {
      width: pageDimensions.width / 96,
      height: pageDimensions.height / 96
    },
    margins: {
      marginType: "custom" as const,
      top: pageDimensions.margins / 96,
      bottom: pageDimensions.margins / 96,
      left: pageDimensions.margins / 96,
      right: pageDimensions.margins / 96
    },
    printBackground: true
  };
}

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

    const pageDimensions = resolvePageDimensions(payload.pageLayout);
    const buffer =
      payload.format === "pdf"
        ? await win.webContents.printToPDF(pdfPrintOptions(pageDimensions))
        : await buildDocx(payload);

    await fs.writeFile(filePath, buffer);
    return { canceled: false, filePath };
  });

  ipcMain.handle(
    "document:print",
    async (event, pageLayout: PageLayout) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) throw new Error("No window found for print request");
      const pageDimensions = resolvePageDimensions(pageLayout);

      const buffer = await win.webContents.printToPDF(
        pdfPrintOptions(pageDimensions)
      );
      const tempPath = path.join(
        os.tmpdir(),
        `bundle-print-${randomUUID()}.pdf`
      );
      await fs.writeFile(tempPath, buffer);

      const openError = await shell.openPath(tempPath);
      if (openError) throw new Error(openError);
    }
  );

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
