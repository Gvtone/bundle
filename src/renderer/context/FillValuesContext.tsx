import { createContext, useCallback, useContext, useState } from "react";

interface FillValuesContextValue {
  values: Record<string, string>;
  setValue: (id: string, value: string) => void;
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
  const [values, setValues] = useState<Record<string, string>>({});
  const [isCapturingSnapshot, setIsCapturingSnapshot] = useState(false);

  const setValue = useCallback((id: string, value: string) => {
    setValues(prev => ({ ...prev, [id]: value }));
  }, []);

  return (
    <FillValuesContext.Provider
      value={{ values, setValue, isCapturingSnapshot, setIsCapturingSnapshot }}
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
