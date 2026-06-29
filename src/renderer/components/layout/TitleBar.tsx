import { useTheme } from "@/renderer/context/theme/useTheme";
import { FileIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";

function TitleBar() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header
      className="bg-card border-b border-border sticky top-0 z-50 h-10 p-2"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div className="flex items-center justify-between mr-32">
        <div className="flex items-center gap-2">
          <div className="size-4 rounded-sm bg-primary flex items-center justify-center text-paper">
            <FileIcon size={10} weight="bold" />
          </div>
          <span className="font-bold text-foreground text-sm">Bundle</span>
        </div>

        <button
          onClick={toggleTheme}
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          className="flex justify-center items-center rounded-md bg-card-muted border border-border size-6 cursor-pointer"
        >
          {isDark ? <SunIcon size={12} /> : <MoonIcon size={12} />}
        </button>

        <div className="absolute left-0 right-0 flex justify-center">
          <div className="flex justify-center items-center gap-2 text-xs text-subtle-foreground max-w-2/5">
            {/* INTERNAL / Memorandum / Fill & Preview */}
            <span className="truncate">
              Intenal Intenal Intenal Intenal IntenalIntenalIntenal Intenal
              Intenal
            </span>
            <span className="opacity-50">/</span>
            <span className="text-muted-foreground font-medium truncate">
              MemorandumMemorandum MemorandumMemorandum MemorandumMemorandum
              Intenal Intenal Intenal
            </span>
            <span className="opacity-50">/</span>
            <span className="text-nowrap">Fill & Preview</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default TitleBar;
