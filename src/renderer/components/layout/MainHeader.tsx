import Button from "../ui/Button";

function MainHeader() {
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
          <Button variant="secondary" size="sm">
            Edit template
          </Button>
          <Button variant="tertiary" size="sm">
            Fill & preview
          </Button>
        </div>
      </div>
    </div>
  );
}

export default MainHeader;
