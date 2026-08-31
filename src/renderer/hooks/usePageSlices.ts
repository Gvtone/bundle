import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { computePageBreaks } from "@/renderer/lib/page-breaks";

export interface TipTapNode {
  type: string;
  [key: string]: unknown;
}

export function usePageSlices(
  hiddenEditor: Editor | null,
  content: unknown,
  usableHeight: number
): TipTapNode[][] {
  const [pageSlices, setPageSlices] = useState<TipTapNode[][]>([]);

  useEffect(() => {
    if (!hiddenEditor || hiddenEditor.isDestroyed) return;

    const topLevel: TipTapNode[] = [];
    hiddenEditor.state.doc.forEach(node => {
      topLevel.push(node.toJSON() as TipTapNode);
    });

    const frame = requestAnimationFrame(() => {
      const rects = Array.from(hiddenEditor.view.dom.children).map(el => {
        const r = (el as HTMLElement).getBoundingClientRect();
        return { top: r.top, bottom: r.bottom };
      });

      const breaks = computePageBreaks(topLevel.length, rects, usableHeight);

      const slices: TipTapNode[][] = [];
      let start = 0;
      for (const breakIndex of [...breaks, topLevel.length]) {
        slices.push(topLevel.slice(start, breakIndex));
        start = breakIndex;
      }
      setPageSlices(slices.length > 0 ? slices : [[]]);
    });

    return () => cancelAnimationFrame(frame);
  }, [hiddenEditor, content, usableHeight]);

  return pageSlices;
}
