import { useCallback, useEffect, useRef, useState } from "react";

const ZOOM_LEVELS = [50, 75, 100, 125, 150, 200];
const DEFAULT_ZOOM = 100;

export function useZoom() {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const containerRef = useRef<HTMLDivElement>(null);

  const zoomIn = useCallback(() => {
    setZoom(z => ZOOM_LEVELS.find(level => level > z) ?? z);
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(z => [...ZOOM_LEVELS].reverse().find(level => level < z) ?? z);
  }, []);

  const reset = useCallback(() => setZoom(DEFAULT_ZOOM), []);

  // Ctrl+scroll-wheel zoom (also covers trackpad pinch-to-zoom gestures,
  // which browsers surface as wheel events with ctrlKey set). Attached as a
  // native, non-passive listener rather than React's onWheel — React marks
  // wheel listeners passive by default, which silently ignores
  // preventDefault() and lets the OS/browser's own page-zoom gesture through.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handleWheel(e: WheelEvent) {
      if (!e.ctrlKey) return;
      e.preventDefault();
      if (e.deltaY < 0) zoomIn();
      else zoomOut();
    }

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [zoomIn, zoomOut]);

  return { zoom, zoomFactor: zoom / 100, zoomIn, zoomOut, reset, containerRef };
}
