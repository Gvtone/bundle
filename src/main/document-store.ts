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

// 1px @ 96dpi = 1/96 inch = 1440/96 = 15 twips (docx's unit).
const TWIPS_PER_PX = 15;
const PAGE_WIDTH_TWIPS = 816 * TWIPS_PER_PX;
const PAGE_HEIGHT_TWIPS = 1056 * TWIPS_PER_PX;
const MARGIN_TWIPS = 96 * TWIPS_PER_PX;
const ORDERED_LIST_REFERENCE = "ordered-list";
const MAX_LIST_DEPTH = 3;
const DEFAULT_RUN_SIZE_HALF_POINTS = 24; // 12pt fallback for text with no explicit size mark

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
              : {})
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

  const document = new Document({
    styles: {
      default: {
        document: {
          run: { size: DEFAULT_RUN_SIZE_HALF_POINTS }
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
            size: { width: PAGE_WIDTH_TWIPS, height: PAGE_HEIGHT_TWIPS },
            margin: {
              top: MARGIN_TWIPS,
              right: MARGIN_TWIPS,
              bottom: MARGIN_TWIPS,
              left: MARGIN_TWIPS
            }
          }
        },
        children
      }
    ]
  });

  return Packer.toBuffer(document);
}
