import { useEffect, useState } from "react";
import { useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import { CellSelection } from "@tiptap/pm/tables";

type BorderSide = "borderTop" | "borderRight" | "borderBottom" | "borderLeft";

const SIDES: { side: BorderSide; label: string }[] = [
  { side: "borderTop", label: "Top" },
  { side: "borderRight", label: "Right" },
  { side: "borderBottom", label: "Bottom" },
  { side: "borderLeft", label: "Left" }
];

interface TableBorderPainterProps {
  editor: Editor;
  margins: number;
  zoomFactor: number;
}

function TableBorderPainter({ editor, margins, zoomFactor }: TableBorderPainterProps) {
  // Selection state only — deliberately no DOM measurement in here.
  // useEditorState runs its selector during the render phase, so any
  // getBoundingClientRect() call would read the pre-commit layout. On a zoom
  // change that pairs an old-transform measurement with the new zoomFactor
  // divisor and parks the toolbar at its true offset x (oldZoom / newZoom),
  // where it stays until the next transaction happens to re-measure.
  const anchorPos = useEditorState({
    editor,
    selector: ctx => {
      const selection = ctx.editor?.state.selection;
      return selection instanceof CellSelection
        ? selection.$anchorCell.pos
        : null;
    }
  });

  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // Measuring in an effect (plus a frame) puts the read after commit and
  // paint, so the transform the rects reflect always matches the zoomFactor
  // being divided by. Same shape as usePageBreakOverlay.ts.
  useEffect(() => {
    if (anchorPos === null || editor.isDestroyed) {
      setPosition(null);
      return;
    }

    function measure() {
      if (editor.isDestroyed || anchorPos === null) return;

      const cellEl = editor.view.nodeDOM(anchorPos) as HTMLElement | null;
      if (!cellEl) {
        setPosition(null);
        return;
      }

      const containerRect = (
        editor.view.dom as HTMLElement
      ).getBoundingClientRect();
      const cellRect = cellEl.getBoundingClientRect();

      // getBoundingClientRect() returns post-transform (screen) pixels, but
      // this component renders inside the "paper" div's `transform: scale(zoomFactor)`,
      // so the inline top/left style we set here is interpreted as pre-transform
      // (logical) pixels and re-scaled by that ancestor transform. Dividing by
      // zoomFactor undoes the screen-space scaling so the two don't compound.
      // Same pattern as useTableGridControls.ts and usePageBreakOverlay.ts.
      setPosition({
        top: (cellRect.top - containerRect.top) / zoomFactor,
        left: (cellRect.left - containerRect.left) / zoomFactor
      });
    }

    let frame = requestAnimationFrame(measure);
    const onUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    editor.on("update", onUpdate);
    return () => {
      cancelAnimationFrame(frame);
      editor.off("update", onUpdate);
    };
  }, [editor, anchorPos, zoomFactor]);

  if (anchorPos === null || !position) return null;

  function toggleSide(side: BorderSide) {
    const selection = editor.state.selection;
    if (!(selection instanceof CellSelection)) return;

    const cellPositions: number[] = [];
    selection.forEachCell((_node, pos) => cellPositions.push(pos));
    if (cellPositions.length === 0) return;

    const firstCell = editor.state.doc.nodeAt(cellPositions[0]!);
    const nextValue = !(firstCell?.attrs[side] ?? true);

    const tr = editor.state.tr;
    for (const pos of cellPositions) {
      tr.setNodeAttribute(pos, side, nextValue);
    }
    editor.view.dispatch(tr);
  }

  return (
    <div
      className="absolute z-20 flex gap-1 bg-popover border border-border rounded-md shadow-md p-1"
      style={{ top: `${position.top + margins - 36}px`, left: `${position.left + margins}px` }}
    >
      {SIDES.map(({ side, label }) => (
        <button
          key={side}
          type="button"
          title={`Toggle ${label.toLowerCase()} border`}
          className="w-6 h-6 text-xs border border-border rounded hover:bg-card-muted"
          onMouseDown={e => e.preventDefault()}
          onClick={() => toggleSide(side)}
        >
          {label[0]}
        </button>
      ))}
    </div>
  );
}

export default TableBorderPainter;
