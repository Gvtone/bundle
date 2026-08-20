import { useState, useEffect } from "react";
import type { Template } from "../../shared/types";

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    window.bundle
      .listTemplates()
      .then(setTemplates)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { templates, loading, error };
}
