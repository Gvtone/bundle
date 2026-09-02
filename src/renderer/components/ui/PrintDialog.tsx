import { createPortal } from "react-dom";
import Button from "./Button";
import Input from "./Input";
import type { PrinterInfo } from "@/shared/types";

interface PrintDialogProps {
  open: boolean;
  countLabel: string;
  printers: PrinterInfo[];
  loading: boolean;
  printing: boolean;
  selectedPrinter: string;
  onSelectPrinter: (name: string) => void;
  copies: number;
  onCopiesChange: (copies: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function PrintDialog({
  open,
  countLabel,
  printers,
  loading,
  printing,
  selectedPrinter,
  onSelectPrinter,
  copies,
  onCopiesChange,
  onConfirm,
  onCancel
}: PrintDialogProps) {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 print:hidden"
      onClick={onCancel}
    >
      <div
        className="w-80 rounded-lg border border-border bg-card p-4 shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Print</h3>
          <p className="text-xs text-muted-foreground">{countLabel}</p>
        </div>

        <label className="mt-3 block text-xs text-muted-foreground">
          Printer
        </label>
        {loading ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Loading printers…
          </p>
        ) : printers.length === 0 ? (
          <p className="mt-1 text-xs text-muted-foreground">
            No printers found.
          </p>
        ) : (
          <select
            value={selectedPrinter}
            onChange={e => onSelectPrinter(e.target.value)}
            className="mt-1 text-sm bg-card-muted border border-border rounded-md px-2 py-1 w-full transition-all duration-200 focus:outline-none"
          >
            {printers.map(p => (
              <option key={p.name} value={p.name}>
                {p.displayName || p.name}
              </option>
            ))}
          </select>
        )}

        <label className="mt-3 block text-xs text-muted-foreground">
          Copies
        </label>
        <Input
          type="number"
          min={1}
          scale="sm"
          fullWidth
          className="mt-1"
          value={copies}
          onChange={e => {
            const value = Number(e.target.value);
            onCopiesChange(Number.isFinite(value) && value >= 1 ? value : 1);
          }}
        />

        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={printing}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={loading || printing || printers.length === 0}
          >
            {printing ? "Printing…" : "Print"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default PrintDialog;
