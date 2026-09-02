// src/renderer/pages/EditTemplatePage.tsx
import {
  FileTextIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  TextAlignCenterIcon,
  TextAlignJustifyIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  TextBIcon,
  TextItalicIcon,
  TextUnderlineIcon,
  WarningCircleIcon
} from "@phosphor-icons/react";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import type { ChainedCommands, Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Table } from "@tiptap/extension-table";
import { CellSelection } from "@tiptap/pm/tables";
import { NoHeaderTableRow } from "@/renderer/lib/table-row-extension";
import { BorderedTableCell } from "@/renderer/lib/table-cell-extension";
import { TableFullWidthGuard } from "@/renderer/lib/table-full-width-guard";
import { NormalizedFontFamily } from "@/renderer/lib/font-family-extension";
import { FontSize } from "@/renderer/lib/font-size-extension";
import { ParagraphSpacing } from "@/renderer/lib/paragraph-spacing-extension";
import PlaceholderCard from "../components/edit-template/PlaceholderCard";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Button from "../components/ui/Button";
import TableInsertMenu from "../components/edit-template/TableInsertMenu";
import { useTemplate } from "@/renderer/context/TemplateContext";
import { useTemplates } from "@/renderer/context/TemplatesContext";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createPlaceholderExtension } from "@/renderer/lib/placeholder-extension";
import PlaceholderChip from "../components/edit-template/PlaceholderChip";
import { slugify } from "@/renderer/utils/slugify";
import type { Placeholder } from "@/shared/types";
import {
  DEFAULT_PAGE_LAYOUT,
  resolvePageDimensions,
  type PageSizeKey
} from "@/shared/pageLayout";
import { usePageBreakOverlay } from "@/renderer/hooks/usePageBreakOverlay";
import { useTableGridControls } from "@/renderer/hooks/useTableGridControls";
import TableGridOverlay from "../components/edit-template/TableGridOverlay";
import TableBorderPainter from "../components/edit-template/TableBorderPainter";
import { useZoom } from "@/renderer/hooks/useZoom";
import ZoomControl from "../components/ui/ZoomControl";
import {
  FONT_OPTIONS,
  FONT_SIZE_OPTIONS,
  isSafeFont
} from "@/renderer/lib/font-options";
import { useSystemFonts } from "@/renderer/hooks/useSystemFonts";
import {
  DEFAULT_FONT_SIZE_PT,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_SPACING_BEFORE_PT,
  DEFAULT_SPACING_AFTER_PT
} from "@/shared/documentDefaults";

const LINE_HEIGHT_OPTIONS = [
  { label: "Single", value: "1" },
  { label: "1.15", value: "1.15" },
  { label: "1.5", value: "1.5" },
  { label: "Double", value: "2" }
];

const SPACING_OPTIONS = [
  { label: "None", value: "0pt" },
  { label: "6pt", value: "6pt" },
  { label: "8pt", value: "8pt" },
  { label: "12pt", value: "12pt" },
  { label: "18pt", value: "18pt" },
  { label: "24pt", value: "24pt" }
];

