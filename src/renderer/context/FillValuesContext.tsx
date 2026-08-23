import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useParams } from "react-router";

interface FillValuesContextValue {
  values: Record<string, string>;
  setValue: (id: string, value: string) => void;
  listEnabled: Record<string, boolean>;
  setListEnabled: (id: string, enabled: boolean) => void;
  listValues: Record<string, string[]>;
  setListRows: (id: string, rawText: string) => void;
  currentRow: number;
  setCurrentRow: (row: number) => void;
  isCapturingSnapshot: boolean;
  setIsCapturingSnapshot: (value: boolean) => void;
  clearField: (id: string) => void;
  clearAll: () => void;
}

const FillValuesContext = createContext<FillValuesContextValue | undefined>(
  undefined
);

const SAVE_DEBOUNCE_MS = 500;

export function FillValuesProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const { templateId } = useParams();
  const [singleValues, setSingleValues] = useState<Record<string, string>>(
    {}
  );
  const [listEnabled, setListEnabledState] = useState<
    Record<string, boolean>
  >({});
  const [listValues, setListValuesState] = useState<
    Record<string, string[]>
  >({});
  const [currentRow, setCurrentRow] = useState(0);
  const [isCapturingSnapshot, setIsCapturingSnapshot] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Reset in-memory state and load the new template's persisted snapshot
  // whenever the route's templateId changes, so switching templates doesn't
  // briefly show the previous template's values.
  useEffect(() => {
    setLoaded(false);
    setSingleValues({});
    setListEnabledState({});
    setListValuesState({});
    setCurrentRow(0);

    if (!templateId) return;

    let canceled = false;
    window.bundle.loadFillValues(templateId).then(snapshot => {
      if (canceled) return;
      if (snapshot) {
        setSingleValues(snapshot.values);
        setListEnabledState(snapshot.listEnabled);
        setListValuesState(snapshot.listValues);
      }
      setLoaded(true);
    });

    return () => {
      canceled = true;
    };
  }, [templateId]);

  // Debounced autosave — skipped until the initial load completes so we
  // never overwrite a saved snapshot with the pre-load empty state.
  useEffect(() => {
    if (!templateId || !loaded) return;

    const timer = setTimeout(() => {
      window.bundle.saveFillValues(templateId, {
        values: singleValues,
        listEnabled,
        listValues
      });
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [templateId, loaded, singleValues, listEnabled, listValues]);

  const setValue = useCallback(
    (id: string, value: string) => {
      if (listEnabled[id]) {
        setListValuesState(prev => {
          const rows = [...(prev[id] ?? [])];
          rows[currentRow] = value;
          return { ...prev, [id]: rows };
        });
      } else {
        setSingleValues(prev => ({ ...prev, [id]: value }));
      }
    },
    [listEnabled, currentRow]
  );

  const setListEnabled = useCallback(
    (id: string, enabled: boolean) => {
      setListEnabledState(prev => ({ ...prev, [id]: enabled }));

      if (enabled) {
        setListValuesState(prev =>
          prev[id]?.length
            ? prev
            : { ...prev, [id]: [singleValues[id] ?? ""] }
        );
      } else {
        setSingleValues(prev => ({
          ...prev,
          [id]: listValues[id]?.[currentRow] ?? ""
        }));
      }
    },
    [singleValues, listValues, currentRow]
  );

  const setListRows = useCallback((id: string, rawText: string) => {
    setListValuesState(prev => ({ ...prev, [id]: rawText.split("\n") }));
  }, []);

  const clearField = useCallback(
    (id: string) => {
      setSingleValues(prev => ({ ...prev, [id]: "" }));
      if (listEnabled[id]) {
        setListValuesState(prev => ({ ...prev, [id]: [""] }));
        setCurrentRow(0);
      }
    },
    [listEnabled]
  );

  const clearAll = useCallback(() => {
    setSingleValues({});
    setListEnabledState({});
    setListValuesState({});
    setCurrentRow(0);
    if (templateId) window.bundle.clearFillValues(templateId);
  }, [templateId]);

  const values: Record<string, string> = {};
  for (const id of new Set([
    ...Object.keys(singleValues),
    ...Object.keys(listEnabled)
  ])) {
    values[id] = listEnabled[id]
      ? (listValues[id]?.[currentRow] ?? "")
      : (singleValues[id] ?? "");
  }

  return (
    <FillValuesContext.Provider
      value={{
        values,
        setValue,
        listEnabled,
        setListEnabled,
        listValues,
        setListRows,
        currentRow,
        setCurrentRow,
        isCapturingSnapshot,
        setIsCapturingSnapshot,
        clearField,
        clearAll
      }}
    >
      {children}
    </FillValuesContext.Provider>
  );
}

export function useFillValues() {
  const ctx = useContext(FillValuesContext);
  if (!ctx) {
    throw new Error("useFillValues must be used inside FillValuesProvider");
  }
  return ctx;
}
