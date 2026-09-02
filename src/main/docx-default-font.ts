import { XMLParser } from "fast-xml-parser";
import { DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE_PT } from "../shared/documentDefaults";

// Same prefix-agnostic parser config as docx-page-layout.ts.
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true
});

export interface DocDefaultFont {
  fontFamily: string;
  fontSizePt: number;
}

interface ParsedXmlNode {
  [key: string]: unknown;
}

// w:sz is in half-points; everything else here reads straight off rFonts/sz
// attributes once namespace prefixes are stripped. Real Word documents
// commonly set the default font via a *theme* reference (w:asciiTheme, e.g.
// "minorHAnsi") rather than a literal w:ascii name — that's how Word itself
// writes "change the document's default font" — so themeKey is carried back
// whenever a literal name isn't present, for the caller to resolve against
// word/theme/theme1.xml.
function extractFromRPr(rPr: unknown): {
  fontFamily?: string;
  themeKey?: string;
  fontSizePt?: number;
} {
  const asRecord = rPr as ParsedXmlNode | undefined;
  const rFonts = asRecord?.["rFonts"] as ParsedXmlNode | undefined;
  const fontFamily = rFonts?.["@_ascii"] as string | undefined;
  const themeKey = rFonts?.["@_asciiTheme"] as string | undefined;

  const sz = asRecord?.["sz"] as ParsedXmlNode | undefined;
  const szVal = sz?.["@_val"];
  const fontSizePt = szVal !== undefined ? Number(szVal) / 2 : undefined;

  return { fontFamily, themeKey, fontSizePt };
}

// themeKey values look like "majorHAnsi"/"minorHAnsi"/"majorAscii"/etc —
// only the major/minor prefix matters for picking a font group here, since
// this app only cares about the latin typeface (Western-script default).
// themeXml is word/theme/theme1.xml's raw text.
function resolveThemeFont(themeXml: string, themeKey: string): string | undefined {
  const parsed = xmlParser.parse(themeXml) as ParsedXmlNode;
  const theme = parsed["theme"] as ParsedXmlNode | undefined;
  const themeElements = theme?.["themeElements"] as ParsedXmlNode | undefined;
  const fontScheme = themeElements?.["fontScheme"] as ParsedXmlNode | undefined;

  const isMajor = themeKey.toLowerCase().startsWith("major");
  const fontGroup = (
    isMajor ? fontScheme?.["majorFont"] : fontScheme?.["minorFont"]
  ) as ParsedXmlNode | undefined;
  const latin = fontGroup?.["latin"] as ParsedXmlNode | undefined;

  return (latin?.["@_typeface"] as string | undefined) || undefined;
}

// word/styles.xml's own "Normal" paragraph style is the actual controlling
// default for undecorated runs in real-world documents, and takes priority
// over <w:docDefaults> (which many Word-generated files leave at stale
// generic values while every visible paragraph is styled through Normal).
// stylesXml/themeXml are the raw text of word/styles.xml and
// word/theme/theme1.xml — pure text-in/value-out, so this is exercisable
// directly with inline XML strings. themeXml is optional since not every
// .docx ships a theme part (or one could fail to load); its absence just
// means a theme-referenced font can't be resolved and falls through to the
// app's own default.
export function parseDocDefaultFont(
  stylesXml: string,
  themeXml?: string
): DocDefaultFont {
  const parsed = xmlParser.parse(stylesXml) as ParsedXmlNode;
  const styles = parsed["styles"] as ParsedXmlNode | undefined;

  const rawStyleList = styles?.["style"];
  const styleList: ParsedXmlNode[] = Array.isArray(rawStyleList)
    ? (rawStyleList as ParsedXmlNode[])
    : rawStyleList
      ? [rawStyleList as ParsedXmlNode]
      : [];

  const normalStyle = styleList.find(s => s["@_styleId"] === "Normal");
  const fromNormal = extractFromRPr(normalStyle?.["rPr"]);

  const docDefaults = styles?.["docDefaults"] as ParsedXmlNode | undefined;
  const rPrDefault = docDefaults?.["rPrDefault"] as ParsedXmlNode | undefined;
  const fromDocDefaults = extractFromRPr(rPrDefault?.["rPr"]);

  let fontFamily = fromNormal.fontFamily ?? fromDocDefaults.fontFamily;
  if (!fontFamily && themeXml) {
    const themeKey = fromNormal.themeKey ?? fromDocDefaults.themeKey;
    if (themeKey) fontFamily = resolveThemeFont(themeXml, themeKey);
  }

  return {
    fontFamily: fontFamily ?? DEFAULT_FONT_FAMILY,
    fontSizePt:
      fromNormal.fontSizePt ?? fromDocDefaults.fontSizePt ?? DEFAULT_FONT_SIZE_PT
  };
}

