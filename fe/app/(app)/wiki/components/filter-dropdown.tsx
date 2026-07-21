"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterDropdownOption = {
  value: string;
  label: string;
};

type FilterDropdownProps = {
  label: string;
  value: string;
  options: FilterDropdownOption[];
  onChange: (value: string) => void;
};

type MenuPosition = {
  top: number;
  left: number;
  minWidth: number;
};

export function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !triggerRef.current) return;

    function updatePosition() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
        minWidth: Math.max(rect.width, 160),
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !(target as Element).closest("[data-filter-dropdown-menu]")
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const menu =
    open && menuPosition && mounted
      ? createPortal(
          <div
            data-filter-dropdown-menu
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
              minWidth: menuPosition.minWidth,
            }}
            className="z-50 overflow-hidden rounded-sm border border-telkom-grey-200 bg-white py-1 shadow-md"
          >
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value || "all"}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center px-3 py-2 text-left text-sm transition-colors",
                    "hover:bg-telkom-grey-100",
                    isSelected
                      ? "bg-telkom-grey-100 font-medium text-telkom-black"
                      : "text-telkom-grey-700"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-sm transition-colors",
          "hover:bg-telkom-grey-100",
          open && "bg-telkom-grey-100"
        )}
      >
        <span className="text-xs font-medium text-telkom-grey-500">{label}</span>
        <span className="font-medium text-telkom-black">{selected.label}</span>
        <ChevronDown
          className={cn(
            "size-3.5 text-telkom-grey-500 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {menu}
    </div>
  );
}
