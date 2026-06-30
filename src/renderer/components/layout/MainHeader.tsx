import { useState } from "react";
import Button from "../ui/Button";
import LinkButton from "../ui/LinkButton";
import { useParams } from "react-router";

function MainHeader() {
  const [currentPage, setCurrentPage] = useState("edit");
  const { templateId } = useParams();

  return (
    <div className="relative flex justify-between bg-background border-b border-border w-full px-4 py-2">
      {/* Template Info */}
      <div className="flex flex-col z-10">
        <h2 className="text-sm font-semibold">Memorandum</h2>
        <p className="text-xs">Internal</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 z-10">
        <Button size="sm" className="text-xs items-center">
          <span className="font-bundle-mono">{"{·}"}</span>
          <span className="leading-0 max-md:hidden">New placeholder</span>
        </Button>

        <Button size="sm" variant="secondary">
          Save
        </Button>
      </div>

      <div className="absolute flex justify-center items-center top-0 bottom-0 left-0 right-0">
        <div className="bg-card-muted border border-border p-1 rounded-lg">
          <LinkButton
            to={`/templates/${templateId}/edit`}
            variant={currentPage === "edit" ? "secondary" : "tertiary"}
            size="sm"
            onClick={() => setCurrentPage("edit")}
          >
            Edit template
          </LinkButton>
          <LinkButton
            to={`/templates/${templateId}/fill`}
            variant={currentPage === "fill" ? "secondary" : "tertiary"}
            size="sm"
            onClick={() => setCurrentPage("fill")}
          >
            Fill & preview
          </LinkButton>
        </div>
      </div>
    </div>
  );
}

export default MainHeader;
