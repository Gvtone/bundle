import { useEditor, EditorContent } from "@tiptap/react";
import { createFillPreviewExtensions } from "@/renderer/lib/fill-preview-extensions";
import { PAGE_GUTTER_PX } from "@/shared/pageLayout";
import type { TipTapNode } from "@/renderer/hooks/usePageSlices";

interface PreviewPageSheetProps {
  slice: TipTapNode[];
  pageDimensions: { width: number; height: number; margins: number };
  pageNumber: number;
}

function PreviewPageSheet({
  slice,
  pageDimensions,
  pageNumber
}: PreviewPageSheetProps) {
  const editor = useEditor(
    {
      extensions: createFillPreviewExtensions(),
      content: { type: "doc", content: slice },
      editable: false,
      immediatelyRender: false
    },
    [slice]
  );

  return (
    <>
      {pageNumber > 1 && (
        <div
          className="flex items-center justify-center text-xs text-muted-foreground"
          style={{ height: `${PAGE_GUTTER_PX}px` }}
        >
          Page {pageNumber}
        </div>
      )}
      <div
        className="bg-white mx-auto shadow-md"
        style={{
          width: `${pageDimensions.width}px`,
          minHeight: `${pageDimensions.height}px`,
          padding: `${pageDimensions.margins}px`
        }}
      >
        <EditorContent
          editor={editor}
          className="outline-none min-h-full prose prose-sm max-w-none"
        />
      </div>
    </>
  );
}

export default PreviewPageSheet;
