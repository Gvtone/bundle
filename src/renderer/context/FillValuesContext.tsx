import { createContext, useCallback, useContext, useState } from "react";

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
}

const FillValuesContext = createContext<FillValuesContextValue | undefined>(
  undefined
);

export function FillValuesProvider({
  children
}: {
  children: React.ReactNode;
}) {
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
        setIsCapturingSnapshot
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
