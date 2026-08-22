import Button from "../ui/Button";
import LinkButton from "../ui/LinkButton";
import { useLocation, useParams } from "react-router";
import { ExportIcon, PrinterIcon } from "@phosphor-icons/react";
import { useTemplate } from "@/renderer/context/TemplateContext";

function MainHeader() {
  const { templateId } = useParams();
  const { pathname } = useLocation();
  const { meta, save, insertPlaceholder, exportHandler, printHandler } =
    useTemplate();
  const isEdit = pathname.endsWith("/edit");

  return (
    <div className="relative flex justify-between bg-background border-b border-border w-full px-4 py-2 print:hidden">
      <div className="flex flex-col z-10">
        <h2 className="text-sm font-semibold">{meta?.name ?? "Loading..."}</h2>
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
            <Button
              size="sm"
              className="text-xs items-center"
              onClick={() => printHandler?.()}
              disabled={!printHandler}
            >
              <PrinterIcon />
              Print
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => exportHandler?.()}
              disabled={!exportHandler}
            >
              <ExportIcon />
              Export
            </Button>
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
