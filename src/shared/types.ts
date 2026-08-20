export interface PlaceholderStyle {
  bold: boolean;
  italic: boolean;
  fontSize?: number;
  fontFamily?: string;
}

export interface Placeholder {
  id: string;
  key: string;
  label: string;
  type: "text" | "date" | "paragraph";
  style: PlaceholderStyle;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  placeholders: Placeholder[];
}

export interface BundleApi {
  saveTemplate: (
    template: Partial<Template>,
    content: unknown
  ) => Promise<Template>;
  listTemplates: () => Promise<Template[]>;
  loadTemplate: (id: string) => Promise<{ meta: Template; content: unknown }>;
  deleteTemplate: (id: string) => Promise<void>;
}
