import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useTemplate } from "@/renderer/context/TemplateContext";
import { useFillValues } from "@/renderer/context/FillValuesContext";
import { DATE_FORMATS } from "@/renderer/utils/dateFormats";

function FilledPlaceholderChip({ node }: ReactNodeViewProps) {
  const { placeholders } = useTemplate();
  const { values } = useFillValues();
  const placeholder = placeholders.find(p => p.id === node.attrs["id"]);

  if (!placeholder) {
    return (
      <NodeViewWrapper
        as="span"
        contentEditable={false}
        className="inline-block rounded-sm bg-border px-1 text-xs text-muted-foreground"
      >
        missing field
      </NodeViewWrapper>
    );
  }

  const style: React.CSSProperties = {
    fontWeight: placeholder.style.bold ? "bold" : undefined,
    fontStyle: placeholder.style.italic ? "italic" : undefined,
    textDecoration: placeholder.style.underline ? "underline" : undefined,
    fontSize: placeholder.style.fontSize
      ? `${placeholder.style.fontSize}pt`
      : undefined,
    fontFamily: placeholder.style.fontFamily || undefined
  };

  const rawValue = values[placeholder.id];

  if (!rawValue) {
    return (
      <NodeViewWrapper
        as="span"
        contentEditable={false}
        className="rounded-sm bg-primary-soft/40 p-1 font-bundle-serif text-xs text-muted-foreground"
        style={style}
      >
        {`{{${placeholder.key}}}`}
      </NodeViewWrapper>
    );
  }

  const displayValue =
    placeholder.type === "date"
      ? DATE_FORMATS[placeholder.dateFormat ?? "long"].format(rawValue)
      : rawValue;

  return (
    <NodeViewWrapper as="span" contentEditable={false} style={style}>
      {displayValue}
    </NodeViewWrapper>
  );
}

export default FilledPlaceholderChip;
