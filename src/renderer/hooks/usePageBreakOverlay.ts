import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { computePageBreaks } from "@/renderer/lib/page-breaks";

export interface PageBreakLine {
  /**
   * Y offset in px, relative to the editor content's own top (i.e.
   * `editor.view.dom`'s top) — NOT the padded container that visually
   * holds it. A caller rendering this inside a padded `position: relative`
   * box must add that box's own padding-top before using it as a CSS
   * `top`, since absolute positioning's origin is the padding-box edge,
   * before the padding is consumed.
   */
  top: number;
}

export function usePageBreakOverlay(
  editor: Editor | null,
  usableHeight: number,
  zoomFactor = 1
): PageBreakLine[] {
  const [lines, setLines] = useState<PageBreakLine[]>([]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    function measure() {
      if (!editor || editor.isDestroyed) return;

      const dom = editor.view.dom as HTMLElement;
      // getBoundingClientRect() reflects the post-zoom (CSS transform:
      // scale()) screen size, but usableHeight is a fixed, unscaled page
      // dimension — normalize every reading back to logical pixels so the
      // comparison stays correct at any zoom level. The computed `top`
      // values this hook returns stay in that same logical space, since
      // they're rendered as siblings inside the same transformed/scaled
      // parent, which visually scales them back up automatically.
      const containerTop = dom.getBoundingClientRect().top / zoomFactor;
      const nodeCount = editor.state.doc.childCount;
      const rects = Array.from(dom.children).map(el => {
        const r = (el as HTMLElement).getBoundingClientRect();
        return { top: r.top / zoomFactor, bottom: r.bottom / zoomFactor };
      });

      const breaks = computePageBreaks(nodeCount, rects, usableHeight);

      // The break line marks the true page-height boundary, not wherever
      // the overflowing node happens to start — those differ whenever a
      // page's last fitting content ends short of the actual page height.
      // computePageBreaks tracks this internally as `pageStartTop` (the top
      // of the first node on the current page); replicate that here since
      // it isn't part of the function's return value.
      const newLines: PageBreakLine[] = [];
      let pageStart = 0;
      for (const breakIndex of breaks) {
        const startRect = rects[pageStart];
        if (startRect) {
          newLines.push({ top: startRect.top + usableHeight - containerTop });
        }
        pageStart = breakIndex;
      }

      setLines(newLines);
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
  }, [editor, usableHeight, zoomFactor]);

  return lines;
}
