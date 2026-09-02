import { ipcMain, BrowserWindow, dialog, shell } from "electron";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
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
import { listSystemFonts } from "./system-fonts";
import { parseDocxFile } from "./docx-import";
import { sanitizeFilename } from "../shared/sanitizeFilename";
import { resolvePageDimensions } from "../shared/pageLayout";
import type { PageLayout } from "../shared/pageLayout";
import type { ExportPayload, FillValuesSnapshot } from "../shared/types";

// PDF export always generates a real PDF this way — printToPDF, no OS/driver
// involvement, confirmed correct.
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

// Prints a PDF buffer silently (no OS dialog) by loading it into a hidden
// window and calling print() there. The margins are already baked into the
// PDF from the printToPDF call that produced it (correct, inches-based —
// see pdfPrintOptions above), so marginType:"none" here just means "don't
// add another layer of margin on top" — it isn't a numeric unit, sidestepping
// the print()-margins-are-in-undocumented-pixels problem entirely. Electron's
// built-in PDF viewer (enabled via webPreferences.plugins) renders the file
// so print() has a printable document to act on.
async function printPdfSilently(
  buffer: Buffer,
  deviceName?: string,
  copies?: number
): Promise<void> {
  const tempPath = path.join(os.tmpdir(), `bundle-print-${randomUUID()}.pdf`);
  await fs.writeFile(tempPath, buffer);

  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: { plugins: true }
  });

  try {
    await printWindow.loadURL(pathToFileURL(tempPath).toString());
    // Electron's built-in PDF viewer is itself a page that finishes loading
    // (did-finish-load, resolved by loadURL above) before the PDF plugin it
    // hosts has actually painted the document — printing immediately is a
    // long-documented Electron/Chromium race that silently produces a
    // blank page (see electron/electron#30947, #26448). There's no reliable
    // "PDF finished rendering" event to await instead, so this grace delay
    // is the same workaround used in practice by other Electron apps hitting
    // this race.
    await new Promise(resolve => setTimeout(resolve, 700));
    await new Promise<void>((resolve, reject) => {
      printWindow.webContents.print(
        {
          silent: true,
          deviceName,
          copies: copies && copies > 0 ? copies : 1,
          printBackground: true,
          margins: { marginType: "none" }
        },
        (success, failureReason) => {
          if (success || failureReason === "Print job canceled") resolve();
          else reject(new Error(failureReason));
        }
      );
    });
  } finally {
    printWindow.destroy();
    await fs.unlink(tempPath).catch(() => {});
  }
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

  ipcMain.handle("template:import-docx", async event => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) throw new Error("No window found for import request");

    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      properties: ["openFile"],
      filters: [{ name: "Word Document", extensions: ["docx"] }]
    });
    if (canceled || !filePaths[0]) return null;

    try {
      const buffer = await fs.readFile(filePaths[0]);
      return await parseDocxFile(buffer, filePaths[0]);
    } catch {
      throw new Error(
        "Could not read that Word document — it may be corrupted or in an unsupported format."
      );
    }
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
    async (
      event,
      pageLayout: PageLayout,
      deviceName?: string,
      copies?: number
    ) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) throw new Error("No window found for print request");

      // Every size prints through the same proven, inches-based printToPDF
      // pipeline used for PDF export — no more native print()-margin
      // ambiguity. Custom keeps the older PDF-then-open flow (unaffected by
      // this redesign, and Chromium's print() has previously proved
      // unreliable validating a custom pageSize against the printer
      // driver's own supported list); named sizes print silently via a
      // hidden window instead of surfacing the OS dialog.
      const pageDimensions = resolvePageDimensions(pageLayout);
      const buffer = await win.webContents.printToPDF(
        pdfPrintOptions(pageDimensions)
      );

      if (pageLayout.size === "custom") {
        const tempPath = path.join(
          os.tmpdir(),
          `bundle-print-${randomUUID()}.pdf`
        );
        await fs.writeFile(tempPath, buffer);

        const openError = await shell.openPath(tempPath);
        if (openError) throw new Error(openError);
        return;
      }

      await printPdfSilently(buffer, deviceName, copies);
    }
  );

  ipcMain.handle("document:list-printers", async event => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) throw new Error("No window found for printer list request");

    const printers = await win.webContents.getPrintersAsync();
    return printers.map(p => ({
      name: p.name,
      displayName: p.displayName
    }));
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

  ipcMain.handle("fonts:list", async () => {
    return listSystemFonts();
  });
}
