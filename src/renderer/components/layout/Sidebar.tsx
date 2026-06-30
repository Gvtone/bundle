import {
  CaretLeftIcon,
  CaretRightIcon,
  MagnifyingGlassIcon,
  PlusIcon
} from "@phosphor-icons/react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useEffect, useState } from "react";
import { cn } from "@/renderer/utils/utils";
import LinkButton from "../ui/LinkButton";

function Sidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [templateSearch, setTemplateSearch] = useState("");
  const [debouncedTemplateSearch, setDebouncedTemplateSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedTemplateSearch(templateSearch),
      400
    );
    return () => clearTimeout(timer);
  }, [templateSearch]);

  return (
    <aside
      className={cn(
        "flex flex-col bg-card border-r border-border shrink-0 h-full p-4 transition-all duration-200",
        isSidebarOpen ? "w-64" : "w-fit"
      )}
    >
      <div className={cn("flex flex-col gap-2", isSidebarOpen && "mb-8")}>
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

        <Button fullWidth className={!isSidebarOpen ? "size-10 p-0" : ""}>
          <PlusIcon weight="bold" />
          <span className={!isSidebarOpen ? "hidden" : ""}>New Template</span>
        </Button>

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
      <div className="flex flex-col gap-2 mb-4 overflow-y-auto">
        <h4
          className={cn(
            "text-xs text-subtle-foreground font-semibold tracking-widest",
            !isSidebarOpen && "hidden"
          )}
        >
          INTERNAL
        </h4>

        <LinkButton
          to="templates/1/edit"
          variant="tertiary"
          fullWidth
          className={!isSidebarOpen ? "size-10" : "px-5 py-2.5"}
          active
        >
          {isSidebarOpen ? (
            <div className="w-full">
              <p className="truncate font-semibold text-primary-soft-foreground text-sm">
                Memorandum
              </p>
              <p className="text-xs text-muted-foreground">2 days ago</p>
            </div>
          ) : (
            <p className="text-xs font-semibold">M</p>
          )}
        </LinkButton>
      </div>
    </aside>
  );
}

export default Sidebar;
