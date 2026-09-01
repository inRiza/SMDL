"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type AppDropdownOption = {
  value: string;
  label: string;
};

type MenuPosition = {
  top: number;
  left: number;
  minWidth: number;
};

type AppDropdownProps = {
  value: string;
  options: AppDropdownOption[];
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  placeholder?: string;
  size?: "default" | "compact";
  variant?: "filter" | "field";
  className?: string;
};

export function AppDropdown({
  value,
  options,
  onChange,
  label,
  disabled = false,
  placeholder = "Pilih",
  size = "default",
  variant = "field",
  className,
}: AppDropdownProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !triggerRef.current) return;

    function updatePosition() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 6,
        left: rect.left,
        minWidth: Math.max(rect.width, 168),
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
        !(target as Element).closest("[data-app-dropdown-menu]")
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
            data-app-dropdown-menu
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
                  key={option.value || "empty"}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center px-3.5 py-2.5 text-left text-sm transition-colors",
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

  const isCompact = size === "compact";
  const isFilter = variant === "filter";

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={cn(
          "relative inline-flex cursor-pointer items-center rounded-sm text-sm transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isFilter
            ? cn(
                "gap-2 px-2.5 py-1.5 hover:bg-telkom-grey-100",
                open && "bg-telkom-grey-100"
              )
            : cn(
                "w-full border border-telkom-grey-200 bg-white hover:bg-telkom-grey-50",
                open && "border-telkom-red ring-2 ring-telkom-red/10",
                isCompact ? "h-9 min-w-[148px] px-3.5 pr-10 text-xs" : "gap-2 px-3 py-2 pr-10"
              )
        )}
      >
        {label ? (
          <span className="text-xs font-medium text-telkom-grey-500">{label}</span>
        ) : null}
        <span
          className={cn(
            "truncate font-medium",
            isFilter ? "text-telkom-black" : "text-telkom-grey-900",
            isCompact ? "text-xs" : "text-sm"
          )}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "shrink-0 text-telkom-grey-500 transition-transform duration-200",
            isFilter ? "size-3.5" : "pointer-events-none absolute top-1/2 size-4 -translate-y-1/2",
            isFilter ? undefined : isCompact ? "right-3" : "right-3.5",
            open && "rotate-180"
          )}
        />
      </button>

      {menu}
    </div>
  );
}
