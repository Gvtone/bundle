import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useTemplate } from "@/renderer/context/TemplateContext";

function PlaceholderChip({ node }: ReactNodeViewProps) {
  const { placeholders } = useTemplate();
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

  return (
    <NodeViewWrapper
      as="span"
      contentEditable={false}
      className="rounded-sm bg-chip-bg p-1 font-bundle-serif text-xs text-chip-foreground"
      style={style}
    >
      {`{{${placeholder.key}}}`}
    </NodeViewWrapper>
  );
}

export default PlaceholderChip;
