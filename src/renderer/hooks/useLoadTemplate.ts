import { useState, useEffect } from "react";
import { useParams } from "react-router";
import type { Template } from "@/shared/types";

interface LoadedTemplate {
  meta: Template;
  content: unknown;
}

export function useLoadTemplate() {
  const { templateId } = useParams();
  const [template, setTemplate] = useState<LoadedTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!templateId) return;

    setLoading(true);
    window.bundle
      .loadTemplate(templateId)
      .then(setTemplate)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [templateId]);

  return { template, loading, error };
}
