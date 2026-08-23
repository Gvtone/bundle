import { useEffect, useRef, useState, type ReactNode } from "react";
import Button from "../ui/Button";

interface ActionMenuButtonProps {
  label: string;
  icon: ReactNode;
  variant?: "primary" | "secondary" | "tertiary" | "muted";
  primaryHandler: (() => void) | null;
  allHandler: (() => void) | null;
  allDisabledReason: string | null;
  showMenu: boolean;
  rowCount: number;
}

function ActionMenuButton({
  label,
  icon,
  variant,
  primaryHandler,
  allHandler,
  allDisabledReason,
  showMenu,
  rowCount
}: ActionMenuButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!showMenu) {
    return (
      <Button
        size="sm"
        variant={variant}
        className="text-xs items-center"
        onClick={() => primaryHandler?.()}
        disabled={!primaryHandler}
      >
        {icon}
        {label}
      </Button>
    );
  }

  return (
    <div className="relative flex" ref={ref}>
      <Button
        size="sm"
        variant={variant}
        className="text-xs items-center"
        onClick={() => setOpen(o => !o)}
      >
        {icon}
        {label}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 flex flex-col bg-card border border-border rounded-lg shadow-md p-1 min-w-44">
          <button
            className="text-left text-xs px-3 py-1.5 rounded-md hover:bg-border disabled:opacity-50 disabled:pointer-events-none"
            onClick={() => {
              primaryHandler?.();
              setOpen(false);
            }}
            disabled={!primaryHandler}
          >
            {label} current row
          </button>
          <button
            className="text-left text-xs px-3 py-1.5 rounded-md hover:bg-border disabled:opacity-50 disabled:pointer-events-none"
            onClick={() => {
              allHandler?.();
              setOpen(false);
            }}
            disabled={!allHandler}
            title={!allHandler ? (allDisabledReason ?? undefined) : undefined}
          >
            {label} all {rowCount} rows
          </button>
        </div>
      )}
    </div>
  );
}

export default ActionMenuButton;
