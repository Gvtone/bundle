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
import PlaceholderCard from "../components/edit-template/PlaceholderCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useTemplate } from "@/renderer/context/TemplateContext";
import TextAlign from "@tiptap/extension-text-align";

function EditTemplatePage() {
  const { content, loading } = useTemplate();

  // Editor is created here so both toolbar and canvas can access it
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"]
      })
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
      alignJustify: ctx.editor?.isActive({ textAlign: "justify" })
    })
  });

  return (
    <div className="flex w-full h-full overflow-hidden">
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Rich Text Toolbar */}
        <div className="flex flex-wrap items-center bg-card border-b border-border px-4 py-2">
          <div className="flex gap-2">
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

          <div className="self-stretch border-r border-border mx-2" />

          <div className="flex gap-2">
            <Input
              variant="muted"
              scale="sm"
              className="w-28"
              placeholder="Font"
            />
            <Input
              variant="muted"
              scale="sm"
              className="w-22"
              placeholder="Size"
            />
          </div>

          <div className="self-stretch border-r border-border mx-2" />

          <div className="flex gap-2">
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

          <div className="self-stretch border-r border-border mx-2" />

          <div className="flex gap-2">
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
        </div>

        {/* Paper canvas */}
        {!loading && (
          <div className="flex-1 overflow-auto bg-[#e8e5df] p-8">
            <div
              className="bg-white mx-auto shadow-md"
              style={{ width: "816px", minHeight: "1056px", padding: "96px" }}
            >
              <EditorContent
                editor={editor}
                className="outline-none min-h-full prose prose-sm max-w-none"
              />
            </div>
          </div>
        )}
      </div>

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
