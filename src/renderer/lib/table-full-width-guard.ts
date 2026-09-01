import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { Transaction } from "@tiptap/pm/state";
import { TableMap } from "@tiptap/pm/tables";
import type { EditorView } from "@tiptap/pm/view";

// prosemirror-tables' own column-sizing algorithm (updateColumnsOnResize,
// keyed off each table's FIRST row) only lets our `.prose.prose-sm table
// { width: 100% }` CSS govern a table's rendered width while at least one
// column still has no explicit `colwidth`. The moment every column has been
// individually drag-resized, prosemirror-tables sets an inline
// `table.style.width` equal to the literal sum of those column widths —
// which silently overrides the 100% CSS and can leave the table narrower
// than the page ("touching only the left margin") instead of spanning
// margin-to-margin the way the DOCX/PDF export always does (document-store.ts
// always distributes column widths across the full content width).
//
// Clearing the LAST column's colwidth back to null whenever a table becomes
// fully fixed keeps that one column permanently "auto" (a deliberate
// trade-off: the rightmost column always absorbs remaining space and can't
// be pinned to an exact px, the same convention many table editors use), so
// prosemirror-tables' fixedWidth check never trips — the table always fills
// its container. Uses TableMap so every row's cell in that column is
// touched together, mirroring updateColumnWidth's own convention, keeping
// rows consistent.
const tableFullWidthGuardKey = new PluginKey("tableFullWidthGuard");

function buildFixTransaction(view: EditorView): Transaction | null {
  let tr: Transaction | null = null;

  view.state.doc.descendants((node, pos) => {
    if (node.type.name !== "table") return;

    const firstRow = node.firstChild;
    if (!firstRow || firstRow.childCount < 2) return;

    const allColumnsFixed = firstRow.children.every(cell => {
      const colwidth = cell.attrs["colwidth"] as (number | null)[] | null;
      return Array.isArray(colwidth) && colwidth.every(w => !!w);
    });
    if (!allColumnsFixed) return;

    const map = TableMap.get(node);
    const lastCol = map.width - 1;
    const seen = new Set<number>();

    for (let row = 0; row < map.height; row++) {
      const cellStart = map.map[row * map.width + lastCol];
      if (cellStart === undefined || seen.has(cellStart)) continue;
      seen.add(cellStart);

      const cellPos = pos + 1 + cellStart;
      const cellNode = view.state.doc.nodeAt(cellPos);
      if (!cellNode || !cellNode.attrs["colwidth"]) continue;

      tr = (tr ?? view.state.tr).setNodeAttribute(cellPos, "colwidth", null);
    }
  });

  return tr;
}

export const TableFullWidthGuard = Extension.create({
  name: "tableFullWidthGuard",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: tableFullWidthGuardKey,
        view(view: EditorView) {
          // Deferred to the next frame: running synchronously inside a PM
          // `view.update` while the triggering transaction is still being
          // applied risks dispatching into a view mid-update. Self-terminating:
          // the correction's own dispatch re-triggers `update` once more, but
          // by then the table is no longer fully fixed, so it's a no-op.
          let frame = requestAnimationFrame(() => fix());

          function fix() {
            const tr = buildFixTransaction(view);
            if (tr) view.dispatch(tr);
          }

          return {
            update: () => {
              cancelAnimationFrame(frame);
              frame = requestAnimationFrame(fix);
            },
            destroy: () => cancelAnimationFrame(frame)
          };
        }
      })
    ];
  }
});
