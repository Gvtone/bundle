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
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import { FontSize } from "@/renderer/lib/font-size-extension";
import PlaceholderCard from "../components/edit-template/PlaceholderCard";
import Button from "../components/ui/Button";
import { useTemplate } from "@/renderer/context/TemplateContext";
import { useState } from "react";

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
  const { content, loading } = useTemplate();
  const [pageSize, setPageSize] = useState<PageSizeKey>("letter");
  const [margins, setMargins] = useState(96);
  const [customSize, setCustomSize] = useState({ width: 816, height: 1056 });

  const currentPageSize =
    pageSize === "custom" ? customSize : PAGE_SIZES[pageSize];

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      FontFamily,
      FontSize
    ],
    content: (content as object) ?? {
      type: "doc",
      content: [{ type: "paragraph" }]
    },
    immediatelyRender: false
  });

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
              onClick={() => editor?.commands.focus("end")}
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
      <aside className="w-72 bg-card border-l border-border">
        <div className="border-b border-border p-4">
          <h3 className="text-xs tracking-widest font-semibold text-subtle-foreground">
            PLACEHOLDER FIELDS
          </h3>
          <p className="text-xs text-muted-foreground">
            Select text in the document, then Insert placeholder — or rename and
            retype fields here.
          </p>
        </div>
        <div className="p-4">
          <PlaceholderCard />
        </div>
      </aside>
    </div>
  );
}

export default EditTemplatePage;
