import { useNavigate } from "react-router";
import { useTemplates } from "@/renderer/context/TemplatesContext";
import type { ImportedDocxTemplate } from "@/shared/types";

export function useCreateTemplate() {
  const navigate = useNavigate();
  const { refetch } = useTemplates();

  async function createTemplate() {
    const saved = await window.bundle.saveTemplate(
      {
        name: "Untitled Template",
        category: "Drafts",
        placeholders: []
      },
      { type: "doc", content: [{ type: "paragraph" }] }
    );

    refetch();
    navigate(`/templates/${saved.id}/edit`);
  }

  // Returns skippedImageCount so the caller (NewTemplateButton) can decide
  // whether to show a toast — this hook doesn't know about toasts itself,
  // consistent with createTemplate() above never reaching into UI concerns.
  async function createTemplateFromImport(
    imported: ImportedDocxTemplate
  ): Promise<number> {
    const saved = await window.bundle.saveTemplate(
      {
        name: imported.suggestedName || "Untitled Template",
        category: "Drafts",
        placeholders: [],
        pageLayout: imported.pageLayout
      },
      imported.content
    );

    refetch();
    navigate(`/templates/${saved.id}/edit`);
    return imported.skippedImageCount;
  }

  return { createTemplate, createTemplateFromImport };
}
