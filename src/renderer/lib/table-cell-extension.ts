import TableCell from "@tiptap/extension-table-cell";

type BorderSide = "borderTop" | "borderRight" | "borderBottom" | "borderLeft";

const CSS_PROPERTY: Record<BorderSide, string> = {
  borderTop: "border-top",
  borderRight: "border-right",
  borderBottom: "border-bottom",
  borderLeft: "border-left"
};

const DATA_ATTRIBUTE: Record<BorderSide, string> = {
  borderTop: "data-border-top",
  borderRight: "data-border-right",
  borderBottom: "data-border-bottom",
  borderLeft: "data-border-left"
};

function borderAttribute(side: BorderSide) {
  const cssProperty = CSS_PROPERTY[side];
  const dataAttribute = DATA_ATTRIBUTE[side];

  return {
    default: true,
    parseHTML: (element: HTMLElement) =>
      element.style.getPropertyValue(`${cssProperty}-style`) !== "hidden",
    renderHTML: (attributes: Record<string, unknown>) => {
      const on = attributes[side] !== false;
      return {
        // Longhand -style/-width/-color (not the border-{side} shorthand) so
        // "off" only has to flip -style — under border-collapse, a shared
        // edge between two cells is resolved by CSS 2.1's border-conflict
        // rules, and "none" ranks lowest there: a neighbor's "on" edge wins
        // over this cell's "none", so the border stayed visible anyway.
        // "hidden" is the one style value that always wins that conflict
        // regardless of what the neighboring cell requests, which is what
        // "off" needs to mean for a genuinely one-sided/invisible edge.
        // 0.5pt, not 1px (1px = 0.75pt at 96 CSS px/in — 50% thicker than
        // intended) — matches document-store.ts's DOCX border exactly
        // (BorderStyle.SINGLE, size: 4 in docx's eighths-of-a-point unit =
        // 4/8 = 0.5pt), and gives Chromium's printToPDF a narrower hairline
        // to work with. PDF's PAGE is a vector render (a full, crisp,
        // anti-alias-free stroke) while the on-screen editor's is
        // browser-composited and anti-aliased, so the same nominal width
        // reads visibly bolder in the PDF than on screen — this was the
        // reported "border thicker in PDF than the app" gap.
        style: `${cssProperty}-style: ${on ? "solid" : "hidden"}; ${cssProperty}-width: 0.5pt; ${cssProperty}-color: var(--paper-foreground)`,
        [dataAttribute]: on ? "on" : "off"
      };
    }
  };
}

// TipTap merges each attribute's own `renderHTML` result via `mergeAttributes`,
// which combines multiple `style` results per-CSS-property rather than one
// overwriting another — so 4 independent attrs each contributing one border
// side to the same `style` string is safe and doesn't clobber the others.
// Each side also writes its own distinct `data-border-*` attribute (not part
// of the merged `style` string) so CSS elsewhere (the editor-only dotted
// hint for "off" edges) can target on/off state without parsing inline style.
export const BorderedTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      borderTop: borderAttribute("borderTop"),
      borderRight: borderAttribute("borderRight"),
      borderBottom: borderAttribute("borderBottom"),
      borderLeft: borderAttribute("borderLeft")
    };
  },

  // The base extension's parseHTML only matches <td> — this app never
  // registers a separate TableHeader node (no header-row concept, by
  // design), so a <th> (e.g. a Word table's header row, or a pasted HTML
  // table) had no matching parse rule at all. Without one, ProseMirror's
  // DOMParser doesn't drop the cell — it falls back to flowing the <th>'s
  // content into whatever schema-valid container is nearest, silently
  // merging what should have been N separate header cells into a single
  // cell and corrupting the row's column count relative to the rest of the
  // table. Found via the DOCX import work: a real Word table with a header
  // row collapsed from 2 header cells into 1. Mapping <th> onto this same
  // tableCell node (matching the base rule, minus its empty-cell-backfill
  // special case) fixes both DOCX import and any other HTML source (paste)
  // that produces <th>.
  parseHTML() {
    return [...(this.parent?.() ?? []), { tag: "th" }];
  }
});
