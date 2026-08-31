import { contextBridge, ipcRenderer } from "electron";
import type { BundleApi } from "../shared/types";

const api: BundleApi = {
  saveTemplate: (template, content) =>
    ipcRenderer.invoke("template:save", template, content),
  listTemplates: () => ipcRenderer.invoke("template:list"),
  loadTemplate: id => ipcRenderer.invoke("template:load", id),
  deleteTemplate: id => ipcRenderer.invoke("template:delete", id),
  exportDocument: payload => ipcRenderer.invoke("document:export", payload),
  printDocument: pageLayout =>
    ipcRenderer.invoke("document:print", pageLayout),
  chooseExportFolder: () => ipcRenderer.invoke("document:choose-folder"),
  saveFillValues: (templateId, snapshot) =>
    ipcRenderer.invoke("values:save", templateId, snapshot),
  loadFillValues: templateId => ipcRenderer.invoke("values:load", templateId),
  clearFillValues: templateId =>
    ipcRenderer.invoke("values:clear", templateId),
  savePreset: (templateId, name, snapshot) =>
    ipcRenderer.invoke("preset:save", templateId, name, snapshot),
  listPresets: templateId => ipcRenderer.invoke("preset:list", templateId),
  deletePreset: (templateId, presetId) =>
    ipcRenderer.invoke("preset:delete", templateId, presetId),
  notifyReady: () => ipcRenderer.send("app:renderer-ready")
};

contextBridge.exposeInMainWorld("bundle", api);
