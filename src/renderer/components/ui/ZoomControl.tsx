import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import Button from "./Button";

interface ZoomControlProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

function ZoomControl({ zoom, onZoomIn, onZoomOut, onReset }: ZoomControlProps) {
  return (
    <div className="absolute bottom-4 right-8 flex items-center gap-1 bg-card border border-border rounded-full p-1 shadow-md print:hidden">
      <Button
        variant="tertiary"
        size="icon"
        className="rounded-full"
        onClick={onZoomOut}
      >
        <MinusIcon />
      </Button>
      <button
        onClick={onReset}
        title="Reset zoom"
        className="text-xs w-10 text-center text-muted-foreground hover:text-foreground cursor-pointer"
      >
        {zoom}%
      </button>
      <Button
        variant="tertiary"
        size="icon"
        className="rounded-full"
        onClick={onZoomIn}
      >
        <PlusIcon />
      </Button>
    </div>
  );
}

export default ZoomControl;
