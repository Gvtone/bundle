import { useState, useEffect, useCallback } from "react";
import type { Template } from "../../shared/types";

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    window.bundle
      .listTemplates()
      .then(setTemplates)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { templates, loading, error, refetch: fetch };
}
