import { useEffect, useRef, useState } from "react";
import { CaretDownIcon, FilePlusIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import Button from "../ui/Button";
import { useCreateTemplate } from "@/renderer/hooks/useCreateTemplate";
import { cn } from "@/renderer/utils/utils";

interface NewTemplateButtonProps {
  fullWidth?: boolean;
  // Matches Sidebar's collapsed-rail state: icon-only, no dropdown affordance.
  collapsedLabel?: boolean;
}

function NewTemplateButton({ fullWidth, collapsedLabel }: NewTemplateButtonProps) {
  const { createTemplate, createTemplateFromImport } = useCreateTemplate();
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

  async function handleImport() {
    setOpen(false);
    const imported = await window.bundle.importDocxTemplate();
    if (!imported) return;

    const skippedImageCount = await createTemplateFromImport(imported);
    if (skippedImageCount > 0) {
      toast(
        `Imported — ${skippedImageCount} image${skippedImageCount === 1 ? "" : "s"} were skipped (not yet supported).`
      );
    }
  }

  return (
    <div className={cn("relative flex", fullWidth && "w-full")} ref={ref}>
      <Button
        fullWidth={fullWidth}
        className={cn(!collapsedLabel && "rounded-r-none", collapsedLabel && "size-10 p-0")}
        onClick={createTemplate}
      >
        <FilePlusIcon weight="bold" />
        <span className={collapsedLabel ? "hidden" : ""}>New Template</span>
      </Button>

      {!collapsedLabel && (
        <button
          type="button"
          aria-label="More new-template options"
          className="flex items-center justify-center px-2 bg-primary text-primary-foreground hover:bg-primary-hover rounded-r-lg border-l border-primary-foreground/20"
          onClick={() => setOpen(o => !o)}
        >
          <CaretDownIcon size={12} weight="bold" />
        </button>
      )}

      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 flex flex-col bg-card border border-border rounded-lg shadow-md p-1 min-w-44">
          <button
            className="text-left text-xs px-3 py-1.5 rounded-md hover:bg-border"
            onClick={handleImport}
          >
            Import from DOCX...
          </button>
        </div>
      )}
    </div>
  );
}

export default NewTemplateButton;
