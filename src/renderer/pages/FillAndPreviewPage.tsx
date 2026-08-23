import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { NormalizedFontFamily } from "@/renderer/lib/font-family-extension";
import { FontSize } from "@/renderer/lib/font-size-extension";
import { ParagraphSpacing } from "@/renderer/lib/paragraph-spacing-extension";
import { createPlaceholderExtension } from "@/renderer/lib/placeholder-extension";
import FilledPlaceholderChip from "../components/fill-and-preview/FilledPlaceholderChip";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ValueInputCard from "../components/fill-and-preview/ValueInputCard";
import RowSelector from "../components/fill-and-preview/RowSelector";
import PresetDropdown from "../components/fill-and-preview/PresetDropdown";
import { buildBulkFilename } from "@/renderer/utils/bulkFilename";
import { cn } from "@/renderer/utils/utils";
import { useTemplate } from "@/renderer/context/TemplateContext";
import {
  FillValuesProvider,
  useFillValues
} from "@/renderer/context/FillValuesContext";
import type { ExportFormat, Preset } from "@/shared/types";
import { DEFAULT_PAGE_LAYOUT, resolvePageDimensions } from "@/shared/pageLayout";

function FillAndPreviewPage() {
  return (
    <FillValuesProvider>
      <FillAndPreviewContent />
    </FillValuesProvider>
  );
}

