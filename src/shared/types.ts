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
}

export type ExportFormat = "pdf" | "docx";

export interface ExportPayload {
  templateName: string;
  format: ExportFormat;
  content: unknown;
  placeholders: Placeholder[];
  values: Record<string, string>;
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

export interface BundleApi {
  saveTemplate: (
    template: Partial<Template>,
    content: unknown
  ) => Promise<Template>;
  listTemplates: () => Promise<Template[]>;
  loadTemplate: (id: string) => Promise<{ meta: Template; content: unknown }>;
  deleteTemplate: (id: string) => Promise<void>;
  exportDocument: (payload: ExportPayload) => Promise<ExportResult>;
  printDocument: () => Promise<void>;
  chooseExportFolder: () => Promise<ChooseFolderResult>;
  saveFillValues: (
    templateId: string,
    snapshot: FillValuesSnapshot
  ) => Promise<void>;
  loadFillValues: (templateId: string) => Promise<FillValuesSnapshot | null>;
  clearFillValues: (templateId: string) => Promise<void>;
}
