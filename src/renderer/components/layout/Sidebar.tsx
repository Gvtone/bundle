import {
  CaretLeftIcon,
  CaretRightIcon,
  MagnifyingGlassIcon,
  TrashIcon
} from "@phosphor-icons/react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { cn } from "@/renderer/utils/utils";
import LinkButton from "../ui/LinkButton";
import { useTemplates } from "@/renderer/context/TemplatesContext";
import { Template } from "@/shared/types";
import { relativeTime } from "@/renderer/utils/relativeTime";
import NewTemplateButton from "./NewTemplateButton";
import ConfirmDialog from "../ui/ConfirmDialog";

function Sidebar() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [templateSearch, setTemplateSearch] = useState("");
  const [debouncedTemplateSearch, setDebouncedTemplateSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Template | null>(null);
  const { templates, refetch } = useTemplates();

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const deletedId = pendingDelete.id;
    await window.bundle.deleteTemplate(deletedId);
    setPendingDelete(null);
    refetch();
    if (templateId === deletedId) {
      navigate("/");
    }
  };

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedTemplateSearch(templateSearch),
      400
    );
    return () => clearTimeout(timer);
  }, [templateSearch]);

  const filtered = templates.filter(
    t =>
      t.name.toLowerCase().includes(debouncedTemplateSearch.toLowerCase()) ||
      t.category.toLowerCase().includes(debouncedTemplateSearch.toLowerCase())
  );

  const groupedTemplates = filtered.reduce(
    (acc, template) => {
      const category = template.category.toLowerCase();
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(template);
      return acc;
    },
    {} as Record<string, Template[]>
  );

  return (
    <aside
      className={cn(
        "flex flex-col bg-card border-r border-border shrink-0 h-full p-4 transition-all duration-200 print:hidden",
        isSidebarOpen ? "w-64" : "w-fit"
      )}
    >
      <div className={cn("flex flex-col gap-2", isSidebarOpen && "mb-8")}>
        {/* Title and show/hide button */}
        <h3 className="flex justify-between items-center text-xs tracking-widest font-semibold text-subtle-foreground">
          <span className={!isSidebarOpen ? "hidden" : ""}>TEMPLATES</span>

          <Button
            variant="muted"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={!isSidebarOpen ? "size-10" : ""}
          >
            {isSidebarOpen ? <CaretLeftIcon /> : <CaretRightIcon />}
          </Button>
        </h3>

        {/* New template button */}
        <NewTemplateButton fullWidth collapsedLabel={!isSidebarOpen} />

        {/* Search field */}
        <div className={cn("relative flex-1", !isSidebarOpen && "hidden")}>
          <MagnifyingGlassIcon className="text-muted-foreground absolute top-1/2 left-4 -translate-y-1/2" />
          <Input
            placeholder="Search templates"
            value={templateSearch}
            onChange={e => setTemplateSearch(e.target.value)}
            className="pl-10"
            fullWidth
          />
        </div>
      </div>

      {!isSidebarOpen && <div className="w-10 border-t border-border my-4" />}

      {/* TODO: replace with real data */}
      {/* Files and folders */}

      <div className="flex flex-col gap-4 overflow-y-auto">
        {/* 2. Outer loop for each category */}
        {Object.entries(groupedTemplates).map(
          ([category, categoryTemplates]) => (
            <div key={category} className="flex flex-col gap-2 mb-4">
              {/* Dynamic Category Header */}
              <h4
                className={cn(
                  "text-xs text-subtle-foreground font-semibold tracking-widest uppercase",
                  !isSidebarOpen && "hidden"
                )}
              >
                {category}
              </h4>

              {/* 3. Inner loop for templates inside this specific category */}
              {categoryTemplates.map(template => (
                <div key={template.id} className="group relative flex items-center">
                  <LinkButton
                    to={`templates/${template.id}/edit`}
                    variant="tertiary"
                    fullWidth
                    className={cn(
                      !isSidebarOpen ? "size-10" : "px-5 py-2.5",
                      isSidebarOpen && "pr-9"
                    )}
                    active={template.id === templateId}
                  >
                    {isSidebarOpen ? (
                      <div className="w-full min-w-0">
                        <p className="truncate font-semibold text-primary-soft-foreground text-sm">
                          {template.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {relativeTime(template.createdAt)}
                        </p>
                      </div>
                    ) : (
                      // Fallback letter when sidebar is collapsed (e.g., first letter of template name)
                      <p className="text-xs font-semibold">
                        {template.name.charAt(0).toUpperCase()}
                      </p>
                    )}
                  </LinkButton>

                  {isSidebarOpen && (
                    <Button
                      variant="muted"
                      size="icon"
                      className="absolute right-1.5 opacity-0 group-hover:opacity-100"
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPendingDelete(template);
                      }}
                    >
                      <TrashIcon />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete template"
        description={`Delete "${pendingDelete?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </aside>
  );
}

export default Sidebar;
