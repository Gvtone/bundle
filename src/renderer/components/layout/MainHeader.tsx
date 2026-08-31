import { useEffect, useState } from "react";
import Button from "../ui/Button";
import LinkButton from "../ui/LinkButton";
import ActionMenuButton from "./ActionMenuButton";
import { useLocation, useParams } from "react-router";
import { ExportIcon, PrinterIcon } from "@phosphor-icons/react";
import { useTemplate } from "@/renderer/context/TemplateContext";
import { cn } from "@/renderer/utils/utils";

function MainHeader() {
  const { templateId } = useParams();
  const { pathname } = useLocation();
  const {
    meta,
    save,
    insertPlaceholder,
    exportHandler,
    printHandler,
    bulkExportState,
    updateMeta
  } = useTemplate();
  const isEdit = pathname.endsWith("/edit");

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  // Renaming is in-memory only (persisted on the next Save, same as
  // placeholder label edits) — leaving the page mid-edit shouldn't leave a
  // stale draft active for the next template.
  useEffect(() => {
    setIsEditingName(false);
  }, [templateId]);

  function startEditingName() {
    if (!isEdit || !meta) return;
    setNameDraft(meta.name);
    setIsEditingName(true);
  }

  function commitNameEdit() {
    const trimmed = nameDraft.trim();
    if (trimmed) updateMeta(prev => ({ ...prev, name: trimmed }));
    setIsEditingName(false);
  }

  return (
    <div className="relative flex justify-between bg-background border-b border-border w-full px-4 py-2 print:hidden">
      <div className="flex flex-col z-10">
        {isEditingName ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={e => setNameDraft(e.target.value)}
            onFocus={e => e.target.select()}
            onBlur={commitNameEdit}
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitNameEdit();
              }
              if (e.key === "Escape") setIsEditingName(false);
            }}
            className="text-sm font-semibold bg-transparent border-b border-border focus:outline-none"
          />
        ) : (
          <h2
            className={cn(
              "text-sm font-semibold",
              isEdit && "cursor-text hover:text-muted-foreground"
            )}
            onClick={startEditingName}
          >
            {meta?.name ?? "Loading..."}
          </h2>
        )}
        <p className="text-xs text-subtle-foreground">
          {meta ? `${meta.category} · ${meta.placeholders.length} fields` : ""}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 z-10">
        {isEdit ? (
          <>
            <Button
              size="sm"
              className="text-xs items-center"
              onClick={() => insertPlaceholder?.()}
              disabled={!insertPlaceholder}
            >
              <span className="font-bundle-mono">{"{·}"}</span>
              <span className="leading-0 max-md:hidden">New placeholder</span>
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => save?.()}
              disabled={!save}
            >
              Save
            </Button>
          </>
        ) : (
          <>
            <ActionMenuButton
              label="Print"
              icon={<PrinterIcon />}
              primaryHandler={printHandler}
              allHandler={bulkExportState.printAllHandler}
              allDisabledReason={bulkExportState.rowMismatchMessage}
              showMenu={bulkExportState.hasListFields}
              rowCount={bulkExportState.rowCount}
            />

            <ActionMenuButton
              label="Export"
              icon={<ExportIcon />}
              variant="secondary"
              primaryHandler={exportHandler}
              allHandler={bulkExportState.exportAllHandler}
              allDisabledReason={bulkExportState.rowMismatchMessage}
              showMenu={bulkExportState.hasListFields}
              rowCount={bulkExportState.rowCount}
            />
          </>
        )}
      </div>

      <div className="absolute flex justify-center items-center top-0 bottom-0 left-0 right-0">
        <div className="bg-card-muted border border-border p-1 rounded-lg">
          <LinkButton
            to={`/templates/${templateId}/edit`}
            variant="tertiary"
            size="sm"
          >
            Edit template
          </LinkButton>
          <LinkButton
            to={`/templates/${templateId}/fill`}
            variant="tertiary"
            size="sm"
          >
            Fill & preview
          </LinkButton>
        </div>
      </div>
    </div>
  );
}

export default MainHeader;
