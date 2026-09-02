import { XIcon } from "@phosphor-icons/react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useState } from "react";
import { DATE_FORMATS } from "@/shared/dateFormats";
import {
  FONT_OPTIONS,
  FONT_SIZE_OPTIONS,
  isSafeFont
} from "@/renderer/lib/font-options";
import { useSystemFonts } from "@/renderer/hooks/useSystemFonts";
import type {
  DateFormatKey,
  Placeholder,
  PlaceholderStyle
} from "@/shared/types";

interface PlaceholderCardProps {
  placeholder: Placeholder;
  useCount: number;
  onLabelChange: (label: string) => void;
  onTypeChange: (type: Placeholder["type"]) => void;
  onStyleChange: (style: Partial<PlaceholderStyle>) => void;
  onDateFormatChange: (format: DateFormatKey) => void;
  onDeleteRequest: () => void;
  onInsert: () => void;
}

function PlaceholderCard({
  placeholder,
  useCount,
  onLabelChange,
  onTypeChange,
  onStyleChange,
  onDateFormatChange,
  onDeleteRequest,
  onInsert
}: PlaceholderCardProps) {
  const [isTextStylingOpen, setIsTextStylingOpen] = useState(false);
  const { fonts: systemFonts } = useSystemFonts();
  const otherFonts = systemFonts.filter(f => !isSafeFont(f));

  return (
    <div className="rounded-lg bg-card-muted p-4">
      <div className="flex flex-col gap-2 ">
        <div className="flex justify-between items-center gap-2">
          <p
            className="text-[10px] bg-primary-soft p-1 rounded-sm font-bundle-serif truncate min-w-0 max-w-[60%]"
            title={`{{${placeholder.key}}}`}
          >
            {`{{${placeholder.key}}}`}
          </p>

          <div className="flex gap-1 items-center shrink-0">
            <p className="text-xs shrink-0">
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

        {placeholder.type === "date" && (
          <select
            value={placeholder.dateFormat ?? "long"}
            onChange={e => onDateFormatChange(e.target.value as DateFormatKey)}
            className="text-sm bg-card-muted border border-border rounded-md px-2 py-1 transition-all duration-200 w-full focus:outline-none"
          >
            {Object.entries(DATE_FORMATS).map(([key, fmt]) => (
              <option key={key} value={key}>
                {fmt.label}
              </option>
            ))}
          </select>
        )}

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
            </div>
            <div className="flex items-center gap-2">
              <select
                value={placeholder.style.fontFamily ?? ""}
                onChange={e =>
                  onStyleChange({ fontFamily: e.target.value || undefined })
                }
                className="text-sm bg-card-muted border border-border rounded-md px-2 py-1 transition-all duration-200 w-full focus:outline-none"
              >
                <option value="">{FONT_OPTIONS[0]?.label}</option>
                <optgroup label="Recommended">
                  {FONT_OPTIONS.slice(1).map(f => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </optgroup>
                {otherFonts.length > 0 && (
                  <optgroup label="Other fonts on this device">
                    {otherFonts.map(f => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <select
                value={placeholder.style.fontSize?.toString() ?? ""}
                onChange={e =>
                  onStyleChange({
                    fontSize: e.target.value
                      ? Number(e.target.value)
                      : undefined
                  })
                }
                className="text-sm bg-card-muted border border-border rounded-md px-2 py-1 transition-all duration-200 w-20 shrink-0 focus:outline-none"
              >
                <option value="">Size</option>
                {FONT_SIZE_OPTIONS.map(s => (
                  <option key={s} value={s}>
                    {s}pt
                  </option>
                ))}
              </select>
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
