import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import { FontSize } from "@/renderer/lib/font-size-extension";
import { createPlaceholderExtension } from "@/renderer/lib/placeholder-extension";
import FilledPlaceholderChip from "../components/fill-and-preview/FilledPlaceholderChip";
import Button from "../components/ui/Button";
import ValueInputCard from "../components/fill-and-preview/ValueInputCard";
import { useTemplate } from "@/renderer/context/TemplateContext";
import {
  FillValuesProvider,
  useFillValues
} from "@/renderer/context/FillValuesContext";

// Matches EditTemplatePage's Letter-size default (816x1056px @ 96dpi, 96px
// margins). Page size/margins aren't persisted anywhere yet, so there is
// nothing to read back — this just mirrors the editor's own default.
const PAGE_WIDTH = 816;
const PAGE_HEIGHT = 1056;
const MARGINS = 96;

function FillAndPreviewPage() {
  return (
    <FillValuesProvider>
      <FillAndPreviewContent />
    </FillValuesProvider>
  );
}

function FillAndPreviewContent() {
  const { meta, content, loading } = useTemplate();
  const { values, setValue } = useFillValues();

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        TextStyle,
        FontFamily,
        FontSize,
        createPlaceholderExtension(FilledPlaceholderChip)
      ],
      content: (content as object) ?? {
        type: "doc",
        content: [{ type: "paragraph" }]
      },
      editable: false,
      immediatelyRender: false
    },
    [content]
  );

  return (
    <div className="flex w-full h-full">
      <aside className="flex flex-col w-72 bg-card border-r border-border">
        <div className="flex justify-between items-center border-b border-border p-4">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold">Fill in details</h3>
            <p className="text-xs text-muted-foreground">
              Live preview updates as you type
            </p>
          </div>

          <div className="p-1 rounded-full bg-primary-soft">
            <div className="size-2 bg-primary rounded-full" />
          </div>
        </div>

        <div className="flex flex-col gap-4 p-4 flex-1 overflow-y-auto">
          {(meta?.placeholders ?? []).map(p => (
            <ValueInputCard
              key={p.id}
              placeholder={p}
              value={values[p.id] ?? ""}
              onChange={value => setValue(p.id, value)}
            />
          ))}
        </div>

        <div className="flex flex-col gap-2 bg-background p-4">
          <div className="flex justify-between">
            <p className="text-xs tracking-widest font-semibold text-subtle-foreground">
              OUTPUT
            </p>

            <div className="flex p-1 rounded-lg bg-card border border-border">
              <Button size="xs">PDF</Button>
              <Button variant="tertiary" size="xs">
                DOCX
              </Button>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <p className="text-subtle-foreground text-xs max-w-xs flex items-center gap-1 min-w-0">
              <span className="shrink-0">Save to</span>
              <span
                className="text-foreground font-serif truncate"
                title="~/Documents/Bundle/Certificate/Certificate of Appearance"
              >
                ~/Documents/Bundle/Certificate/Certificate of Appearance
              </span>
            </p>

            <Button variant="tertiary" size="xs" className="text-primary">
              Change
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 overflow-auto bg-[#e8e5df] p-8">
        {!loading && (
          <div
            className="bg-white mx-auto shadow-md"
            style={{
              width: `${PAGE_WIDTH}px`,
              minHeight: `${PAGE_HEIGHT}px`,
              padding: `${MARGINS}px`
            }}
          >
            <EditorContent
              editor={editor}
              className="outline-none min-h-full prose prose-sm max-w-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default FillAndPreviewPage;
