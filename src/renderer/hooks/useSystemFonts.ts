import { useEffect, useState } from "react";

// Fetched once per app session (fonts installed on the machine won't change
// while the app is running) and shared across every consumer — the toolbar's
// font dropdown and each PlaceholderCard's font dropdown would otherwise all
// trigger their own redundant IPC round trip.
let cachedFonts: string[] | null = null;
let inFlight: Promise<string[]> | null = null;

export function useSystemFonts() {
  const [fonts, setFonts] = useState<string[]>(cachedFonts ?? []);
  const [loading, setLoading] = useState(cachedFonts === null);

  useEffect(() => {
    if (cachedFonts) {
      setFonts(cachedFonts);
      setLoading(false);
      return;
    }

    inFlight ??= window.bundle.listSystemFonts().catch(() => []);

    let canceled = false;
    inFlight.then(result => {
      cachedFonts = result;
      if (!canceled) {
        setFonts(result);
        setLoading(false);
      }
    });

    return () => {
      canceled = true;
    };
  }, []);

  return { fonts, loading };
}