function EditTemplatePage() {
  const {
    meta,
    content,
    setContent,
    loading,
    save,
    setSaveHandler,
    updatePlaceholders,
    updatePageLayout,
    setInsertPlaceholderHandler
  } = useTemplate();
  const { refetch } = useTemplates();
  const [deleteTarget, setDeleteTarget] = useState<Placeholder | null>(null);

  const pageLayout = meta?.pageLayout ?? DEFAULT_PAGE_LAYOUT;
  const { size: pageSize, margins } = pageLayout;
  const currentPageSize = resolvePageDimensions(pageLayout);
  const usableHeight = currentPageSize.height - 2 * currentPageSize.margins;

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        TextStyle,
        NormalizedFontFamily,
        FontSize,
        ParagraphSpacing,
        Table.configure({ resizable: true }),
        NoHeaderTableRow,
        BorderedTableCell,
        TableFullWidthGuard,
        createPlaceholderExtension(PlaceholderChip)
      ],
      content: (content as object) ?? {
        type: "doc",
        content: [{ type: "paragraph" }]
      },
      immediatelyRender: false
    },
    [content]
  );

  const { zoom, zoomFactor, zoomIn, zoomOut, reset: resetZoom, containerRef: zoomContainerRef } =
    useZoom();

  const { fonts: systemFonts } = useSystemFonts();
  const otherFonts = systemFonts.filter(f => !isSafeFont(f));

  const pageBreakLines = usePageBreakOverlay(editor, usableHeight, zoomFactor);
  const tableGridControls = useTableGridControls(editor, zoomFactor);

  const editorState = useEditorState({
    editor,
    selector: ctx => ({
      isBold: ctx.editor?.isActive("bold"),
      isItalic: ctx.editor?.isActive("italic"),
      isUnderline: ctx.editor?.isActive("underline"),
      isBulletList: ctx.editor?.isActive("bulletList"),
      isOrderedList: ctx.editor?.isActive("orderedList"),
      isInsideTable: ctx.editor?.isActive("table"),
      alignLeft: ctx.editor?.isActive({ textAlign: "left" }),
      alignCenter: ctx.editor?.isActive({ textAlign: "center" }),
      alignRight: ctx.editor?.isActive({ textAlign: "right" }),
      alignJustify: ctx.editor?.isActive({ textAlign: "justify" }),
      // Read current font/size from selection for showing in dropdowns
      currentFont: ctx.editor?.getAttributes("textStyle")["fontFamily"] ?? "",
      currentSize: ctx.editor?.getAttributes("textStyle")["fontSize"] ?? "",
      currentLineHeight: ctx.editor?.isActive("heading")
        ? (ctx.editor?.getAttributes("heading")["lineHeight"] ?? "")
        : (ctx.editor?.getAttributes("paragraph")["lineHeight"] ?? ""),
      currentSpacingBefore: ctx.editor?.isActive("heading")
        ? (ctx.editor?.getAttributes("heading")["spacingBefore"] ?? "")
        : (ctx.editor?.getAttributes("paragraph")["spacingBefore"] ?? ""),
      currentSpacingAfter: ctx.editor?.isActive("heading")
        ? (ctx.editor?.getAttributes("heading")["spacingAfter"] ?? "")
        : (ctx.editor?.getAttributes("paragraph")["spacingAfter"] ?? ""),
      currentContextualSpacing: ctx.editor?.isActive("heading")
        ? (ctx.editor?.getAttributes("heading")["contextualSpacing"] ?? true)
        : (ctx.editor?.getAttributes("paragraph")["contextualSpacing"] ?? true)
    })
  });

  // Computed directly from `editor` (not via the useEditorState selector above) because
  // tiptap-react's EditorStateManager only refreshes its cached snapshot on a real
  // transaction — when useEditor([content]) swaps in a brand-new editor instance on
  // template load, the selector snapshot stays stale (pointing at the previous editor)
  // until the user's first interaction fires a transaction. Reading `editor` directly
  // here avoids that staleness since `editor` itself updates immediately on swap.
  const placeholderCounts: Record<string, number> = {};
  editor?.state.doc.descendants(node => {
    if (node.type.name === "placeholder") {
      const id = node.attrs["id"] as string;
      placeholderCounts[id] = (placeholderCounts[id] ?? 0) + 1;
    }
  });

  useEffect(() => {
    if (!editor || !meta) return;

    setSaveHandler(async () => {
      try {
        const json = editor.getJSON();
        await window.bundle.saveTemplate(meta, json);
        setContent(json);
        refetch();
        toast.success("Template saved");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to save template"
        );
      }
    });

    return () => setSaveHandler(null);
  }, [editor, meta, refetch, setSaveHandler, setContent]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        save?.();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [save]);

  function nextAvailableLabel(existing: Placeholder[]): string {
    const base = "New field";
    const labels = new Set(existing.map(p => p.label));
    if (!labels.has(base)) return base;
    let n = 2;
    while (labels.has(`${base} ${n}`)) n++;
    return `${base} ${n}`;
  }

  useEffect(() => {
    if (!editor || !meta) return;

    setInsertPlaceholderHandler(() => {
      const { from, to, empty } = editor.state.selection;
      const selectedText = empty
        ? ""
        : editor.state.doc.textBetween(from, to, " ");
      const label = selectedText || nextAvailableLabel(meta.placeholders);
      const id = crypto.randomUUID();
      const key = slugify(label);

      updatePlaceholders(prev => [
        ...prev,
        {
          id,
          key,
          label,
          type: "text",
          style: { bold: false, italic: false, underline: false }
        }
      ]);

      editor
        .chain()
        .focus()
        .insertContentAt({ from, to }, { type: "placeholder", attrs: { id } })
        .run();
    });

    return () => setInsertPlaceholderHandler(null);
  }, [editor, meta, updatePlaceholders, setInsertPlaceholderHandler]);

  function handleDeleteConfirm() {
    if (!deleteTarget || !editor) return;
    const id = deleteTarget.id;

    const positions: number[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "placeholder" && node.attrs["id"] === id) {
        positions.push(pos);
      }
    });

    let chain = editor.chain().focus();
    for (const pos of positions.reverse()) {
      chain = chain.deleteRange({ from: pos, to: pos + 1 });
    }
    chain.run();

    updatePlaceholders(prev => prev.filter(p => p.id !== id));
    setDeleteTarget(null);
  }

  // Native <select> elements steal DOM focus more disruptively than a
  // same-page button, which can collapse the editor's selection (especially
  // one spanning multiple list items, or a CellSelection spanning multiple
  // table cells) before the change handler runs. Capturing the selection on
  // mousedown (before that focus shift happens) lets us restore it instead
  // of trusting whatever editor.state.selection has become by the time
  // onChange fires.
  type SavedSelection =
    | { type: "text"; from: number; to: number }
    | { type: "cells"; anchorCellPos: number; headCellPos: number };

  const savedSelectionRef = useRef<SavedSelection | null>(null);

  function captureSelection() {
    if (!editor) return;
    const selection = editor.state.selection;
    savedSelectionRef.current =
      selection instanceof CellSelection
        ? {
            type: "cells",
            anchorCellPos: selection.$anchorCell.pos,
            headCellPos: selection.$headCell.pos
          }
        : { type: "text", from: selection.from, to: selection.to };
  }

  // A CellSelection has no single from/to text range — chain().setTextSelection()
  // used to collapse it down to just the anchor/head cell's own range, which is
  // why picking a font/size/spacing while multiple cells were selected only ever
  // affected the one cell the cursor happened to be in. This applies `apply` to
  // EVERY selected cell's content range within one transaction instead, then
  // restores the multi-cell selection afterward so it doesn't look like it
  // collapsed to a single cell on screen either.
  function applyFormat(
    editorInstance: Editor,
    saved: SavedSelection | null,
    apply: (chain: ChainedCommands) => ChainedCommands
  ) {
    if (saved?.type === "cells") {
      const { anchorCellPos, headCellPos } = saved;
      let chain = editorInstance.chain().focus();
      const cellSelection = new CellSelection(
        editorInstance.state.doc.resolve(anchorCellPos),
        editorInstance.state.doc.resolve(headCellPos)
      );
      cellSelection.forEachCell((node, pos) => {
        chain = apply(chain.setTextSelection({ from: pos + 1, to: pos + node.nodeSize - 1 }));
      });
      chain
        .command(({ tr }) => {
          tr.setSelection(
            new CellSelection(tr.doc.resolve(anchorCellPos), tr.doc.resolve(headCellPos))
          );
          return true;
        })
        .run();
      return;
    }

    const chain = editorInstance.chain().focus();
    apply(saved ? chain.setTextSelection({ from: saved.from, to: saved.to }) : chain).run();
  }

  // For plain buttons (not native <select>s), a click doesn't steal DOM
  // focus the way a <select> does, so editor.state.selection is still the
  // live, intact CellSelection at click time — no captured ref needed.
  function applyFormatToLiveSelection(
    editorInstance: Editor,
    apply: (chain: ChainedCommands) => ChainedCommands
  ) {
    const selection = editorInstance.state.selection;
    const saved: SavedSelection | null =
      selection instanceof CellSelection
        ? {
            type: "cells",
            anchorCellPos: selection.$anchorCell.pos,
            headCellPos: selection.$headCell.pos
          }
        : null;
    applyFormat(editorInstance, saved, apply);
  }

  function handleFontChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!editor) return;
    const value = e.target.value;
    applyFormat(editor, savedSelectionRef.current, chain =>
      value ? chain.setFontFamily(value) : chain.unsetFontFamily()
    );
  }

  function handleSizeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!editor) return;
    const value = e.target.value;
    applyFormat(editor, savedSelectionRef.current, chain =>
      value ? chain.setFontSize(`${value}pt`) : chain.unsetFontSize()
    );
  }

  function handleLineHeightChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!editor) return;
    const value = e.target.value;
    applyFormat(editor, savedSelectionRef.current, chain => chain.setLineHeight(value || null));
  }

  function handleSpacingBeforeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!editor) return;
    const value = e.target.value;
    applyFormat(editor, savedSelectionRef.current, chain =>
      chain.setSpacingBefore(value || null)
    );
  }

  function handleSpacingAfterChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!editor) return;
    const value = e.target.value;
    applyFormat(editor, savedSelectionRef.current, chain =>
      chain.setSpacingAfter(value || null)
    );
  }

  function handleContextualSpacingChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!editor) return;
    const value = e.target.checked;
    applyFormat(editor, savedSelectionRef.current, chain =>
      chain.setContextualSpacing(value)
    );
  }

  return (
    <div className="flex w-full h-full overflow-hidden">
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Rich Text Toolbar */}
        <div className="flex flex-wrap items-center bg-card border-b border-border px-4 py-2 gap-1">
          {/* Bold / Italic / Underline */}
          <div className="flex gap-1">
            <Button
              variant={editorState?.isBold ? "secondary" : "tertiary"}
              size="icon"
              onClick={() => editor?.chain().focus().toggleBold().run()}
            >
              <TextBIcon weight="bold" />
            </Button>
            <Button
              variant={editorState?.isItalic ? "secondary" : "tertiary"}
              size="icon"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            >
              <TextItalicIcon />
            </Button>
            <Button
              variant={editorState?.isUnderline ? "secondary" : "tertiary"}
              size="icon"
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
            >
              <TextUnderlineIcon />
            </Button>
          </div>

          <div className="self-stretch border-r border-border mx-1" />

          {/* Font family */}
          <select
            value={editorState?.currentFont ?? ""}
            onMouseDown={captureSelection}
            onChange={handleFontChange}
            className="text-sm bg-card-muted border border-border rounded-md px-2 py-1 w-36 focus:outline-none"
            style={{ fontFamily: editorState?.currentFont || "inherit" }}
          >
            <option value="">{FONT_OPTIONS[0]?.label}</option>
            <optgroup label="Recommended">
              {FONT_OPTIONS.slice(1).map(f => (
                <option
                  key={f.value}
                  value={f.value}
                  style={{ fontFamily: f.value || "inherit" }}
                >
                  {f.label}
                </option>
              ))}
            </optgroup>
            {otherFonts.length > 0 && (
              <optgroup label="Other fonts on this device">
                {otherFonts.map(f => (
                  <option key={f} value={f} style={{ fontFamily: f }}>
                    {f}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {editorState?.currentFont && !isSafeFont(editorState.currentFont) && (
            <span
              className="shrink-0 text-warning"
              title={`"${editorState.currentFont}" may not display correctly for recipients who don't have it installed.`}
            >
              <WarningCircleIcon />
            </span>
          )}

          {/* Font size */}
          <select
            value={editorState?.currentSize?.replace("pt", "") ?? ""}
            onMouseDown={captureSelection}
            onChange={handleSizeChange}
            className="text-sm bg-card-muted border border-border rounded-md px-2 py-1 w-28 focus:outline-none"
          >
            <option value="">{DEFAULT_FONT_SIZE_PT}pt (Default)</option>
            {FONT_SIZE_OPTIONS.map(s => (
              <option key={s} value={s}>
                {s}pt
              </option>
            ))}
          </select>

          {/* Line spacing */}
          <select
            value={editorState?.currentLineHeight ?? ""}
            onMouseDown={captureSelection}
            onChange={handleLineHeightChange}
            className="text-sm bg-card-muted border border-border rounded-md px-2 py-1 w-32 focus:outline-none"
          >
            <option value="">{DEFAULT_LINE_HEIGHT} (Default)</option>
            {LINE_HEIGHT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Spacing before */}
          <select
            value={editorState?.currentSpacingBefore ?? ""}
            onMouseDown={captureSelection}
            onChange={handleSpacingBeforeChange}
            title="Spacing before paragraph"
            className="text-sm bg-card-muted border border-border rounded-md px-2 py-1 w-36 focus:outline-none"
          >
            <option value="">{DEFAULT_SPACING_BEFORE_PT}pt before (Default)</option>
            {SPACING_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label} before
              </option>
            ))}
          </select>

          {/* Spacing after */}
          <select
            value={editorState?.currentSpacingAfter ?? ""}
            onMouseDown={captureSelection}
            onChange={handleSpacingAfterChange}
            title="Spacing after paragraph"
            className="text-sm bg-card-muted border border-border rounded-md px-2 py-1 w-36 focus:outline-none"
          >
            <option value="">{DEFAULT_SPACING_AFTER_PT}pt after (Default)</option>
            {SPACING_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label} after
              </option>
            ))}
          </select>

          {/* Contextual spacing (Word's "Don't add space between paragraphs of the same style") */}
          <label
            className="flex items-center gap-1.5 text-sm px-2 py-1 cursor-pointer select-none"
            title="Don't add space between paragraphs of the same style — matches Word's paragraph spacing checkbox. Only affects the exported DOCX; the on-screen preview already collapses adjacent spacing."
          >
            <input
              type="checkbox"
              checked={editorState?.currentContextualSpacing ?? true}
              onMouseDown={captureSelection}
              onChange={handleContextualSpacingChange}
            />
            No space between same style
          </label>

          <div className="self-stretch border-r border-border mx-1" />

          {/* Text alignment */}
          <div className="flex gap-1">
            <Button
              variant={editorState?.alignLeft ? "secondary" : "tertiary"}
              size="icon"
              onClick={() => editor?.chain().focus().setTextAlign("left").run()}
            >
              <TextAlignLeftIcon />
            </Button>
            <Button
              variant={editorState?.alignCenter ? "secondary" : "tertiary"}
              size="icon"
              onClick={() =>
                editor?.chain().focus().setTextAlign("center").run()
              }
            >
              <TextAlignCenterIcon />
            </Button>
            <Button
              variant={editorState?.alignRight ? "secondary" : "tertiary"}
              size="icon"
              onClick={() =>
                editor?.chain().focus().setTextAlign("right").run()
              }
            >
              <TextAlignRightIcon />
            </Button>
            <Button
              variant={editorState?.alignJustify ? "secondary" : "tertiary"}
              size="icon"
              onClick={() =>
                editor?.chain().focus().setTextAlign("justify").run()
              }
            >
              <TextAlignJustifyIcon />
            </Button>
          </div>

          <div className="self-stretch border-r border-border mx-1" />

          {/* Lists */}
          <div className="flex gap-1">
            <Button
              variant={editorState?.isBulletList ? "secondary" : "tertiary"}
              size="icon"
              onClick={() =>
                editor && applyFormatToLiveSelection(editor, chain => chain.toggleBulletList())
              }
            >
              <ListBulletsIcon />
            </Button>
            <Button
              variant={editorState?.isOrderedList ? "secondary" : "tertiary"}
              size="icon"
              onClick={() =>
                editor && applyFormatToLiveSelection(editor, chain => chain.toggleOrderedList())
              }
            >
              <ListNumbersIcon />
            </Button>
          </div>

          {editor && (
            <TableInsertMenu editor={editor} isInsideTable={editorState?.isInsideTable ?? false} />
          )}

          <div className="self-stretch border-r border-border mx-1" />

          {/* Page size */}
          <select
            value={pageSize}
            onChange={e =>
              updatePageLayout(prev => ({
                ...prev,
                size: e.target.value as PageSizeKey
              }))
            }
            className="text-sm bg-card-muted border border-border rounded-md px-2 py-1 w-24 focus:outline-none"
          >
            <option value="letter">Letter</option>
            <option value="a4">A4</option>
            <option value="legal">Legal</option>
            <option value="folio">Folio</option>
            <option value="custom">Custom</option>
          </select>

          <Button
            variant="tertiary"
            size="icon"
            disabled={pageSize === "custom"}
            onClick={() =>
              updatePageLayout(prev => ({
                ...prev,
                orientation: prev.orientation === "landscape" ? "portrait" : "landscape"
              }))
            }
            title={pageLayout.orientation === "landscape" ? "Landscape" : "Portrait"}
          >
            <FileTextIcon
              size={16}
              weight="regular"
              style={{
                transform: pageLayout.orientation === "landscape" ? "rotate(90deg)" : undefined
              }}
            />
          </Button>

          {pageSize === "custom" && (
            <div className="flex items-center gap-1 text-sm">
              <input
                type="number"
                value={Math.round((currentPageSize.width / 96) * 100) / 100}
                onChange={e =>
                  updatePageLayout(prev => ({
                    ...prev,
                    customWidth: Number(e.target.value) * 96
                  }))
                }
                step="0.1"
                min="4"
                max="18"
                className="w-16 text-sm bg-card-muted border border-border rounded-md px-2 py-1 focus:outline-none"
              />
              <span className="text-xs text-muted-foreground">×</span>
              <input
                type="number"
                value={Math.round((currentPageSize.height / 96) * 100) / 100}
                onChange={e =>
                  updatePageLayout(prev => ({
                    ...prev,
                    customHeight: Number(e.target.value) * 96
                  }))
                }
                step="0.1"
                min="4"
                max="24"
                className="w-16 text-sm bg-card-muted border border-border rounded-md px-2 py-1 focus:outline-none"
              />
              <span className="text-xs text-muted-foreground">in</span>
            </div>
          )}

          {/* Margins */}
          <div className="flex items-center gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Margins</span>
            <input
              type="number"
              value={Math.round((margins / 96) * 100) / 100}
              onChange={e =>
                updatePageLayout(prev => ({
                  ...prev,
                  margins: Number(e.target.value) * 96
                }))
              }
              step="0.25"
              min="0"
              max="3"
              className="w-16 text-sm bg-card-muted border border-border rounded-md px-2 py-1 focus:outline-none"
            />
            <span className="text-xs text-muted-foreground">in</span>
          </div>
        </div>

        {/* Paper canvas */}
        {!loading && (
          <div className="relative flex-1 overflow-hidden">
            <div
              ref={zoomContainerRef}
              className="h-full overflow-auto bg-background-sunken p-8"
            >
              <div
                className="editing-surface relative bg-white mx-auto shadow-md"
                style={{
                  width: `${currentPageSize.width}px`,
                  minHeight: `${currentPageSize.height}px`,
                  padding: `${margins}px`,
                  transform: `scale(${zoomFactor})`,
                  transformOrigin: "top center"
                }}
                onMouseDown={e => {
                  if (e.target === e.currentTarget) {
                    editor?.commands.focus("end");
                  }
                }}
              >
                <EditorContent
                  editor={editor}
                  className="outline-none min-h-full prose prose-sm max-w-none"
                />

                {pageBreakLines.map((line, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 pointer-events-none"
                    style={{ top: `${line.top + margins}px` }}
                  >
                    <div className="border-t border-dashed border-subtle-foreground" />
                    <div className="absolute -top-5 right-0 text-xs text-muted-foreground bg-white px-1">
                      Page {i + 2}
                    </div>
                  </div>
                ))}

                {editor && (
                  <TableGridOverlay
                    editor={editor}
                    controls={tableGridControls}
                    margins={margins}
                    zoomFactor={zoomFactor}
                  />
                )}

                {editor && (
                  <TableBorderPainter
                    editor={editor}
                    margins={margins}
                    zoomFactor={zoomFactor}
                  />
                )}
              </div>
            </div>

            <ZoomControl
              zoom={zoom}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onReset={resetZoom}
            />
          </div>
        )}
      </div>

      {/* Placeholder panel */}
      <aside className="w-72 bg-card border-l border-border flex flex-col h-full overflow-hidden">
        <div className="border-b border-border p-4 shrink-0">
          <h3 className="text-xs tracking-widest font-semibold text-subtle-foreground">
            PLACEHOLDER FIELDS
          </h3>
          <p className="text-xs text-muted-foreground">
            Select text in the document, then Insert placeholder — or rename and
            retype fields here.
          </p>
        </div>
        <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">
          {(meta?.placeholders ?? []).map(p => (
            <PlaceholderCard
              key={p.id}
              placeholder={p}
              useCount={placeholderCounts[p.id] ?? 0}
              onLabelChange={label =>
                updatePlaceholders(prev =>
                  prev.map(x =>
                    x.id === p.id ? { ...x, label, key: slugify(label) } : x
                  )
                )
              }
              onTypeChange={type =>
                updatePlaceholders(prev =>
                  prev.map(x => (x.id === p.id ? { ...x, type } : x))
                )
              }
              onStyleChange={style =>
                updatePlaceholders(prev =>
                  prev.map(x =>
                    x.id === p.id
                      ? { ...x, style: { ...x.style, ...style } }
                      : x
                  )
                )
              }
              onDateFormatChange={dateFormat =>
                updatePlaceholders(prev =>
                  prev.map(x => (x.id === p.id ? { ...x, dateFormat } : x))
                )
              }
              onDeleteRequest={() => setDeleteTarget(p)}
              onInsert={() =>
                editor
                  ?.chain()
                  .focus()
                  .insertContent({ type: "placeholder", attrs: { id: p.id } })
                  .run()
              }
            />
          ))}
        </div>
      </aside>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete "${deleteTarget?.label}"?`}
        description={`Used in ${
          placeholderCounts[deleteTarget?.id ?? ""] ?? 0
        } place(s). This can't be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default EditTemplatePage;
