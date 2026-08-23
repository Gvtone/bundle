import { useEffect, useRef, useState } from "react";
import { TrashIcon, CaretDownIcon } from "@phosphor-icons/react";
import Button from "../ui/Button";
import ConfirmDialog from "../ui/ConfirmDialog";
import SavePresetDialog from "../ui/SavePresetDialog";
import type { Preset } from "@/shared/types";

interface PresetDropdownProps {
  presets: Preset[];
  onLoad: (preset: Preset) => void;
  onSaveNew: (name: string) => void;
  onDelete: (presetId: string) => void;
}

function PresetDropdown({
  presets,
  onLoad,
  onSaveNew,
  onDelete
}: PresetDropdownProps) {
  const [open, setOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Preset | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="secondary"
        size="sm"
        fullWidth
        contentPosition="between"
        onClick={() => setOpen(o => !o)}
      >
        Presets
        <CaretDownIcon size={14} />
      </Button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-20 flex flex-col bg-card border border-border rounded-lg shadow-md p-1 max-h-56 overflow-y-auto">
          {presets.length === 0 && (
            <p className="px-3 py-1.5 text-xs text-muted-foreground">
              No saved presets
            </p>
          )}
          {presets.map(preset => (
            <div
              key={preset.id}
              className="flex items-center justify-between rounded-md hover:bg-border"
            >
              <button
                className="flex-1 text-left text-xs px-3 py-1.5"
                onClick={() => {
                  onLoad(preset);
                  setOpen(false);
                }}
              >
                {preset.name}
              </button>
              <button
                className="px-2 py-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => setPendingDelete(preset)}
                title="Delete preset"
              >
                <TrashIcon size={13} />
              </button>
            </div>
          ))}

          <button
            className="text-left text-xs px-3 py-1.5 rounded-md hover:bg-border border-t border-border mt-1 pt-2"
            onClick={() => {
              setSaveDialogOpen(true);
              setOpen(false);
            }}
          >
            Save as new preset...
          </button>
        </div>
      )}

      <SavePresetDialog
        open={saveDialogOpen}
        onSave={name => {
          onSaveNew(name);
          setSaveDialogOpen(false);
        }}
        onCancel={() => setSaveDialogOpen(false)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete preset"
        description={`Delete "${pendingDelete?.name}"? This can't be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

export default PresetDropdown;
