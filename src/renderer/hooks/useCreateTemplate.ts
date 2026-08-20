import { useNavigate } from "react-router";
import { useTemplates } from "@/renderer/context/TemplatesContext";

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

  return { createTemplate };
}
