import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { TableIcon, TrashIcon } from "@phosphor-icons/react";
import Button from "../ui/Button";

const GRID_ROWS = 6;
const GRID_COLS = 6;

interface TableInsertMenuProps {
  editor: Editor;
  isInsideTable: boolean;
}

function TableInsertMenu({ editor, isInsideTable }: TableInsertMenuProps) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState({ rows: 0, cols: 0 });

  function insertTable(rows: number, cols: number) {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: false }).run();
    setOpen(false);
    setHovered({ rows: 0, cols: 0 });
  }

  function deleteTable() {
    editor.chain().focus().deleteTable().run();
    setOpen(false);
  }

  return (
    <div className="relative">
      <Button
        variant={open ? "secondary" : "tertiary"}
        size="icon"
        onClick={() => setOpen(o => !o)}
      >
        <TableIcon />
      </Button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-20 bg-popover border border-border rounded-md shadow-md p-3 w-max">
          <div
            className="grid gap-0.5"
            style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 16px)` }}
            onMouseLeave={() => setHovered({ rows: 0, cols: 0 })}
          >
            {Array.from({ length: GRID_ROWS * GRID_COLS }, (_, i) => {
              const row = Math.floor(i / GRID_COLS) + 1;
              const col = (i % GRID_COLS) + 1;
              const active = row <= hovered.rows && col <= hovered.cols;
              return (
                <div
                  key={i}
                  className={`w-4 h-4 border cursor-pointer ${
                    active
                      ? "bg-primary border-primary"
                      : "bg-card-muted border-border"
                  }`}
                  onMouseEnter={() => setHovered({ rows: row, cols: col })}
                  onClick={() => insertTable(row, col)}
                />
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-1">
            {hovered.rows > 0 ? `${hovered.rows} x ${hovered.cols} table` : "Insert table"}
          </p>

          {isInsideTable && (
            <>
              <div className="border-t border-border my-2" />
              <button
                type="button"
                className="flex items-center gap-1 text-sm text-red-600 hover:bg-card-muted rounded-md px-2 py-1 w-full"
                onClick={deleteTable}
              >
                <TrashIcon /> Delete table
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default TableInsertMenu;
