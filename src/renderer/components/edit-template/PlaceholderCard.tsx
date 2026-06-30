import { XIcon } from "@phosphor-icons/react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useState } from "react";

function PlaceholderCard() {
  const [isTextStylingOpen, setIsTextStylingOpen] = useState(false);

  return (
    <div className="rounded-lg bg-card-muted p-4">
      <div className="flex flex-col gap-2 ">
        <div className="flex justify-between">
          <p className="text-xs bg-primary-soft p-1 rounded-sm font-bundle-serif">
            {"{{recipient}}"}
          </p>

          <div className="flex gap-1 items-center">
            <p className="text-xs">1 use</p>
            <Button
              variant="tertiary"
              size="icon"
              className="font-serif italic"
              active={isTextStylingOpen}
              onClick={() => setIsTextStylingOpen(!isTextStylingOpen)}
            >
              A
            </Button>
            <Button variant="tertiary" size="icon">
              <XIcon />
            </Button>
          </div>
        </div>

        <Input variant="secondary" scale="sm" fullWidth></Input>

        <div className="flex gap-1">
          <Button size="sm" fullWidth>
            Text
          </Button>
          <Button variant="secondary" size="sm" fullWidth>
            Date
          </Button>
          <Button variant="secondary" size="sm" fullWidth>
            ¶
          </Button>
        </div>

        {isTextStylingOpen && (
          <>
            <div className="border border-dashed border-border" />
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="font-bold shrink-0"
              >
                B
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="font-serif italic shrink-0"
              >
                I
              </Button>
              <Input variant="secondary" scale="sm" fullWidth />
              <Input variant="secondary" scale="sm" fullWidth />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Custom fonts may not display correctly for recipients who don't
              have them installed.
            </p>
          </>
        )}

        <Button size="sm" fullWidth>
          Insert
        </Button>
      </div>
    </div>
  );
}

export default PlaceholderCard;
