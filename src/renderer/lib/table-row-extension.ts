import TableRow from "@tiptap/extension-table-row";

// TableRow's stock content expression is "(tableCell | tableHeader)*", but
// header rows are deliberately not a concept in this app, so TableHeader is
// never registered — ProseMirror rejects a content expression naming an
// absent node type and the whole schema fails to build. Narrowing the
// expression keeps header rows out at the schema level instead of pulling
// the node type back in.
//
// `height` is a custom attr (stock TableRow has none) driving the row-resize
// drag handle in useTableGridControls.ts/TableGridOverlay.tsx.
export const NoHeaderTableRow = TableRow.extend({
  content: "tableCell*",
  addAttributes() {
    return {
      height: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const height = element.style.height;
          return height ? parseInt(height, 10) : null;
        },
        renderHTML: (attributes: Record<string, unknown>) =>
          typeof attributes["height"] === "number"
            ? { style: `height: ${attributes["height"]}px` }
            : {}
      }
    };
  }
});
