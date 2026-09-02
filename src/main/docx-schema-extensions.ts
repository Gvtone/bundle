import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Table } from "@tiptap/extension-table";
import { NoHeaderTableRow } from "../renderer/lib/table-row-extension";
import { BorderedTableCell } from "../renderer/lib/table-cell-extension";
import { NormalizedFontFamily } from "../renderer/lib/font-family-extension";
import { FontSize } from "../renderer/lib/font-size-extension";
import { ParagraphSpacing } from "../renderer/lib/paragraph-spacing-extension";

// The schema DOCX import parses HTML against, in the main process (Node,
// no DOM/React). Deliberately excludes two extensions the real editor
// surfaces (EditTemplatePage.tsx, fill-preview-extensions.ts) add on top of
// this same list:
//   - the placeholder node extension (createPlaceholderExtension) — its
//     node view uses ReactNodeViewRenderer, a browser/React-only API.
//     Imported DOCX content never contains placeholder nodes anyway (no
//     auto-placeholder detection, per spec), so omitting it changes
//     nothing observable.
//   - TableFullWidthGuard — a view-only ProseMirror plugin (no
//     addAttributes/parseHTML, so no effect on parsed JSON either way) that
//     calls requestAnimationFrame, a browser-only global not available in
//     Node. generateJSON() never creates a real EditorView, so a view-only
//     plugin would never actually run regardless — omitted for clarity and
//     to avoid the undefined-global risk entirely.
// Table.configure({ resizable: false }) matches fill-preview-extensions.ts's
// choice for the same reason: no interactive resize is possible or needed
// where there's no live EditorView.
export function createDocxSchemaExtensions() {
  return [
    StarterKit,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TextStyle,
    NormalizedFontFamily,
    FontSize,
    ParagraphSpacing,
    Table.configure({ resizable: false }),
    NoHeaderTableRow,
    BorderedTableCell
  ];
}