function FillAndPreviewContent() {
  const {
    meta,
    content,
    loading,
    setExportHandler,
    setPrintHandler,
    setBulkExportState
  } = useTemplate();
  const {
    values,
    setValue,
    setIsCapturingSnapshot,
    listEnabled,
    setListEnabled,
    listValues,
    setListRows,
    currentRow,
    setCurrentRow,
    clearField,
    clearAll,
    applySnapshot,
    getSnapshot
  } = useFillValues();

  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [presets, setPresets] = useState<Preset[]>([]);

  const pageLayout = meta?.pageLayout ?? DEFAULT_PAGE_LAYOUT;
  const pageDimensions = resolvePageDimensions(pageLayout);
  const [pendingAction, setPendingAction] = useState<
    "export-current" | "export-all" | "print-current" | "print-all" | null
  >(null);
  const [isMergedPrintActive, setIsMergedPrintActive] = useState(false);

  const paperRef = useRef<HTMLDivElement>(null);
  const mergedPrintRef = useRef<HTMLDivElement>(null);

  const blankPlaceholders = (meta?.placeholders ?? []).filter(
    p => !values[p.id]
  );

  const listFields = (meta?.placeholders ?? []).filter(p => listEnabled[p.id]);
  const rowCounts = listFields.map(p => ({
    label: p.label,
    count: listValues[p.id]?.length ?? 0
  }));
  const rowCountMismatch =
    new Set(rowCounts.map(r => r.count)).size > 1
      ? rowCounts
          .map(r => `${r.label}: ${r.count} row${r.count === 1 ? "" : "s"}`)
          .join(", ")
      : null;
  const rowCount = rowCountMismatch ? 0 : (rowCounts[0]?.count ?? 1);

  const blankCellsAllRows: string[] = [];
  for (const p of meta?.placeholders ?? []) {
    if (listEnabled[p.id]) {
      (listValues[p.id] ?? []).forEach((v, i) => {
        if (!v) blankCellsAllRows.push(`${p.label} (Row ${i + 1})`);
      });
    } else if (!values[p.id]) {
      blankCellsAllRows.push(p.label);
    }
  }

  useEffect(() => {
    if (!meta) return;
    window.bundle.listPresets(meta.id).then(setPresets);
  }, [meta]);

  function handleSaveNewPreset(name: string) {
    if (!meta) return;
    window.bundle
      .savePreset(meta.id, name, getSnapshot())
      .then(preset => setPresets(prev => [preset, ...prev]));
  }

  function handleDeletePreset(presetId: string) {
    if (!meta) return;
    window.bundle
      .deletePreset(meta.id, presetId)
      .then(() => setPresets(prev => prev.filter(p => p.id !== presetId)));
  }

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
        values,
        pageLayout
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

  async function runExportAll() {
    if (!meta || rowCountMismatch) return;
    const folderResult = await window.bundle.chooseExportFolder();
    if (folderResult.canceled || !folderResult.folderPath) return;
    const folderPath = folderResult.folderPath;

    try {
      if (format === "pdf") setIsCapturingSnapshot(true);
      const usedNames = new Set<string>();

      for (let i = 0; i < rowCount; i++) {
        setCurrentRow(i);
        if (format === "pdf") await waitForPaint();

        const rowValues: Record<string, string> = {};
        for (const p of meta.placeholders) {
          rowValues[p.id] = listEnabled[p.id]
            ? (listValues[p.id]?.[i] ?? "")
            : (values[p.id] ?? "");
        }

        const listFieldValuesForRow = listFields.map(
          p => listValues[p.id]?.[i] ?? ""
        );
        const filename = buildBulkFilename(
          meta.name,
          listFieldValuesForRow,
          format,
          usedNames
        );

        const result = await window.bundle.exportDocument({
          templateName: meta.name,
          format,
          content,
          placeholders: meta.placeholders,
          values: rowValues,
          pageLayout,
          destinationPath: `${folderPath}/${filename}`
        });
        if (result.canceled) {
          throw new Error(`Row ${i + 1} was not written`);
        }
      }

      toast.success(`Exported ${rowCount} documents`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk export failed");
    } finally {
      setIsCapturingSnapshot(false);
    }
  }

  async function runPrintAll() {
    if (!meta || rowCountMismatch) return;
    const container = mergedPrintRef.current;
    if (!container) return;

    try {
      setIsCapturingSnapshot(true);
      setIsMergedPrintActive(true);
      container.innerHTML = "";

      for (let i = 0; i < rowCount; i++) {
        setCurrentRow(i);
        await waitForPaint();

        const snapshot = paperRef.current?.cloneNode(true) as
          | HTMLElement
          | undefined;
        if (!snapshot) continue;

        const wrapper = document.createElement("div");
        if (i < rowCount - 1) wrapper.style.breakAfter = "page";
        wrapper.appendChild(snapshot);
        container.appendChild(wrapper);
      }

      await waitForPaint();
      await window.bundle.printDocument();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Print failed");
    } finally {
      setIsCapturingSnapshot(false);
      setIsMergedPrintActive(false);
      container.innerHTML = "";
    }
  }

  useEffect(() => {
    if (!meta) return;

    setExportHandler(() => {
      if (blankPlaceholders.length > 0) {
        setPendingAction("export-current");
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
        setPendingAction("print-current");
      } else {
        runPrint();
      }
    });

    return () => setPrintHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta, values, setPrintHandler]);

  useEffect(() => {
    setBulkExportState({
      hasListFields: listFields.length > 0,
      rowCount,
      rowMismatchMessage: rowCountMismatch,
      exportAllHandler:
        listFields.length > 0 && !rowCountMismatch
          ? () => {
              if (blankCellsAllRows.length > 0) {
                setPendingAction("export-all");
              } else {
                runExportAll();
              }
            }
          : null,
      printAllHandler:
        listFields.length > 0 && !rowCountMismatch
          ? () => {
              if (blankCellsAllRows.length > 0) {
                setPendingAction("print-all");
              } else {
                runPrintAll();
              }
            }
          : null
    });

    return () =>
      setBulkExportState({
        hasListFields: false,
        rowCount: 0,
        rowMismatchMessage: null,
        exportAllHandler: null,
        printAllHandler: null
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    meta,
    content,
    values,
    format,
    listEnabled,
    listValues,
    currentRow,
    setBulkExportState
  ]);

  const confirmIsAll =
    pendingAction === "export-all" || pendingAction === "print-all";
  const confirmCells = confirmIsAll
    ? blankCellsAllRows
    : blankPlaceholders.map(p => p.label);
  const confirmShown = confirmCells.slice(0, 10);
  const confirmExtra =
    confirmCells.length > 10 ? ` +${confirmCells.length - 10} more` : "";
  const confirmDescription = `${confirmShown.join(", ")}${confirmExtra} ${
    confirmCells.length === 1 ? "is" : "are"
  } empty. ${pendingAction?.startsWith("print") ? "Print" : "Export"} anyway?`;

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        TextStyle,
        NormalizedFontFamily,
        FontSize,
        ParagraphSpacing,
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
          <PresetDropdown
            presets={presets}
            onLoad={preset => applySnapshot(preset.snapshot)}
            onSaveNew={handleSaveNewPreset}
            onDelete={handleDeletePreset}
          />

          {(meta?.placeholders ?? []).map(p => (
            <ValueInputCard
              key={p.id}
              placeholder={p}
              value={values[p.id] ?? ""}
              onChange={value => setValue(p.id, value)}
              listEnabled={listEnabled[p.id] ?? false}
              onToggleList={() =>
                setListEnabled(p.id, !(listEnabled[p.id] ?? false))
              }
              listText={(listValues[p.id] ?? []).join("\n")}
              onListTextChange={text => setListRows(p.id, text)}
              onClear={() => clearField(p.id)}
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

          <Button size="xs" variant="muted" onClick={clearAll}>
            Clear all
          </Button>
        </div>
      </aside>

      <div
        className={cn(
          "flex-1 flex flex-col overflow-hidden print:flex-none print:h-auto print:overflow-visible",
          isMergedPrintActive && "print:hidden"
        )}
      >
        {listFields.length > 0 && (
          <RowSelector
            currentRow={currentRow}
            rowCount={rowCount}
            mismatchMessage={rowCountMismatch}
            onChange={setCurrentRow}
          />
        )}

        <div className="flex-1 overflow-auto bg-[#e8e5df] p-8 print:overflow-visible print:p-0 print:bg-white">
          {!loading && (
            <div
              ref={paperRef}
              className="bg-white mx-auto shadow-md print:shadow-none print:mx-0"
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
          )}
        </div>
      </div>

      <div
        ref={mergedPrintRef}
        className={cn("hidden", isMergedPrintActive && "print:block")}
      />

      <ConfirmDialog
        open={pendingAction !== null}
        title="Some fields are still blank"
        description={confirmDescription}
        confirmLabel={
          pendingAction?.startsWith("print") ? "Print anyway" : "Export anyway"
        }
        onConfirm={() => {
          if (pendingAction === "export-current") runExport();
          else if (pendingAction === "export-all") runExportAll();
          else if (pendingAction === "print-current") runPrint();
          else if (pendingAction === "print-all") runPrintAll();
          setPendingAction(null);
        }}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}

export default FillAndPreviewPage;
