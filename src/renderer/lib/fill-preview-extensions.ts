import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Table } from "@tiptap/extension-table";
import { NoHeaderTableRow } from "@/renderer/lib/table-row-extension";
import { NormalizedFontFamily } from "@/renderer/lib/font-family-extension";
import { FontSize } from "@/renderer/lib/font-size-extension";
import { ParagraphSpacing } from "@/renderer/lib/paragraph-spacing-extension";
import { BorderedTableCell } from "@/renderer/lib/table-cell-extension";
import { TableFullWidthGuard } from "@/renderer/lib/table-full-width-guard";
import { createPlaceholderExtension } from "@/renderer/lib/placeholder-extension";
import FilledPlaceholderChip from "@/renderer/components/fill-and-preview/FilledPlaceholderChip";

export function createFillPreviewExtensions() {
  return [
    StarterKit,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TextStyle,
    NormalizedFontFamily,
    FontSize,
    ParagraphSpacing,
    // resizable: false — these editors are `editable: false` (read-only fill
    // views), no drag-to-resize interaction is needed or wanted here.
    Table.configure({ resizable: false }),
    NoHeaderTableRow,
    BorderedTableCell,
    TableFullWidthGuard,
    createPlaceholderExtension(FilledPlaceholderChip)
  ];
}
