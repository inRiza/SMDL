"use client";

import { Search } from "lucide-react";

const squares = [
  { top: "18%", left: "22%", size: "h-7 w-7", delay: "0ms" },
  { top: "55%", left: "68%", size: "h-5 w-5", delay: "200ms" },
  { top: "72%", left: "28%", size: "h-6 w-6", delay: "400ms" },
  { top: "32%", left: "74%", size: "h-8 w-8", delay: "600ms" },
];

export function SearchLoading() {
  return (
    <div className="flex flex-col items-center justify-center border-t border-telkom-grey-200 py-20">
      <div className="relative h-28 w-28">
        {squares.map((square, index) => (
          <span
            key={index}
            className={`absolute rounded-sm bg-telkom-grey-100 ${square.size} animate-pulse-grey`}
            style={{
              top: square.top,
              left: square.left,
              animationDelay: square.delay,
            }}
          />
        ))}

        <div className="absolute inset-0 flex items-center justify-center">
          <Search className="relative z-10 size-9 animate-float-search text-telkom-grey-500" />
        </div>
      </div>

      <p className="mt-6 text-sm text-telkom-grey-500">Mencari dokumen...</p>
    </div>
  );
}
