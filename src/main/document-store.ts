import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  LevelFormat
} from "docx";
import type { ExportPayload, Placeholder } from "../shared/types";
import { DATE_FORMATS } from "../shared/dateFormats";
import { resolvePageDimensions } from "../shared/pageLayout";
import {
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE_PT,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_PARAGRAPH_SPACING_PT
} from "../shared/documentDefaults";

// 1px @ 96dpi = 1/96 inch = 1440/96 = 15 twips (docx's unit).
const TWIPS_PER_PX = 15;
const ORDERED_LIST_REFERENCE = "ordered-list";
const MAX_LIST_DEPTH = 3;
const DEFAULT_RUN_SIZE_HALF_POINTS = DEFAULT_FONT_SIZE_PT * 2; // fallback for text with no explicit size mark
// Fallback values for a paragraph with no explicit lineHeight/spacingAfter
// attrs (set via the editor's Line spacing / Paragraph spacing controls) —
// matches the on-screen/PDF preview's `.prose.prose-sm` override in
// theme.css, which targets Word's "Normal" style defaults. Applied
// symmetrically to both before/after (see spacing comment below) rather
// than Word's true asymmetric 0pt-before/8pt-after — independent before/
// after support is a follow-up, not yet built.
const DEFAULT_LINE_HEIGHT_RATIO = DEFAULT_LINE_HEIGHT;
const DEFAULT_SPACING_PT = DEFAULT_PARAGRAPH_SPACING_PT;

interface TipTapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

interface TipTapNode {
  type: string;
  attrs?: Record<string, unknown>;
  marks?: TipTapMark[];
  text?: string;
  content?: TipTapNode[];
}

interface RunStyle {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontSizePt?: number;
  fontFamily?: string;
}

interface RunProps {
  bold: boolean;
  italics: boolean;
  underline: Record<string, never> | undefined;
  size: number | undefined;
  font: string | undefined;
}

function alignmentOf(textAlign: unknown) {
  switch (textAlign) {
    case "center":
      return AlignmentType.CENTER;
    case "right":
      return AlignmentType.RIGHT;
    case "justify":
      return AlignmentType.JUSTIFIED;
    default:
      return AlignmentType.LEFT;
  }
}

function marksToStyle(marks: TipTapMark[]): RunStyle {
  const textStyle = marks.find(m => m.type === "textStyle");
  const rawFontSize = textStyle?.attrs?.["fontSize"];
  const fontSizePt =
    typeof rawFontSize === "string"
      ? parseFloat(rawFontSize.replace("pt", ""))
      : undefined;
  const rawFontFamily = textStyle?.attrs?.["fontFamily"];

  return {
    bold: marks.some(m => m.type === "bold"),
    italic: marks.some(m => m.type === "italic"),
    underline: marks.some(m => m.type === "underline"),
    fontSizePt:
      fontSizePt !== undefined && !Number.isNaN(fontSizePt)
        ? fontSizePt
        : undefined,
    fontFamily: typeof rawFontFamily === "string" ? rawFontFamily : undefined
  };
}

function placeholderStyleToRunStyle(style: Placeholder["style"]): RunStyle {
  return {
    bold: style.bold,
    italic: style.italic,
    underline: style.underline,
    fontSizePt: style.fontSize,
    fontFamily: style.fontFamily
  };
}

