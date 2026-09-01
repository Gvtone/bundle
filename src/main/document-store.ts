import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  LevelFormat,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  PageOrientation,
  HeightRule
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

// Distributes a table's content width across columns proportional to each
// column's stored pixel width (set by @tiptap/extension-table's resizable:
// true as the user drags a column border). Columns never manually resized
// have no stored width, and instead split whatever space the resized columns
// leave over — the same way a browser's `table-layout: fixed` divides
// remaining width among columns with no explicit width. Averaging the known
// widths instead would erase the user's edit in the most common case: resize
// one column of three and all three come out equal. If no column was ever
// resized, every column gets an equal share (unknownSharePx is uniform, so
// the proportions work out even).
function columnWidthsTwips(
  firstRowCells: TipTapNode[],
  contentWidthTwips: number
): number[] {
  const colWeightsPx: number[] = [];
  for (const cell of firstRowCells) {
    const span =
      typeof cell.attrs?.["colspan"] === "number"
        ? (cell.attrs["colspan"] as number)
        : 1;
    const stored = cell.attrs?.["colwidth"] as (number | null)[] | null | undefined;
    for (let i = 0; i < span; i++) {
      colWeightsPx.push(stored?.[i] ?? -1);
    }
  }

  const knownPx = colWeightsPx.filter(w => w > 0);
  const knownTotalPx = knownPx.reduce((sum, w) => sum + w, 0);
  const unknownCount = colWeightsPx.filter(w => w === -1).length;
  const contentWidthPx = contentWidthTwips / TWIPS_PER_PX;
  const unknownSharePx =
    unknownCount > 0
      ? Math.max(0, contentWidthPx - knownTotalPx) / unknownCount
      : 0;

  const resolvedWeights = colWeightsPx.map(w => (w > 0 ? w : unknownSharePx));
  const totalWeight = resolvedWeights.reduce((sum, w) => sum + w, 0);

  return resolvedWeights.map(w =>
    Math.round((w / totalWeight) * contentWidthTwips)
  );
}

// Matches --paper-foreground's light-mode value (theme.css) — the "paper"
// canvas is always light regardless of app theme, so borders/text on an
// exported document should always use the light-mode text color, not
// whatever the app's current (possibly dark) --foreground resolves to.
const BORDER_COLOR_HEX = "2b2722";

function borderProps(borderOn: unknown) {
  return borderOn === false
    ? { style: BorderStyle.NONE }
    : { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR_HEX };
}

// Keep in sync with theme.css's `.prose.prose-sm td` padding (4px vertical,
// 8px horizontal) so DOCX cell spacing matches the on-screen/PDF preview.
const CELL_MARGIN_VERTICAL_TWIPS = 4 * TWIPS_PER_PX;
const CELL_MARGIN_HORIZONTAL_TWIPS = 8 * TWIPS_PER_PX;

function tableNodeToTable(
  node: TipTapNode,
  placeholders: Placeholder[],
  values: Record<string, string>,
  contentWidthTwips: number
): Table {
  const rows = node.content ?? [];
  const firstRowCells = rows[0]?.content ?? [];
  const columnWidths = columnWidthsTwips(firstRowCells, contentWidthTwips);

  const tableRows = rows.map(rowNode => {
    const cells = rowNode.content ?? [];
    let colIndex = 0;

    const tableCells = cells.map(cellNode => {
      const span =
        typeof cellNode.attrs?.["colspan"] === "number"
          ? (cellNode.attrs["colspan"] as number)
          : 1;
      const cellWidthTwips = columnWidths
        .slice(colIndex, colIndex + span)
        .reduce((sum, w) => sum + w, 0);
      colIndex += span;

      const children = blockNodesToParagraphs(
        cellNode.content ?? [],
        placeholders,
        values,
        cellWidthTwips
      );

      return new TableCell({
        // docx requires at least one child per cell — an empty cell in the
        // editor (no paragraphs yet) would otherwise produce an invalid document.
        children: children.length > 0 ? children : [new Paragraph({})],
        width: { size: cellWidthTwips, type: WidthType.DXA },
        columnSpan: span > 1 ? span : undefined,
        margins: {
          top: CELL_MARGIN_VERTICAL_TWIPS,
          bottom: CELL_MARGIN_VERTICAL_TWIPS,
          left: CELL_MARGIN_HORIZONTAL_TWIPS,
          right: CELL_MARGIN_HORIZONTAL_TWIPS
        },
        borders: {
          top: borderProps(cellNode.attrs?.["borderTop"]),
          right: borderProps(cellNode.attrs?.["borderRight"]),
          bottom: borderProps(cellNode.attrs?.["borderBottom"]),
          left: borderProps(cellNode.attrs?.["borderLeft"])
        }
      });
    });

    const rowHeightPx =
      typeof rowNode.attrs?.["height"] === "number"
        ? (rowNode.attrs["height"] as number)
        : null;

    return new TableRow({
      children: tableCells,
      height: rowHeightPx
        ? { value: rowHeightPx * TWIPS_PER_PX, rule: HeightRule.ATLEAST }
        : undefined
    });
  });

  return new Table({
    rows: tableRows,
    width: { size: contentWidthTwips, type: WidthType.DXA }
  });
}

function blockNodesToParagraphs(
  nodes: TipTapNode[],
  placeholders: Placeholder[],
  values: Record<string, string>,
  contentWidthTwips: number,
  listContext?: ListContext
): (Paragraph | Table)[] {
  const paragraphs: (Paragraph | Table)[] = [];

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
          ...blockNodesToParagraphs(
            item.content ?? [],
            placeholders,
            values,
            contentWidthTwips,
            { kind, depth }
          )
        );
      }
    } else if (node.type === "table") {
      paragraphs.push(
        tableNodeToTable(node, placeholders, values, contentWidthTwips)
      );
    }
  }

  return paragraphs;
}

export async function buildDocx(payload: ExportPayload): Promise<Buffer> {
  const doc = payload.content as TipTapNode;

  const dims = resolvePageDimensions(payload.pageLayout);
  const pageWidthTwips = dims.width * TWIPS_PER_PX;
  const pageHeightTwips = dims.height * TWIPS_PER_PX;
  const marginTwips = dims.margins * TWIPS_PER_PX;
  const contentWidthTwips = pageWidthTwips - 2 * marginTwips;
  const orientation =
    dims.width > dims.height ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT;
  // docx's own createPageSize() swaps width/height internally whenever
  // orientation === LANDSCAPE (it expects the "intrinsic"/pre-rotation pair and
  // does the rotation itself). resolvePageDimensions() already returns the
  // post-rotation pair we use for content sizing, so passing that pair straight
  // through here would make docx swap it a second time, yielding a <w:pgSz>
  // whose w/h values contradict its own w:orient attribute (and no longer match
  // contentWidthTwips, which is computed from the correct, already-rotated width
  // above). Un-swap only for the values handed to docx's page size, to cancel
  // out its internal swap.
  const isLandscape = orientation === PageOrientation.LANDSCAPE;
  const docxPageWidthTwips = isLandscape ? pageHeightTwips : pageWidthTwips;
  const docxPageHeightTwips = isLandscape ? pageWidthTwips : pageHeightTwips;

  const children = blockNodesToParagraphs(
    doc.content ?? [],
    payload.placeholders,
    payload.values,
    contentWidthTwips
  );

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
            size: { width: docxPageWidthTwips, height: docxPageHeightTwips, orientation },
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
