import { PlusIcon } from "@phosphor-icons/react";
import Button from "../ui/Button";

function Sidebar() {
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
      </div>
    </aside>
  );
}

export default Sidebar;
