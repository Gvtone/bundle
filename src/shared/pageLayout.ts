export type PageSizeKey = "letter" | "a4" | "legal" | "folio" | "custom";
export type PageOrientation = "portrait" | "landscape";

export interface PageLayout {
  size: PageSizeKey;
  margins: number; // px at 96dpi
  customWidth?: number; // px at 96dpi, only used when size === "custom"
  customHeight?: number; // px at 96dpi, only used when size === "custom"
  orientation?: PageOrientation; // undefined = portrait; ignored when size === "custom"
}

// Page size definitions — width/height in pixels at 96dpi (standard screen)
export const PAGE_SIZES: Record<
  Exclude<PageSizeKey, "custom">,
  { width: number; height: number }
> = {
  letter: { width: 816, height: 1056 },
  a4: { width: 794, height: 1123 },
  legal: { width: 816, height: 1344 },
  folio: { width: 816, height: 1248 }
};

export const DEFAULT_PAGE_LAYOUT: PageLayout = {
  size: "letter",
  margins: 96
};

export const PAGE_GUTTER_PX = 32;

export function resolvePageDimensions(layout: PageLayout): {
  width: number;
  height: number;
  margins: number;
} {
  if (layout.size === "custom") {
    return {
      width: layout.customWidth ?? PAGE_SIZES.letter.width,
      height: layout.customHeight ?? PAGE_SIZES.letter.height,
      margins: layout.margins
    };
  }

  const { width, height } = PAGE_SIZES[layout.size];
  const landscape = layout.orientation === "landscape";

  return {
    width: landscape ? height : width,
    height: landscape ? width : height,
    margins: layout.margins
  };
}
