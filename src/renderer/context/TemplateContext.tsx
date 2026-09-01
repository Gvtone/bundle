import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useParams } from "react-router";
import type { Placeholder, Template } from "@/shared/types";
import { DEFAULT_PAGE_LAYOUT, type PageLayout } from "@/shared/pageLayout";

export interface BulkExportState {
  hasListFields: boolean;
  rowCount: number;
  rowMismatchMessage: string | null;
  exportAllHandler: (() => void) | null;
  printAllHandler: (() => void) | null;
}

const DEFAULT_BULK_EXPORT_STATE: BulkExportState = {
  hasListFields: false,
  rowCount: 0,
  rowMismatchMessage: null,
  exportAllHandler: null,
  printAllHandler: null
};

interface TemplateContextValue {
  meta: Template | null;
  content: unknown;
  setContent: (content: unknown) => void;
  loading: boolean;
  error: Error | null;
  save: (() => Promise<void>) | null;
  setSaveHandler: (fn: (() => Promise<void>) | null) => void;
  placeholders: Placeholder[];
  updatePlaceholders: (updater: (prev: Placeholder[]) => Placeholder[]) => void;
  updatePageLayout: (updater: (prev: PageLayout) => PageLayout) => void;
  updateMeta: (updater: (prev: Template) => Template) => void;
  insertPlaceholder: (() => void) | null;
  setInsertPlaceholderHandler: (fn: (() => void) | null) => void;
  exportHandler: (() => void) | null;
  setExportHandler: (fn: (() => void) | null) => void;
  printHandler: (() => void) | null;
  setPrintHandler: (fn: (() => void) | null) => void;
  bulkExportState: BulkExportState;
  setBulkExportState: (state: BulkExportState) => void;
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

  const [insert, setInsert] = useState<(() => void) | null>(null);
  const setInsertPlaceholderHandler = useCallback(
    (fn: (() => void) | null) => setInsert(() => fn),
    []
  );

  const [exportHandler, setExportHandlerState] = useState<
    (() => void) | null
  >(null);
  const setExportHandler = useCallback(
    (fn: (() => void) | null) => setExportHandlerState(() => fn),
    []
  );

  const [printHandler, setPrintHandlerState] = useState<
    (() => void) | null
  >(null);
  const setPrintHandler = useCallback(
    (fn: (() => void) | null) => setPrintHandlerState(() => fn),
    []
  );

  const [bulkExportState, setBulkExportState] = useState<BulkExportState>(
    DEFAULT_BULK_EXPORT_STATE
  );

  const updatePlaceholders = useCallback(
    (updater: (prev: Placeholder[]) => Placeholder[]) => {
      setMeta(prev =>
        prev ? { ...prev, placeholders: updater(prev.placeholders) } : prev
      );
    },
    []
  );

  const updatePageLayout = useCallback(
    (updater: (prev: PageLayout) => PageLayout) => {
      setMeta(prev =>
        prev
          ? { ...prev, pageLayout: updater(prev.pageLayout ?? DEFAULT_PAGE_LAYOUT) }
          : prev
      );
    },
    []
  );

  const updateMeta = useCallback((updater: (prev: Template) => Template) => {
    setMeta(prev => (prev ? updater(prev) : prev));
  }, []);

  const placeholders = meta?.placeholders ?? [];

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
      value={{
        meta,
        content,
        setContent,
        loading,
        error,
        save,
        setSaveHandler,
        placeholders,
        updatePlaceholders,
        updatePageLayout,
        updateMeta,
        insertPlaceholder: insert,
        setInsertPlaceholderHandler,
        exportHandler,
        setExportHandler,
        printHandler,
        setPrintHandler,
        bulkExportState,
        setBulkExportState
      }}
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
