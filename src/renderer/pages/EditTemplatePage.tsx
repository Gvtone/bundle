// src/renderer/pages/EditTemplatePage.tsx
import {
  ListBulletsIcon,
  ListNumbersIcon,
  TextAlignCenterIcon,
  TextAlignJustifyIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  TextBIcon,
  TextItalicIcon,
  TextUnderlineIcon
} from "@phosphor-icons/react";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { NormalizedFontFamily } from "@/renderer/lib/font-family-extension";
import { FontSize } from "@/renderer/lib/font-size-extension";
import PlaceholderCard from "../components/edit-template/PlaceholderCard";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Button from "../components/ui/Button";
import { useTemplate } from "@/renderer/context/TemplateContext";
import { useTemplates } from "@/renderer/context/TemplatesContext";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createPlaceholderExtension } from "@/renderer/lib/placeholder-extension";
import PlaceholderChip from "../components/edit-template/PlaceholderChip";
import { slugify } from "@/renderer/utils/slugify";
import type { Placeholder } from "@/shared/types";

// Page size definitions — width/height in pixels at 96dpi (standard screen)
const PAGE_SIZES = {
  letter: { width: 816, height: 1056 },
  a4: { width: 794, height: 1123 },
  legal: { width: 816, height: 1344 },
  folio: { width: 816, height: 1248 },
  custom: { width: 816, height: 1056 }
} as const;

type PageSizeKey = keyof typeof PAGE_SIZES;

// Safe font list — universally installed, won't break on recipient's machine
const FONT_OPTIONS = [
  { label: "Default", value: "" },
  { label: "Arial", value: "Arial" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Calibri", value: "Calibri" },
  { label: "Georgia", value: "Georgia" },
  { label: "Courier New", value: "Courier New" }
];

const FONT_SIZE_OPTIONS = [
  "8",
  "9",
  "10",
  "11",
  "12",
  "14",
  "16",
  "18",
  "20",
  "24",
  "28",
  "32",
  "36",
  "48",
  "72"
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
    setInsertPlaceholderHandler
  } = useTemplate();
  const { refetch } = useTemplates();
  const [pageSize, setPageSize] = useState<PageSizeKey>("letter");
  const [margins, setMargins] = useState(96);
  const [customSize, setCustomSize] = useState({ width: 816, height: 1056 });
  const [deleteTarget, setDeleteTarget] = useState<Placeholder | null>(null);

  const currentPageSize =
    pageSize === "custom" ? customSize : PAGE_SIZES[pageSize];

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        TextStyle,
        NormalizedFontFamily,
        FontSize,
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

  const editorState = useEditorState({
    editor,
    selector: ctx => ({
      isBold: ctx.editor?.isActive("bold"),
      isItalic: ctx.editor?.isActive("italic"),
      isUnderline: ctx.editor?.isActive("underline"),
      isBulletList: ctx.editor?.isActive("bulletList"),
      isOrderedList: ctx.editor?.isActive("orderedList"),
      alignLeft: ctx.editor?.isActive({ textAlign: "left" }),
      alignCenter: ctx.editor?.isActive({ textAlign: "center" }),
      alignRight: ctx.editor?.isActive({ textAlign: "right" }),
      alignJustify: ctx.editor?.isActive({ textAlign: "justify" }),
      // Read current font/size from selection for showing in dropdowns
      currentFont: ctx.editor?.getAttributes("textStyle")["fontFamily"] ?? "",
      currentSize: ctx.editor?.getAttributes("textStyle")["fontSize"] ?? ""
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

  function handleFontChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (!value) {
      editor?.chain().focus().unsetFontFamily().run();
    } else {
      editor?.chain().focus().setFontFamily(value).run();
    }
  }

  function handleSizeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (!value) {
      editor?.chain().focus().unsetFontSize().run();
    } else {
      editor?.chain().focus().setFontSize(`${value}pt`).run();
    }
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
            onChange={handleFontChange}
            className="text-sm bg-card-muted border border-border rounded-md px-2 py-1 w-36 focus:outline-none"
            style={{ fontFamily: editorState?.currentFont || "inherit" }}
          >
            {FONT_OPTIONS.map(f => (
              <option
                key={f.value}
                value={f.value}
                style={{ fontFamily: f.value || "inherit" }}
              >
                {f.label}
              </option>
            ))}
          </select>

          {/* Font size */}
          <select
            value={editorState?.currentSize?.replace("pt", "") ?? ""}
            onChange={handleSizeChange}
            className="text-sm bg-card-muted border border-border rounded-md px-2 py-1 w-20 focus:outline-none"
          >
            <option value="">Size</option>
            {FONT_SIZE_OPTIONS.map(s => (
              <option key={s} value={s}>
                {s}pt
              </option>
            ))}
          </select>

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
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            >
              <ListBulletsIcon />
            </Button>
            <Button
              variant={editorState?.isOrderedList ? "secondary" : "tertiary"}
              size="icon"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            >
              <ListNumbersIcon />
            </Button>
          </div>

          <div className="self-stretch border-r border-border mx-1" />

          {/* Page size */}
          <select
            value={pageSize}
            onChange={e => setPageSize(e.target.value as PageSizeKey)}
            className="text-sm bg-card-muted border border-border rounded-md px-2 py-1 w-24 focus:outline-none"
          >
            <option value="letter">Letter</option>
            <option value="a4">A4</option>
            <option value="legal">Legal</option>
            <option value="folio">Folio</option>
            <option value="custom">Custom</option>
          </select>

          {pageSize === "custom" && (
            <div className="flex items-center gap-1 text-sm">
              <input
                type="number"
                value={Math.round((customSize.width / 96) * 100) / 100}
                onChange={e =>
                  setCustomSize(s => ({
                    ...s,
                    width: Number(e.target.value) * 96
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
                value={Math.round((customSize.height / 96) * 100) / 100}
                onChange={e =>
                  setCustomSize(s => ({
                    ...s,
                    height: Number(e.target.value) * 96
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
              onChange={e => setMargins(Number(e.target.value) * 96)}
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
          <div className="flex-1 overflow-auto bg-[#e8e5df] p-8">
            <div
              className="bg-white mx-auto shadow-md"
              style={{
                width: `${currentPageSize.width}px`,
                minHeight: `${currentPageSize.height}px`,
                padding: `${margins}px`
              }}
              onClick={e => {
                if (e.target === e.currentTarget) {
                  editor?.commands.focus("end");
                }
              }}
            >
              <EditorContent
                editor={editor}
                className="outline-none min-h-full prose prose-sm max-w-none"
              />
            </div>
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
