export function computePageBreaks(
  topLevelNodeCount: number,
  rects: { top: number; bottom: number }[],
  usableHeight: number
): number[] {
  const breaks: number[] = [];
  let pageStartTop: number | null = null;

  for (let i = 0; i < topLevelNodeCount; i++) {
    const rect = rects[i];
    if (!rect) continue;

    if (pageStartTop === null) {
      pageStartTop = rect.top;
      continue;
    }

    if (rect.bottom - pageStartTop > usableHeight) {
      breaks.push(i);
      pageStartTop = rect.top;
    }
  }

  return breaks;
}
