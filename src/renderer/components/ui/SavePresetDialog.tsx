import { useState } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";
import Input from "./Input";

interface SavePresetDialogProps {
  open: boolean;
  onSave: (name: string) => void;
  onCancel: () => void;
}

function SavePresetDialog({ open, onSave, onCancel }: SavePresetDialogProps) {
  const [name, setName] = useState("");

  if (!open) return null;

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setName("");
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="w-80 rounded-lg border border-border bg-card p-4 shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold">Save preset</h3>
        <Input
          autoFocus
          fullWidth
          scale="sm"
          className="mt-3"
          placeholder="Preset name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") handleSave();
          }}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!name.trim()}>
            Save
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default SavePresetDialog;
