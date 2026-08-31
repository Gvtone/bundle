import { useTheme } from "@/renderer/context/theme/useTheme";
import { FileIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useLocation, useParams } from "react-router";
import Button from "../ui/Button";
import { useTemplates } from "@/renderer/context/TemplatesContext";

function TitleBar() {
  const { isDark, toggleTheme } = useTheme();
  const { templateId } = useParams();
  const { templates } = useTemplates();
  const { pathname } = useLocation();

  const template = templates.find(t => t.id === templateId);
  const mode = pathname.endsWith("/fill") ? "Fill & Preview" : "Edit";

  return (
    <header
      className="flex items-center bg-card border-b border-border sticky top-0 z-50 h-10 p-2 print:hidden"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div className="flex items-center justify-between mr-32 w-full">
        <div className="flex items-center gap-2">
          <div className="size-4 rounded-sm bg-primary flex items-center justify-center text-paper">
            <FileIcon size={10} weight="bold" />
          </div>
          <span className="font-bold text-foreground text-sm">Bundle</span>
        </div>

        <Button
          variant="muted"
          size="icon"
          onClick={toggleTheme}
          className="z-10"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          {isDark ? <SunIcon size={12} /> : <MoonIcon size={12} />}
        </Button>

        {template && (
          <div className="absolute left-0 right-0 flex justify-center">
            <div className="flex justify-center items-center gap-2 text-xs text-subtle-foreground max-w-2/5">
              <span className="truncate min-w-0" title={template.category}>
                {template.category}
              </span>
              <span className="opacity-50 shrink-0">/</span>
              <span
                className="text-muted-foreground font-medium truncate min-w-0"
                title={template.name}
              >
                {template.name}
              </span>
              <span className="opacity-50 shrink-0">/</span>
              <span className="text-nowrap shrink-0">{mode}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default TitleBar;
