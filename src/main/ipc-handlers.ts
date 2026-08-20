import { ipcMain } from "electron";
import {
  saveTemplate,
  listTemplates,
  loadTemplate,
  deleteTemplate
} from "./template-store";

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
}
