import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { NormalizedFontFamily } from "@/renderer/lib/font-family-extension";
import { FontSize } from "@/renderer/lib/font-size-extension";
import { createPlaceholderExtension } from "@/renderer/lib/placeholder-extension";
import FilledPlaceholderChip from "../components/fill-and-preview/FilledPlaceholderChip";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ValueInputCard from "../components/fill-and-preview/ValueInputCard";
import { useTemplate } from "@/renderer/context/TemplateContext";
import {
  FillValuesProvider,
  useFillValues
} from "@/renderer/context/FillValuesContext";
import type { ExportFormat } from "@/shared/types";

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
  const { meta, content, loading, setExportHandler, setPrintHandler } =
    useTemplate();
  const { values, setValue, setIsCapturingSnapshot } = useFillValues();

  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [pendingAction, setPendingAction] = useState<"export" | "print" | null>(
    null
  );

  const blankPlaceholders = (meta?.placeholders ?? []).filter(
    p => !values[p.id]
  );

  function waitForPaint() {
    return new Promise<void>(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  }

  async function runExport() {
    if (!meta) return;
    try {
      if (format === "pdf") {
        setIsCapturingSnapshot(true);
        await waitForPaint();
      }
      const result = await window.bundle.exportDocument({
        templateName: meta.name,
        format,
        content,
        placeholders: meta.placeholders,
        values
      });
      if (!result.canceled) toast.success(`Exported ${format.toUpperCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsCapturingSnapshot(false);
    }
  }

  async function runPrint() {
    try {
      setIsCapturingSnapshot(true);
      await waitForPaint();
      await window.bundle.printDocument();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Print failed");
    } finally {
      setIsCapturingSnapshot(false);
    }
  }

  useEffect(() => {
    if (!meta) return;

    setExportHandler(() => {
      if (blankPlaceholders.length > 0) {
        setPendingAction("export");
      } else {
        runExport();
      }
    });

    return () => setExportHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta, content, values, format, setExportHandler]);

  useEffect(() => {
    if (!meta) return;

    setPrintHandler(() => {
      if (blankPlaceholders.length > 0) {
        setPendingAction("print");
      } else {
        runPrint();
      }
    });

    return () => setPrintHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta, values, setPrintHandler]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        TextStyle,
        NormalizedFontFamily,
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
    <div className="flex w-full h-full print:h-auto">
      <aside className="flex flex-col w-72 bg-card border-r border-border print:hidden">
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
          <div className="flex justify-between items-center">
            <p className="text-xs tracking-widest font-semibold text-subtle-foreground">
              OUTPUT
            </p>

            <div className="flex p-1 rounded-lg bg-card border border-border">
              <Button
                size="xs"
                variant={format === "pdf" ? "primary" : "tertiary"}
                onClick={() => setFormat("pdf")}
              >
                PDF
              </Button>
              <Button
                size="xs"
                variant={format === "docx" ? "primary" : "tertiary"}
                onClick={() => setFormat("docx")}
              >
                DOCX
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 overflow-auto bg-[#e8e5df] p-8 print:flex-none print:h-auto print:overflow-visible print:p-0 print:bg-white">
        {!loading && (
          <div
            className="bg-white mx-auto shadow-md print:shadow-none print:mx-0"
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

      <ConfirmDialog
        open={pendingAction !== null}
        title="Some fields are still blank"
        description={`${blankPlaceholders.map(p => p.label).join(", ")} ${
          blankPlaceholders.length === 1 ? "is" : "are"
        } empty. ${pendingAction === "print" ? "Print" : "Export"} anyway?`}
        confirmLabel={
          pendingAction === "print" ? "Print anyway" : "Export anyway"
        }
        onConfirm={() => {
          if (pendingAction === "print") runPrint();
          else runExport();
          setPendingAction(null);
        }}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}

export default FillAndPreviewPage;
