import { cn } from "@/lib/utils";

type FloatingSquare = {
  x: number;
  y: number;
  size: number;
  opacity: number;
  hoverX: number;
  hoverY: number;
};

const TOP_LEFT_SQUARES: FloatingSquare[] = [
  { x: 2, y: 4, size: 12, opacity: 0.15, hoverX: 5, hoverY: 4 },
  { x: 28, y: 2, size: 8, opacity: 0.09, hoverX: 2, hoverY: 5 },
  { x: 52, y: 12, size: 10, opacity: 0.12, hoverX: -5, hoverY: 3 },
  { x: 10, y: 38, size: 15, opacity: 0.07, hoverX: 5, hoverY: -3 },
  { x: 60, y: 48, size: 8, opacity: 0.13, hoverX: -6, hoverY: -4 },
  { x: 34, y: 62, size: 11, opacity: 0.09, hoverX: -2, hoverY: -6 },
];

const BOTTOM_RIGHT_SQUARES: FloatingSquare[] = [
  { x: 4, y: 6, size: 11, opacity: 0.13, hoverX: -4, hoverY: -4 },
  { x: 32, y: 2, size: 14, opacity: 0.09, hoverX: -5, hoverY: -2 },
  { x: 60, y: 20, size: 8, opacity: 0.14, hoverX: -7, hoverY: 2 },
  { x: 14, y: 42, size: 15, opacity: 0.07, hoverX: -2, hoverY: -5 },
  { x: 48, y: 54, size: 10, opacity: 0.11, hoverX: -5, hoverY: -6 },
  { x: 2, y: 68, size: 8, opacity: 0.12, hoverX: 3, hoverY: -7 },
];

type CornerClusterProps = {
  squares: FloatingSquare[];
  className?: string;
  mirror?: boolean;
};

function CornerCluster({ squares, className, mirror }: CornerClusterProps) {
  return (
    <div
      className={cn("pointer-events-none absolute h-20 w-20", className)}
      aria-hidden
    >
      {squares.map((sq, index) => (
        <div
          key={index}
          className="corner-float-square absolute bg-telkom-red"
          style={
            {
              [mirror ? "right" : "left"]: sq.x,
              [mirror ? "bottom" : "top"]: sq.y,
              width: sq.size,
              height: sq.size,
              opacity: sq.opacity,
              "--hx": `${sq.hoverX}px`,
              "--hy": `${sq.hoverY}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

type CornerRedGridPairProps = {
  className?: string;
};

/** Random floating red squares in corners; on hover they move closer (no float loop). */
export function CornerRedGridPair({ className }: CornerRedGridPairProps) {
  return (
    <>
      <CornerCluster squares={TOP_LEFT_SQUARES} className={cn("left-1 top-1", className)} />
      <CornerCluster
        squares={BOTTOM_RIGHT_SQUARES}
        className={cn("right-1 bottom-1", className)}
        mirror
      />
    </>
  );
}

export function CornerRedGrid({ className }: { className?: string }) {
  return <CornerCluster squares={TOP_LEFT_SQUARES.slice(0, 4)} className={className} />;
}
