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
import { listSystemFonts } from "./system-fonts";
import { sanitizeFilename } from "../shared/sanitizeFilename";
import { PAGE_SIZES, resolvePageDimensions } from "../shared/pageLayout";
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

// webContents.print()'s pageSize only accepts a fixed enum ('A3'/'A4'/'A5'/
// 'Legal'/'Letter'/'Tabloid') or a custom {width,height} IN MICRONS — a
// different unit from printToPDF's inches (pdfPrintOptions above) and from
// PageLayout's own px-at-96dpi (pageLayout.ts). Folio has no matching enum
// entry, so it goes through the custom-Size branch, converted from the same
// PAGE_SIZES.folio px values pageLayout.ts already defines (not hardcoded
// twice) — Chromium validates/snaps custom sizes against the printer
// driver's own supported list, a known reliability risk accepted
// specifically for Folio. "custom" (the page-size option, not to be
// confused with a custom pageSize Size object) isn't handled here at all —
// see the size === "custom" branch in the print handler below, which keeps
// the older PDF-then-open flow instead.
const MICRONS_PER_PX_AT_96DPI = 25400 / 96;

const NATIVE_PAGE_SIZE_NAMES: Record<"letter" | "a4" | "legal", "Letter" | "A4" | "Legal"> = {
  letter: "Letter",
  a4: "A4",
  legal: "Legal"
};

function nativePageSize(
  size: "letter" | "a4" | "legal" | "folio"
): "Letter" | "A4" | "Legal" | { width: number; height: number } {
  if (size === "folio") {
    return {
      width: Math.round(PAGE_SIZES.folio.width * MICRONS_PER_PX_AT_96DPI),
      height: Math.round(PAGE_SIZES.folio.height * MICRONS_PER_PX_AT_96DPI)
    };
  }
  return NATIVE_PAGE_SIZE_NAMES[size];
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

      if (pageLayout.size === "custom") {
        // Electron's native print() validates a custom pageSize against the
        // printer driver's own supported list and has previously proved
        // unreliable for this app's Custom page size — keep generating a
        // PDF and handing it to the OS's default viewer instead.
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
        return;
      }

      // Named sizes go through the real OS print dialog. print()'s margins
      // are plain PIXELS (unlike printToPDF's inches above) — pageLayout.margins
      // is already px at 96dpi, so no unit conversion is needed here at all.
      // `size` is narrowed to a local const (not read as pageLayout.size
      // below) because TS control-flow narrowing on a parameter doesn't
      // persist inside the Promise executor closure.
      const size = pageLayout.size;
      await new Promise<void>((resolve, reject) => {
        win.webContents.print(
          {
            pageSize: nativePageSize(size),
            landscape: pageLayout.orientation === "landscape",
            margins: {
              marginType: "custom",
              top: pageLayout.margins,
              bottom: pageLayout.margins,
              left: pageLayout.margins,
              right: pageLayout.margins
            },
            printBackground: true
          },
          (success, failureReason) => {
            if (success) resolve();
            else reject(new Error(failureReason));
          }
        );
      });
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

  ipcMain.handle("fonts:list", async () => {
    return listSystemFonts();
  });
}
