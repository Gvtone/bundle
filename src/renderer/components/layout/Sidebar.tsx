import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useEffect, useState } from "react";

function Sidebar() {
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
    <aside className="flex flex-col bg-card w-1/6 shrink-0 h-full p-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-xs tracking-widest font-semibold text-subtle-foreground">
          TEMPLATES
        </h3>

        <Button fullWidth>
          <PlusIcon weight="bold" />
          <span>New Template</span>
        </Button>

        <div className="relative flex-1">
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
    </aside>
  );
}

export default Sidebar;
