import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";

export interface TableGridHandle {
  position: number;
  onClick: () => void;
}

export interface RowResizeHandle {
  /** Top edge of the boundary being dragged, in the same coordinate space as TableGridHandle.position. */
  position: number;
  /** ProseMirror doc position of the row being resized (the row above this boundary). */
  rowPos: number;
  /** The row's current height in px — null if never explicitly set (auto). */
  currentHeightPx: number | null;
  /** The row's current on-screen rendered height, used as the drag's starting height when currentHeightPx is null. */
  measuredHeightPx: number;
}

export interface TableGridControls {
  tableTop: number;
  tableLeft: number;
  tableWidth: number;
  tableHeight: number;
  /** Only the row boundary nearest the cursor, or null if none is close enough. */
  rowHandle: TableGridHandle | null;
  /** Drag-to-resize affordance for the same boundary as rowHandle, when a row exists above it. */
  rowResize: RowResizeHandle | null;
  /** Only the column boundary nearest the cursor, or null if none is close enough. */
  columnHandle: TableGridHandle | null;
}

// Boundaries farther than this from the cursor don't show a handle at all —
// keeps the overlay from crowding the whole table with a constant "+" that's
// never actually near the pointer.
const PROXIMITY_THRESHOLD_PX = 48;

export function useTableGridControls(
  editor: Editor | null,
  zoomFactor = 1
): TableGridControls | null {
  const [controls, setControls] = useState<TableGridControls | null>(null);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    const dom = editor.view.dom as HTMLElement;
    let lastCursorX = 0;
    let lastCursorY = 0;
    // The +/- buttons render OUTSIDE the <table> element's box (e.g. the
    // row handle sits 18px left of the table edge), so the path from a
    // table boundary to its button crosses non-table DOM. Tracking the
    // last-hovered table and tolerating cursor movement within a margin
    // around it — instead of requiring the cursor stay directly over
    // <table> — keeps the buttons alive long enough to actually reach and
    // click, rather than vanishing mid-approach.
    let activeTableEl: HTMLTableElement | null = null;

    function nearestIndex(boundaries: number[], point: number): number {
      let best = 0;
      let bestDist = Infinity;
      boundaries.forEach((b, i) => {
        const dist = Math.abs(b - point);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      return best;
    }

    function measure(tableEl: HTMLTableElement, cursorX: number, cursorY: number) {
      const containerRect = dom.getBoundingClientRect();
      const containerTop = containerRect.top / zoomFactor;
      const containerLeft = containerRect.left / zoomFactor;

      const rows = Array.from(
        tableEl.querySelectorAll(":scope > tbody > tr")
      ) as HTMLTableRowElement[];
      if (rows.length === 0 || !editor) return;

      const firstRowCells = Array.from(
        rows[0]!.children
      ) as HTMLTableCellElement[];
      if (firstRowCells.length === 0) return;

      const tableRect = tableEl.getBoundingClientRect();

      const rowBoundaryTops = [
        rows[0]!.getBoundingClientRect().top / zoomFactor,
        ...rows.map(r => r.getBoundingClientRect().bottom / zoomFactor)
      ];
      const colBoundaryLefts = [
        firstRowCells[0]!.getBoundingClientRect().left / zoomFactor,
        ...firstRowCells.map(c => c.getBoundingClientRect().right / zoomFactor)
      ];

      function runAndRemeasure(chain: () => void) {
        chain();
        requestAnimationFrame(() => measure(tableEl, lastCursorX, lastCursorY));
      }

      const nearestRow = nearestIndex(rowBoundaryTops, cursorY);
      const rowDist = Math.abs(rowBoundaryTops[nearestRow]! - cursorY);
      const nearestCol = nearestIndex(colBoundaryLefts, cursorX);
      const colDist = Math.abs(colBoundaryLefts[nearestCol]! - cursorX);

      const rowHandle: TableGridHandle | null =
        rowDist <= PROXIMITY_THRESHOLD_PX
          ? {
              position: rowBoundaryTops[nearestRow]! - containerTop,
              onClick: () =>
                runAndRemeasure(() => {
                  const targetRow =
                    nearestRow === 0 ? rows[0]! : rows[nearestRow - 1]!;
                  const cell = targetRow.children[0] as HTMLElement;
                  const pos = editor.view.posAtDOM(cell, 0);
                  const chain = editor.chain().setTextSelection(pos).focus();
                  if (nearestRow === 0) chain.addRowBefore().run();
                  else chain.addRowAfter().run();
                })
            }
          : null;

      // Resizing means dragging the row ABOVE this boundary — the very top
      // boundary (above row 0) has no such row, so it only offers insert.
      const rowResize: RowResizeHandle | null =
        rowHandle && nearestRow > 0
          ? (() => {
              const row = rows[nearestRow - 1]!;
              // posAtDOM(row, 0) resolves to the position just inside the row
              // (right before its first cell) — one less than that is the
              // row node's own start position, the one tr.setNodeAttribute /
              // doc.nodeAt expect.
              const rowPos = editor.view.posAtDOM(row, 0) - 1;
              const rowNode = editor.state.doc.nodeAt(rowPos);
              const currentHeightPx =
                typeof rowNode?.attrs["height"] === "number"
                  ? (rowNode.attrs["height"] as number)
                  : null;
              return {
                position: rowBoundaryTops[nearestRow]! - containerTop,
                rowPos,
                currentHeightPx,
                measuredHeightPx:
                  row.getBoundingClientRect().height / zoomFactor
              };
            })()
          : null;

      const columnHandle: TableGridHandle | null =
        colDist <= PROXIMITY_THRESHOLD_PX
          ? {
              position: colBoundaryLefts[nearestCol]! - containerLeft,
              onClick: () =>
                runAndRemeasure(() => {
                  const targetCol = nearestCol === 0 ? 0 : nearestCol - 1;
                  const cell = rows[0]!.children[targetCol] as HTMLElement;
                  const pos = editor.view.posAtDOM(cell, 0);
                  const chain = editor.chain().setTextSelection(pos).focus();
                  if (nearestCol === 0) chain.addColumnBefore().run();
                  else chain.addColumnAfter().run();
                })
            }
          : null;

      setControls({
        tableTop: tableRect.top / zoomFactor - containerTop,
        tableLeft: tableRect.left / zoomFactor - containerLeft,
        tableWidth: tableRect.width / zoomFactor,
        tableHeight: tableRect.height / zoomFactor,
        rowHandle,
        rowResize,
        columnHandle
      });
    }

    function handleMouseMove(e: MouseEvent) {
      lastCursorX = e.clientX / zoomFactor;
      lastCursorY = e.clientY / zoomFactor;
      const target = e.target as HTMLElement;
      const tableEl = target.closest("table") as HTMLTableElement | null;

      if (tableEl && dom.contains(tableEl)) {
        activeTableEl = tableEl;
        measure(tableEl, lastCursorX, lastCursorY);
        return;
      }

      if (activeTableEl) {
        if (target.closest("[data-table-grid-handle]")) {
          measure(activeTableEl, lastCursorX, lastCursorY);
          return;
        }

        const rect = activeTableEl.getBoundingClientRect();
        const withinMargin =
          e.clientX >= rect.left - PROXIMITY_THRESHOLD_PX &&
          e.clientX <= rect.right + PROXIMITY_THRESHOLD_PX &&
          e.clientY >= rect.top - PROXIMITY_THRESHOLD_PX &&
          e.clientY <= rect.bottom + PROXIMITY_THRESHOLD_PX;
        if (withinMargin) {
          measure(activeTableEl, lastCursorX, lastCursorY);
          return;
        }
      }

      activeTableEl = null;
      setControls(null);
    }

    function handleMouseLeave(e: MouseEvent) {
      const related = e.relatedTarget as HTMLElement | null;
      if (related?.closest("[data-table-grid-handle]")) return;
      activeTableEl = null;
      setControls(null);
    }

    dom.addEventListener("mousemove", handleMouseMove);
    dom.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      dom.removeEventListener("mousemove", handleMouseMove);
      dom.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [editor, zoomFactor]);

  return controls;
}
