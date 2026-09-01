import { FilePlusIcon } from "@phosphor-icons/react";
import Button from "../components/ui/Button";
import { useCreateTemplate } from "@/renderer/hooks/useCreateTemplate";

function EmptyStatePage() {
  const { createTemplate } = useCreateTemplate();

  return (
    <div className="flex flex-col w-full h-full items-center justify-center gap-4 text-center">
      <div className="size-12 rounded-lg bg-primary-soft flex items-center justify-center text-primary-soft-foreground">
        <FilePlusIcon size={24} />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold">No template open</p>
        <p className="text-xs text-muted-foreground">
          Create a new template or pick one from the sidebar to get started.
        </p>
      </div>
      <Button size="sm" onClick={createTemplate}>
        <FilePlusIcon weight="bold" />
        New Template
      </Button>
    </div>
  );
}

export default EmptyStatePage;
