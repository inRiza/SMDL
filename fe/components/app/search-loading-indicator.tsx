"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const squares = [
  { top: "18%", left: "22%", size: "h-7 w-7", delay: "0ms" },
  { top: "55%", left: "68%", size: "h-5 w-5", delay: "200ms" },
  { top: "72%", left: "28%", size: "h-6 w-6", delay: "400ms" },
  { top: "32%", left: "74%", size: "h-8 w-8", delay: "600ms" },
];

const compactSquares = [
  { top: "16%", left: "20%", size: "h-4 w-4", delay: "0ms" },
  { top: "58%", left: "66%", size: "h-3 w-3", delay: "200ms" },
  { top: "70%", left: "26%", size: "h-3.5 w-3.5", delay: "400ms" },
  { top: "30%", left: "72%", size: "h-4 w-4", delay: "600ms" },
];

type SearchLoadingIndicatorProps = {
  message?: string;
  size?: "sm" | "md";
  className?: string;
};

export function SearchLoadingIndicator({
  message,
  size = "md",
  className,
}: SearchLoadingIndicatorProps) {
  const isCompact = size === "sm";
  const items = isCompact ? compactSquares : squares;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className={cn("relative", isCompact ? "h-16 w-16" : "h-28 w-28")}>
        {items.map((square, index) => (
          <span
            key={index}
            className={cn(
              "absolute rounded-sm bg-telkom-grey-100 animate-pulse-grey",
              square.size
            )}
            style={{
              top: square.top,
              left: square.left,
              animationDelay: square.delay,
            }}
          />
        ))}

        <div className="absolute inset-0 flex items-center justify-center">
          <Search
            className={cn(
              "relative z-10 animate-float-search text-telkom-grey-500",
              isCompact ? "size-5" : "size-9"
            )}
          />
        </div>
      </div>

      {message && (
        <p
          className={cn(
            "text-telkom-grey-500",
            isCompact ? "mt-3 text-xs" : "mt-6 text-sm"
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}
