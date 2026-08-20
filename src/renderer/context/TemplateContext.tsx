import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useParams } from "react-router";
import type { Template } from "@/shared/types";

interface TemplateContextValue {
  meta: Template | null;
  content: unknown;
  loading: boolean;
  error: Error | null;
  save: (() => Promise<void>) | null;
  setSaveHandler: (fn: (() => Promise<void>) | null) => void;
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
  const [save, setSave] = useState<(() => Promise<void>) | null>(null);
  const setSaveHandler = useCallback(
    (fn: (() => Promise<void>) | null) => setSave(() => fn),
    []
  );

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
    <TemplateContext.Provider
      value={{ meta, content, loading, error, save, setSaveHandler }}
    >
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplate() {
  const ctx = useContext(TemplateContext);
  if (!ctx) throw new Error("useTemplate must be used inside TemplateProvider");
  return ctx;
}
