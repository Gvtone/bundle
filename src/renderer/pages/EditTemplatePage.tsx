import {
  ListBulletsIcon,
  ListNumbersIcon,
  TextAlignCenterIcon,
  TextAlignJustifyIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  TextBIcon,
  TextItalicIcon,
  TextUnderlineIcon
} from "@phosphor-icons/react";
import PlaceholderCard from "../components/edit-template/PlaceholderCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

function EditTemplatePage() {
  return (
    <div className="flex w-full h-full">
      <div className="flex-1">
        {/* Rich Text Toolbar */}
        <div className="flex flex-wrap items-center bg-card border-b border-border px-4 py-2">
          <div className="flex gap-2">
            <Button variant="tertiary" size="icon">
              <TextBIcon weight="bold" />
            </Button>
            <Button variant="tertiary" size="icon">
              <TextItalicIcon />
            </Button>
            <Button variant="tertiary" size="icon">
              <TextUnderlineIcon />
            </Button>
          </div>

          <div className="self-stretch border-r border-border mx-2" />

          <div className="flex gap-2">
            <Input variant="muted" scale="sm" className="w-28" />
            <Input variant="muted" scale="sm" className="w-22" />
          </div>

          <div className="self-stretch border-r border-border mx-2" />

          <div className="flex gap-2">
            <Button variant="tertiary" size="icon">
              <TextAlignLeftIcon />
            </Button>
            <Button variant="tertiary" size="icon">
              <TextAlignRightIcon />
            </Button>
            <Button variant="tertiary" size="icon">
              <TextAlignCenterIcon />
            </Button>
            <Button variant="tertiary" size="icon">
              <TextAlignJustifyIcon />
            </Button>
          </div>

          <div className="self-stretch border-r border-border mx-2" />

          <div className="flex gap-2">
            <Button variant="tertiary" size="icon">
              <ListBulletsIcon />
            </Button>
            <Button variant="tertiary" size="icon">
              <ListNumbersIcon />
            </Button>
          </div>
        </div>
      </div>

      <aside className="w-72 bg-card border-l border-border">
        <div className="border-b border-border p-4">
          <h3 className="text-xs tracking-widest font-semibold text-subtle-foreground">
            PLACE HOLDER FIELDS
          </h3>
          <p className="text-xs text-muted-foreground">
            Select text in the document, then Insert placeholder — or rename and
            retype fields here.
          </p>
        </div>

        <div className="p-4">
          <PlaceholderCard />
        </div>
      </aside>
    </div>
  );
}

export default EditTemplatePage;
