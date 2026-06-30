import Button from "../components/ui/Button";
import ValueInputCard from "../components/fill-and-preview/ValueInputCard";

function FillAndPreviewPage() {
  return (
    <div className="flex w-full h-full">
      <aside className="flex flex-col w-72 bg-card border-r border-border">
        <div className="flex justify-between items-center border-b border-border p-4">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold">Fill in details</h3>
            <p className="text-xs text-muted-foreground">
              Live preview updates as you type
            </p>
          </div>

          <div className="p-1 rounded-full bg-primary-soft">
            <div className="size-2 bg-primary rounded-full" />
          </div>
        </div>

        <div className="flex flex-col gap-4 p-4 flex-1">
          <ValueInputCard />
        </div>

        <div className="flex flex-col gap-2 bg-background p-4">
          <div className="flex justify-between">
            <p className="text-xs tracking-widest font-semibold text-subtle-foreground">
              OUTPUT
            </p>

            <div className="flex p-1 rounded-lg bg-card border border-border">
              <Button size="xs">PDF</Button>
              <Button variant="tertiary" size="xs">
                DOCX
              </Button>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <p className="text-subtle-foreground text-xs max-w-xs flex items-center gap-1 min-w-0">
              <span className="shrink-0">Save to</span>
              <span
                className="text-foreground font-serif truncate"
                title="~/Documents/Bundle/Certificate/Certificate of Appearance"
              >
                ~/Documents/Bundle/Certificate/Certificate of Appearance
              </span>
            </p>

            <Button variant="tertiary" size="xs" className="text-primary">
              Change
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1"></div>
    </div>
  );
}

export default FillAndPreviewPage;
