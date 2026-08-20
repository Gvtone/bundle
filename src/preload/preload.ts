import { contextBridge, ipcRenderer } from "electron";
import type { BundleApi } from "../shared/types";

const api: BundleApi = {
  saveTemplate: (template, content) =>
    ipcRenderer.invoke("template:save", template, content),
  listTemplates: () => ipcRenderer.invoke("template:list"),
  loadTemplate: id => ipcRenderer.invoke("template:load", id),
  deleteTemplate: id => ipcRenderer.invoke("template:delete", id)
};

contextBridge.exposeInMainWorld("bundle", api);
