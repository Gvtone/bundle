import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import Button from "../ui/Button";

interface RowSelectorProps {
  currentRow: number;
  rowCount: number;
  mismatchMessage: string | null;
  onChange: (row: number) => void;
}

function RowSelector({
  currentRow,
  rowCount,
  mismatchMessage,
  onChange
}: RowSelectorProps) {
  if (mismatchMessage) {
    return (
      <div className="flex items-center justify-center px-4 py-2 bg-card-muted border-b border-border text-xs text-red-600 print:hidden">
        Row counts don't match — {mismatchMessage}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 px-4 py-2 bg-card-muted border-b border-border text-xs print:hidden">
      <Button
        variant="tertiary"
        size="icon"
        disabled={currentRow === 0}
        onClick={() => onChange(currentRow - 1)}
      >
        <CaretLeftIcon />
      </Button>
      <span>
        Row {currentRow + 1} of {rowCount}
      </span>
      <Button
        variant="tertiary"
        size="icon"
        disabled={currentRow >= rowCount - 1}
        onClick={() => onChange(currentRow + 1)}
      >
        <CaretRightIcon />
      </Button>
    </div>
  );
}

export default RowSelector;