// Defense-in-depth against raw CSS values (quotes, comma-separated
// fallback stacks) that may still be stored on older saved templates,
// even though NormalizedFontFamily now normalizes at parse time.
function normalizeFontFamily(raw: string): string {
  const first = raw.split(",")[0] ?? raw;
  return first.trim().replace(/^['"]+|['"]+$/g, "");
}

function runPropsFromStyle(style: RunStyle): RunProps {
  return {
    bold: style.bold,
    italics: style.italic,
    underline: style.underline ? {} : undefined,
    size: style.fontSizePt ? style.fontSizePt * 2 : undefined,
    font: style.fontFamily ? normalizeFontFamily(style.fontFamily) : undefined
  };
}

function placeholderRuns(
  placeholder: Placeholder,
  rawValue: string
): TextRun[] {
  const style = placeholderStyleToRunStyle(placeholder.style);
  const displayValue =
    placeholder.type === "date" && rawValue
      ? DATE_FORMATS[placeholder.dateFormat ?? "long"].format(rawValue)
      : rawValue;

  return displayValue.split("\n").map(
    (line, i) =>
      new TextRun({
        ...runPropsFromStyle(style),
        text: line,
        break: i > 0 ? 1 : undefined
      })
  );
}

function inlineNodesToRuns(
  nodes: TipTapNode[],
  placeholders: Placeholder[],
  values: Record<string, string>
): TextRun[] {
  const runs: TextRun[] = [];

  for (const node of nodes) {
    if (node.type === "text") {
      const style = marksToStyle(node.marks ?? []);
      runs.push(
        new TextRun({ ...runPropsFromStyle(style), text: node.text ?? "" })
      );
    } else if (node.type === "placeholder") {
      const id = node.attrs?.["id"];
      if (typeof id !== "string") continue;
      const placeholder = placeholders.find(p => p.id === id);
      if (!placeholder) continue;
      const rawValue = values[placeholder.id] ?? "";
      runs.push(...placeholderRuns(placeholder, rawValue));
    }
  }

  return runs;
}

interface ListContext {
  kind: "bullet" | "number";
  depth: number;
}

// contextualSpacing mirrors CSS's adjacent-sibling margin collapsing — without
// it, Word sums consecutive paragraphs' before+after instead of collapsing to
// one value like the preview shows, doubling document height and overflowing
// onto extra pages. Not applied to list items — Typography gives those their
// own tighter, different spacing that this would visibly over-space relative
// to the preview.
function paragraphSpacingProps(node: TipTapNode) {
  const lineHeightRaw = node.attrs?.["lineHeight"];
  const spacingRaw = node.attrs?.["spacingAfter"];

  const ratio =
    typeof lineHeightRaw === "string" && lineHeightRaw
      ? parseFloat(lineHeightRaw)
      : DEFAULT_LINE_HEIGHT_RATIO;
  const spacingPt =
    typeof spacingRaw === "string" && spacingRaw
      ? parseFloat(spacingRaw.replace("pt", ""))
      : DEFAULT_SPACING_PT;

  const twips = Math.round(spacingPt * 20); // 1pt = 20 twips
  const line = Math.round(ratio * 240); // Word's "auto" line-rule: 240 = single line

  return {
    spacing: { before: twips, after: twips, line, lineRule: "auto" as const },
    contextualSpacing: true
  };
}

function blockNodesToParagraphs(
  nodes: TipTapNode[],
  placeholders: Placeholder[],
  values: Record<string, string>,
  listContext?: ListContext
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  for (const node of nodes) {
    if (node.type === "paragraph" || node.type === "heading") {
      const alignment = alignmentOf(node.attrs?.["textAlign"]);
      const children = inlineNodesToRuns(
        node.content ?? [],
        placeholders,
        values
      );
      paragraphs.push(
        new Paragraph({
          children,
          alignment,
          ...(listContext?.kind === "bullet"
            ? { bullet: { level: listContext.depth } }
            : listContext?.kind === "number"
              ? {
                  numbering: {
                    reference: ORDERED_LIST_REFERENCE,
                    level: listContext.depth
                  }
                }
              : paragraphSpacingProps(node))
        })
      );
    } else if (node.type === "bulletList" || node.type === "orderedList") {
      const depth = Math.min((listContext?.depth ?? -1) + 1, MAX_LIST_DEPTH);
      const kind = node.type === "bulletList" ? "bullet" : "number";

      for (const item of node.content ?? []) {
        paragraphs.push(
          ...blockNodesToParagraphs(item.content ?? [], placeholders, values, {
            kind,
            depth
          })
        );
      }
    }
  }

  return paragraphs;
}

export async function buildDocx(payload: ExportPayload): Promise<Buffer> {
  const doc = payload.content as TipTapNode;
  const children = blockNodesToParagraphs(
    doc.content ?? [],
    payload.placeholders,
    payload.values
  );

  const dims = resolvePageDimensions(payload.pageLayout);
  const pageWidthTwips = dims.width * TWIPS_PER_PX;
  const pageHeightTwips = dims.height * TWIPS_PER_PX;
  const marginTwips = dims.margins * TWIPS_PER_PX;

  const document = new Document({
    styles: {
      default: {
        document: {
          run: {
            size: DEFAULT_RUN_SIZE_HALF_POINTS,
            font: DEFAULT_FONT_FAMILY
          }
        }
      }
    },
    numbering: {
      config: [
        {
          reference: ORDERED_LIST_REFERENCE,
          levels: [0, 1, 2, 3].map(level => ({
            level,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.START
          }))
        }
      ]
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: pageWidthTwips, height: pageHeightTwips },
            margin: {
              top: marginTwips,
              right: marginTwips,
              bottom: marginTwips,
              left: marginTwips
            }
          }
        },
        children
      }
    ]
  });

  return Packer.toBuffer(document);
}
