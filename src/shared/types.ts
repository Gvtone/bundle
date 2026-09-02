import type { PageLayout } from "./pageLayout";

export type DateFormatKey = "long";

export interface PlaceholderStyle {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontSize?: number;
  fontFamily?: string;
}

export interface Placeholder {
  id: string;
  key: string;
  label: string;
  type: "text" | "date" | "paragraph";
  style: PlaceholderStyle;
  dateFormat?: DateFormatKey;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  placeholders: Placeholder[];
  pageLayout?: PageLayout;
}

export type ExportFormat = "pdf" | "docx";

export interface ExportPayload {
  templateName: string;
  format: ExportFormat;
  content: unknown;
  placeholders: Placeholder[];
  values: Record<string, string>;
  pageLayout: PageLayout;
  destinationPath?: string; // when set, document:export writes here directly, skipping its save dialog
}

export interface ExportResult {
  canceled: boolean;
  filePath?: string;
}

export interface ChooseFolderResult {
  canceled: boolean;
  folderPath?: string;
}

export interface FillValuesSnapshot {
  values: Record<string, string>;
  listEnabled: Record<string, boolean>;
  listValues: Record<string, string[]>;
}

export interface Preset {
  id: string;
  name: string;
  createdAt: string;
  snapshot: FillValuesSnapshot;
}

export interface ImportedDocxTemplate {
  content: unknown;
  pageLayout: PageLayout;
  suggestedName: string;
  skippedImageCount: number;
}

export interface PrinterInfo {
  name: string;
  displayName: string;
}

export interface BundleApi {
  saveTemplate: (
    template: Partial<Template>,
    content: unknown
  ) => Promise<Template>;
  listTemplates: () => Promise<Template[]>;
  loadTemplate: (id: string) => Promise<{ meta: Template; content: unknown }>;
  deleteTemplate: (id: string) => Promise<void>;
  exportDocument: (payload: ExportPayload) => Promise<ExportResult>;
  printDocument: (
    pageLayout: PageLayout,
    deviceName?: string,
    copies?: number
  ) => Promise<void>;
  listPrinters: () => Promise<PrinterInfo[]>;
  chooseExportFolder: () => Promise<ChooseFolderResult>;
  saveFillValues: (
    templateId: string,
    snapshot: FillValuesSnapshot
  ) => Promise<void>;
  loadFillValues: (templateId: string) => Promise<FillValuesSnapshot | null>;
  clearFillValues: (templateId: string) => Promise<void>;
  savePreset: (
    templateId: string,
    name: string,
    snapshot: FillValuesSnapshot
  ) => Promise<Preset>;
  listPresets: (templateId: string) => Promise<Preset[]>;
  deletePreset: (templateId: string, presetId: string) => Promise<void>;
  notifyReady: () => void;
  listSystemFonts: () => Promise<string[]>;
  importDocxTemplate: () => Promise<ImportedDocxTemplate | null>;
}
