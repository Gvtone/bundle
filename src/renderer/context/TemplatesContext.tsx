import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";
import type { Template } from "@/shared/types";

interface TemplatesContextValue {
  templates: Template[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

// The context itself — undefined by default so we can detect if someone
// uses it outside the provider (which would be a bug)
const TemplatesContext = createContext<TemplatesContextValue | undefined>(
  undefined
);

// The provider — owns the state, wraps whatever needs access to it
export function TemplatesProvider({ children }: { children: React.ReactNode }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    window.bundle
      .listTemplates()
      .then(setTemplates)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <TemplatesContext.Provider value={{ templates, loading, error, refetch }}>
      {children}
    </TemplatesContext.Provider>
  );
}

// The hook — what components actually import and call
// Throws if used outside the provider, which catches wiring mistakes early
export function useTemplates() {
  const ctx = useContext(TemplatesContext);
  if (!ctx) {
    throw new Error("useTemplates must be used inside TemplatesProvider");
  }
  return ctx;
}
