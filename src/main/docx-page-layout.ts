import { XMLParser } from "fast-xml-parser";
import { DEFAULT_PAGE_LAYOUT, PAGE_SIZES } from "../shared/pageLayout";
import type { PageLayout, PageSizeKey } from "../shared/pageLayout";

const TWIPS_PER_INCH = 1440;
const PX_PER_INCH = 96;
const NAMED_SIZE_TOLERANCE_PX = 5;

function twipsToPx(twips: number): number {
  return (twips / TWIPS_PER_INCH) * PX_PER_INCH;
}

// fast-xml-parser doesn't resolve XML namespaces — a real .docx's tags are
// all prefixed "w:" (e.g. w:sectPr, w:pgSz), but a different producer could
// legally use a different prefix alias for the same namespace URI.
// removeNSPrefix strips whatever prefix is present, so this code looks for
// "sectPr"/"pgSz" regardless of the source's chosen prefix.
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true
});

interface ParsedXmlNode {
  [key: string]: unknown;
}

// word/document.xml can contain multiple <w:sectPr> elements — one nested
// inside a paragraph's <w:pPr> per section break, plus one body-level one
// for the document's final section. This app has one global PageLayout, so
// only the FIRST one in document order (the first section's setup) is used,
// per the spec's multi-section decision.
function findFirstSectPr(node: unknown): ParsedXmlNode | null {
  if (node === null || typeof node !== "object") return null;

  const asRecord = node as ParsedXmlNode;
  if ("sectPr" in asRecord) {
    const sectPr = asRecord["sectPr"];
    if (Array.isArray(sectPr)) return (sectPr[0] as ParsedXmlNode) ?? null;
    if (sectPr && typeof sectPr === "object") return sectPr as ParsedXmlNode;
  }

  for (const value of Object.values(asRecord)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findFirstSectPr(item);
        if (found) return found;
      }
    } else if (value && typeof value === "object") {
      const found = findFirstSectPr(value);
      if (found) return found;
    }
  }

  return null;
}

function matchNamedSize(
  widthPx: number,
  heightPx: number
): { size: Exclude<PageSizeKey, "custom">; orientation: "portrait" | "landscape" } | null {
  for (const key of Object.keys(PAGE_SIZES) as Exclude<PageSizeKey, "custom">[]) {
    const named = PAGE_SIZES[key];

    const matchesPortrait =
      Math.abs(widthPx - named.width) <= NAMED_SIZE_TOLERANCE_PX &&
      Math.abs(heightPx - named.height) <= NAMED_SIZE_TOLERANCE_PX;
    if (matchesPortrait) return { size: key, orientation: "portrait" };

    const matchesLandscape =
      Math.abs(widthPx - named.height) <= NAMED_SIZE_TOLERANCE_PX &&
      Math.abs(heightPx - named.width) <= NAMED_SIZE_TOLERANCE_PX;
    if (matchesLandscape) return { size: key, orientation: "landscape" };
  }
  return null;
}

// documentXml is the raw text of a .docx's word/document.xml, already
// extracted from the zip by the caller (docx-import.ts) — this function is
// pure text-in/PageLayout-out, so it's exercisable directly with an inline
// XML string, no real .docx file needed.
export function parseSectionProperties(documentXml: string): PageLayout {
  const parsed = xmlParser.parse(documentXml) as ParsedXmlNode;
  const sectPr = findFirstSectPr(parsed);
  if (!sectPr) {
    return DEFAULT_PAGE_LAYOUT;
  }

  const pgSz = sectPr["pgSz"] as ParsedXmlNode | undefined;
  const pgMar = sectPr["pgMar"] as ParsedXmlNode | undefined;

  const widthTwips = Number(pgSz?.["@_w"] ?? 12240);
  const heightTwips = Number(pgSz?.["@_h"] ?? 15840);
  const orientAttr = pgSz?.["@_orient"] as string | undefined;

  const widthPx = twipsToPx(widthTwips);
  const heightPx = twipsToPx(heightTwips);
  const match = matchNamedSize(widthPx, heightPx);

  const marginsTwips = [
    Number(pgMar?.["@_top"] ?? 1440),
    Number(pgMar?.["@_bottom"] ?? 1440),
    Number(pgMar?.["@_left"] ?? 1440),
    Number(pgMar?.["@_right"] ?? 1440)
  ];
  const averagedMarginPx =
    marginsTwips.reduce((sum, m) => sum + twipsToPx(m), 0) / marginsTwips.length;

  if (match) {
    return {
      size: match.size,
      margins: Math.round(averagedMarginPx),
      orientation:
        orientAttr === "landscape" || match.orientation === "landscape"
          ? "landscape"
          : "portrait"
    };
  }

  return {
    size: "custom",
    margins: Math.round(averagedMarginPx),
    customWidth: Math.round(widthPx),
    customHeight: Math.round(heightPx)
  };
}
