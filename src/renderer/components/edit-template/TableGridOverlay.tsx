import type { Editor } from "@tiptap/react";
import { PlusIcon } from "@phosphor-icons/react";
import type { TableGridControls } from "@/renderer/hooks/useTableGridControls";

interface TableGridOverlayProps {
  editor: Editor;
  controls: TableGridControls | null;
  margins: number;
  zoomFactor: number;
}

function TableGridOverlay({
  editor,
  controls,
  margins,
  zoomFactor
}: TableGridOverlayProps) {
  if (!controls) return null;

  function handleResizeMouseDown(
    e: React.MouseEvent,
    resize: NonNullable<TableGridControls["rowResize"]>
  ) {
    e.preventDefault();

    const startY = e.clientY;
    const startHeight = resize.currentHeightPx ?? resize.measuredHeightPx;

    function nextHeight(moveEvent: MouseEvent) {
      const deltaY = (moveEvent.clientY - startY) / zoomFactor;
      return Math.max(20, Math.round(startHeight + deltaY));
    }

    // Mutating rowEl.style.height directly (the previous approach) only
    // ever changed the DOM outside of ProseMirror's own model — meanwhile
    // useTableGridControls.ts's hover measurement runs on the very same
    // mousemove stream and re-renders this strip's position from freshly
    // measured geometry, and editor.state.doc's committed height attr never
    // moved until mouseup. Those two views of "the row's height" disagreed
    // for the whole drag, which is what made it look like nothing happened
    // until release. Dispatching a real (non-history) transaction on every
    // move — the same live-dispatch-per-frame approach prosemirror-tables'
    // own column resize uses — keeps a single source of truth for the row's
    // height throughout the drag, so both the row and this strip's tracked
    // position update in lockstep with the cursor.
    function onMouseMove(moveEvent: MouseEvent) {
      const tr = editor.state.tr.setNodeAttribute(
        resize.rowPos,
        "height",
        nextHeight(moveEvent)
      );
      tr.setMeta("addToHistory", false);
      editor.view.dispatch(tr);
    }

    function onMouseUp(upEvent: MouseEvent) {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      // One last dispatch WITH history, so the whole drag collapses into a
      // single undo step instead of the (history-suppressed) per-frame ones.
      const tr = editor.state.tr.setNodeAttribute(
        resize.rowPos,
        "height",
        nextHeight(upEvent)
      );
      editor.view.dispatch(tr);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  return (
    <>
      {controls.rowResize && (
        <div
          data-table-grid-handle="true"
          className="absolute z-10 cursor-row-resize"
          style={{
            top: `${controls.rowResize.position + margins - 3}px`,
            left: `${controls.tableLeft + margins}px`,
            width: `${controls.tableWidth}px`,
            height: "6px"
          }}
          onMouseDown={e => handleResizeMouseDown(e, controls.rowResize!)}
        />
      )}

      {controls.rowHandle && (
        <button
          type="button"
          data-table-grid-handle="true"
          className="absolute z-10 w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/80 shadow-sm"
          style={{
            top: `${controls.rowHandle.position + margins}px`,
            left: `${controls.tableLeft + margins - 18}px`
          }}
          onMouseDown={e => e.preventDefault()}
          onClick={controls.rowHandle.onClick}
        >
          <PlusIcon size={16} weight="bold" />
        </button>
      )}

      {controls.columnHandle && (
        <button
          type="button"
          data-table-grid-handle="true"
          className="absolute z-10 w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/80 shadow-sm"
          style={{
            top: `${controls.tableTop + margins - 18}px`,
            left: `${controls.columnHandle.position + margins}px`
          }}
          onMouseDown={e => e.preventDefault()}
          onClick={controls.columnHandle.onClick}
        >
          <PlusIcon size={16} weight="bold" />
        </button>
      )}
    </>
  );
}

export default TableGridOverlay;
