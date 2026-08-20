import { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "react-router";
import type { Template } from "@/shared/types";

interface TemplateContextValue {
  meta: Template | null;
  content: unknown;
  loading: boolean;
  error: Error | null;
}

const TemplateContext = createContext<TemplateContextValue | undefined>(
  undefined
);

export function TemplateProvider({ children }: { children: React.ReactNode }) {
  const { templateId } = useParams();
  const [meta, setMeta] = useState<Template | null>(null);
  const [content, setContent] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!templateId) return;

    setLoading(true);
    window.bundle
      .loadTemplate(templateId)
      .then(({ meta, content }) => {
        setMeta(meta);
        setContent(content);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [templateId]);

  return (
    <TemplateContext.Provider value={{ meta, content, loading, error }}>
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplate() {
  const ctx = useContext(TemplateContext);
  if (!ctx) throw new Error("useTemplate must be used inside TemplateProvider");
  return ctx;
}
