import { PAGE_GUTTER_PX } from "@/shared/pageLayout";

interface PaginatedCanvasProps {
  pageDimensions: { width: number; height: number; margins: number };
  pageCount: number;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
}

function PaginatedCanvas({
  pageDimensions,
  pageCount,
  onClick,
  children
}: PaginatedCanvasProps) {
  const { width, height, margins } = pageDimensions;
  const slotHeight = height + PAGE_GUTTER_PX;
  const totalHeight = pageCount * slotHeight - PAGE_GUTTER_PX;

  return (
    <div
      className="relative mx-auto print:mx-0"
      style={{ width: `${width}px`, height: `${totalHeight}px` }}
    >
      {Array.from({ length: pageCount }, (_, i) => (
        <div
          key={i}
          className="absolute bg-white shadow-md print:shadow-none print:hidden"
          style={{
            top: `${i * slotHeight}px`,
            width: `${width}px`,
            height: `${height}px`
          }}
        />
      ))}

      {Array.from({ length: pageCount - 1 }, (_, i) => (
        <div
          key={i}
          className="absolute w-full flex items-center justify-center text-xs text-muted-foreground print:hidden"
          style={{
            top: `${(i + 1) * slotHeight - PAGE_GUTTER_PX}px`,
            height: `${PAGE_GUTTER_PX}px`
          }}
        >
          Page {i + 2}
        </div>
      ))}

      <div
        className="relative"
        style={{
          width: `${width}px`,
          paddingLeft: `${margins}px`,
          paddingRight: `${margins}px`,
          paddingTop: `${margins}px`,
          paddingBottom: `${margins}px`
        }}
        onClick={onClick}
      >
        {children}
      </div>
    </div>
  );
}

export default PaginatedCanvas;
