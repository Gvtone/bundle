import { ClockCounterClockwiseIcon, GridFourIcon } from "@phosphor-icons/react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import type { Placeholder } from "@/shared/types";

interface ValueInputCardProps {
  placeholder: Placeholder;
  value: string;
  onChange: (value: string) => void;
  listEnabled: boolean;
  onToggleList: () => void;
  listText: string;
  onListTextChange: (text: string) => void;
}

function ValueInputCard({
  placeholder,
  value,
  onChange,
  listEnabled,
  onToggleList,
  listText,
  onListTextChange
}: ValueInputCardProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between">
        <div className="flex items-center gap-1">
          <p className="text-sm">{placeholder.label}</p>
          <p className="text-xs text-subtle-foreground font-serif">
            {`{{${placeholder.key}}}`}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant={listEnabled ? "secondary" : "muted"}
            size="xs"
            onClick={onToggleList}
          >
            <GridFourIcon /> List
          </Button>

          <Button variant="muted" size="xs">
            <ClockCounterClockwiseIcon size={15} />
          </Button>
        </div>
      </div>

      {listEnabled ? (
        <textarea
          value={listText}
          onChange={e => onListTextChange(e.target.value)}
          rows={4}
          placeholder="One value per line"
          className="w-full rounded-lg bg-card-muted border border-border px-3 py-2 text-sm focus:outline-none"
        />
      ) : placeholder.type === "paragraph" ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={4}
          className="w-full rounded-lg bg-card-muted border border-border px-3 py-2 text-sm focus:outline-none"
        />
      ) : (
        <Input
          type={placeholder.type === "date" ? "date" : "text"}
          value={value}
          onChange={e => onChange(e.target.value)}
          fullWidth
        />
      )}
    </div>
  );
}

export default ValueInputCard;
