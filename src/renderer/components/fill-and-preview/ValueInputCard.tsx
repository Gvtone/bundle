import { ClockCounterClockwiseIcon, GridFourIcon } from "@phosphor-icons/react";
import Button from "../ui/Button";
import Input from "../ui/Input";

function ValueInputCard() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between">
        <div className="flex items-center gap-1">
          <p className="text-sm">Name</p>
          <p className="text-xs text-subtle-foreground font-serif">
            {"{{name}}"}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="muted" size="xs">
            <GridFourIcon /> List
          </Button>

          <Button variant="muted" size="xs">
            <ClockCounterClockwiseIcon size={15} />
          </Button>
        </div>
      </div>

      <Input fullWidth />
    </div>
  );
}

export default ValueInputCard;
