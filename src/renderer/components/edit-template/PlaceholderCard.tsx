import { XIcon } from "@phosphor-icons/react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useState } from "react";
import type { Placeholder, PlaceholderStyle } from "@/shared/types";

interface PlaceholderCardProps {
  placeholder: Placeholder;
  useCount: number;
  onLabelChange: (label: string) => void;
  onTypeChange: (type: Placeholder["type"]) => void;
  onStyleChange: (style: Partial<PlaceholderStyle>) => void;
  onDeleteRequest: () => void;
  onInsert: () => void;
}

function PlaceholderCard({
  placeholder,
  useCount,
  onLabelChange,
  onTypeChange,
  onStyleChange,
  onDeleteRequest,
  onInsert
}: PlaceholderCardProps) {
  const [isTextStylingOpen, setIsTextStylingOpen] = useState(false);

  return (
    <div className="rounded-lg bg-card-muted p-4">
      <div className="flex flex-col gap-2 ">
        <div className="flex justify-between">
          <p className="text-xs bg-primary-soft p-1 rounded-sm font-bundle-serif">
            {`{{${placeholder.key}}}`}
          </p>

          <div className="flex gap-1 items-center">
            <p className="text-xs">
              {useCount} {useCount === 1 ? "use" : "uses"}
            </p>
            <Button
              variant="tertiary"
              size="icon"
              className="font-serif italic"
              active={isTextStylingOpen}
              onClick={() => setIsTextStylingOpen(!isTextStylingOpen)}
            >
              A
            </Button>
            <Button variant="tertiary" size="icon" onClick={onDeleteRequest}>
              <XIcon />
            </Button>
          </div>
        </div>

        <Input
          variant="secondary"
          scale="sm"
          fullWidth
          value={placeholder.label}
          onChange={e => onLabelChange(e.target.value)}
        />

        <div className="flex gap-1">
          <Button
            variant={placeholder.type === "text" ? "primary" : "secondary"}
            size="sm"
            fullWidth
            onClick={() => onTypeChange("text")}
          >
            Text
          </Button>
          <Button
            variant={placeholder.type === "date" ? "primary" : "secondary"}
            size="sm"
            fullWidth
            onClick={() => onTypeChange("date")}
          >
            Date
          </Button>
          <Button
            variant={placeholder.type === "paragraph" ? "primary" : "secondary"}
            size="sm"
            fullWidth
            onClick={() => onTypeChange("paragraph")}
          >
            ¶
          </Button>
        </div>

        {isTextStylingOpen && (
          <>
            <div className="border border-dashed border-border" />
            <div className="flex items-center gap-2">
              <Button
                variant={placeholder.style.bold ? "primary" : "secondary"}
                size="icon"
                className="font-bold shrink-0"
                onClick={() => onStyleChange({ bold: !placeholder.style.bold })}
              >
                B
              </Button>
              <Button
                variant={placeholder.style.italic ? "primary" : "secondary"}
                size="icon"
                className="font-serif italic shrink-0"
                onClick={() =>
                  onStyleChange({ italic: !placeholder.style.italic })
                }
              >
                I
              </Button>
              <Button
                variant={placeholder.style.underline ? "primary" : "secondary"}
                size="icon"
                className="underline shrink-0"
                onClick={() =>
                  onStyleChange({ underline: !placeholder.style.underline })
                }
              >
                U
              </Button>
              <Input
                variant="secondary"
                scale="sm"
                fullWidth
                placeholder="Font"
                value={placeholder.style.fontFamily ?? ""}
                onChange={e =>
                  onStyleChange({ fontFamily: e.target.value || undefined })
                }
              />
              <Input
                variant="secondary"
                scale="sm"
                fullWidth
                placeholder="Size"
                value={placeholder.style.fontSize?.toString() ?? ""}
                onChange={e =>
                  onStyleChange({
                    fontSize: e.target.value ? Number(e.target.value) : undefined
                  })
                }
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Custom fonts may not display correctly for recipients who don't
              have them installed.
            </p>
          </>
        )}

        <Button size="sm" fullWidth onClick={onInsert}>
          Insert
        </Button>
      </div>
    </div>
  );
}

export default PlaceholderCard;