// mammoth doesn't preserve raw font-family/size formatting at all (confirmed
// empirically: a run with explicit direct rFonts/sz comes out as bare
// <p>text</p>, no styling trace) — so there's no per-run styling left in its
// HTML to merge with. Any font info this app wants to keep has to be
// resolved separately (see resolveImportDefaultFont below) and applied as
// one value here; wrapping the whole converted body once is enough since
// ProseMirror's DOM parser carries marks from an ancestor element down into
// nested block content, so this single outer span applies to every run.
export function wrapWithDefaultFont(html: string, font: DocDefaultFont): string {
  const safeFamily = font.fontFamily.replace(/["';]/g, "");
  return `<span style="font-family: ${safeFamily}; font-size: ${font.fontSizePt}pt">${html}</span>`;
}

// Text run length, summed across a run's <w:t> children — used to weight
// how much each distinct explicit font/size "wins" when picking the
// document's dominant one. fast-xml-parser represents a <w:t xml:space=
// "preserve"> as an object ({"#text": "..."}) rather than a plain string
// once it carries an attribute, so both shapes are handled.
function runTextLength(run: ParsedXmlNode): number {
  const rawT = run["t"];
  if (rawT === undefined) return 0;
  const items = Array.isArray(rawT) ? rawT : [rawT];

  return items.reduce((sum: number, item) => {
    if (typeof item === "string") return sum + item.length;
    if (item && typeof item === "object") {
      const text = (item as ParsedXmlNode)["#text"];
      return sum + (typeof text === "string" ? text.length : 0);
    }
    return sum;
  }, 0);
}

// Recursively walks the whole parsed document.xml tree (paragraphs, table
// cells, hyperlink wrappers — anywhere a <w:r> can appear) accumulating
// each explicit run-level font-family/size, weighted by how much text that
// run carries. Two runs of the same length "voting" for different fonts
// isn't something this app tries to reconcile precisely — the point is
// picking the one font a real user actually applied to most of the visible
// text (typically the whole document, selected via Ctrl+A and changed once
// in Word's ribbon), not preserving genuinely mixed formatting.
function collectRunWeights(
  node: unknown,
  themeXml: string | undefined,
  fontWeights: Map<string, number>,
  sizeWeights: Map<number, number>
): void {
  if (node === null || typeof node !== "object") return;
  const asRecord = node as ParsedXmlNode;

  if ("r" in asRecord) {
    const rawR = asRecord["r"];
    const runList: ParsedXmlNode[] = Array.isArray(rawR)
      ? (rawR as ParsedXmlNode[])
      : [rawR as ParsedXmlNode];

    for (const run of runList) {
      const textLength = runTextLength(run);
      if (textLength === 0) continue;

      const { fontFamily, themeKey, fontSizePt } = extractFromRPr(run["rPr"]);
      const resolvedFamily =
        fontFamily ?? (themeKey && themeXml ? resolveThemeFont(themeXml, themeKey) : undefined);

      if (resolvedFamily) {
        fontWeights.set(resolvedFamily, (fontWeights.get(resolvedFamily) ?? 0) + textLength);
      }
      if (fontSizePt !== undefined) {
        sizeWeights.set(fontSizePt, (sizeWeights.get(fontSizePt) ?? 0) + textLength);
      }
    }
  }

  for (const value of Object.values(asRecord)) {
    if (Array.isArray(value)) {
      for (const item of value) collectRunWeights(item, themeXml, fontWeights, sizeWeights);
    } else if (value && typeof value === "object") {
      collectRunWeights(value, themeXml, fontWeights, sizeWeights);
    }
  }
}

function highestWeighted<K>(weights: Map<K, number>): K | undefined {
  let best: K | undefined;
  let bestWeight = -1;
  for (const [key, weight] of weights) {
    if (weight > bestWeight) {
      best = key;
      bestWeight = weight;
    }
  }
  return best;
}

// Most real-world Word documents set "the font" by selecting text (often
// the whole document) and choosing one from the ribbon — direct/run-level
// formatting — rather than by editing the Normal style's own definition.
// Since mammoth drops that entirely, this app's font import would otherwise
// silently fall back to whatever the Normal style/theme happens to say
// (frequently Word's own newer default, unrelated to what the user actually
// picked) instead of the font visibly used in the document. Scanning the
// document's own runs for the most-used explicit font/size and preferring
// that over the Normal-style/theme value fixes that gap while keeping this
// app's "one font for the whole imported document" design (matching its
// single-font business-template use case, not attempting true mixed-
// formatting fidelity).
export function resolveImportDefaultFont(
  documentXml: string,
  stylesXml: string,
  themeXml?: string
): DocDefaultFont {
  const parsedDocument = xmlParser.parse(documentXml) as ParsedXmlNode;
  const fontWeights = new Map<string, number>();
  const sizeWeights = new Map<number, number>();
  collectRunWeights(parsedDocument, themeXml, fontWeights, sizeWeights);

  const dominantFamily = highestWeighted(fontWeights);
  const dominantSizePt = highestWeighted(sizeWeights);

  const styleDefault = parseDocDefaultFont(stylesXml, themeXml);

  return {
    fontFamily: dominantFamily ?? styleDefault.fontFamily,
    fontSizePt: dominantSizePt ?? styleDefault.fontSizePt
  };
}
