"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const formInputClass =
  "h-10 w-full rounded-lg bg-telkom-grey-50 px-3 text-sm text-telkom-grey-900 outline-none transition-colors placeholder:text-telkom-grey-400 focus:bg-telkom-grey-100";

export const formTextareaClass =
  "min-h-24 w-full resize-y rounded-lg bg-telkom-grey-50 px-3 py-2.5 text-sm text-telkom-grey-900 outline-none transition-colors placeholder:text-telkom-grey-400 focus:bg-telkom-grey-100";

export function FormField({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <span className="text-sm font-medium text-telkom-grey-700">
        {label}
        {required && <span className="text-telkom-red"> *</span>}
      </span>
      {children}
    </div>
  );
}

type MenuPosition = {
  top: number;
  left: number;
  width: number;
};

export function FormSelect({
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
}) {
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
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
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
        !(target as Element).closest("[data-form-select-menu]")
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
    open && menuPosition && mounted && !disabled
      ? createPortal(
          <div
            data-form-select-menu
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
            }}
            className="z-[60] max-h-60 overflow-y-auto rounded-lg border border-telkom-grey-100 bg-white p-1 shadow-[0_8px_24px_rgba(2,8,23,0.12)]"
          >
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm text-telkom-grey-900 transition-colors",
                    "hover:bg-telkom-grey-50",
                    isSelected && "bg-telkom-grey-50",
                  )}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="size-4 shrink-0 text-telkom-red" />}
                </button>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-required={required}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        className={cn(
          formInputClass,
          "flex w-full items-center justify-between gap-2 text-left",
          disabled && "cursor-not-allowed text-telkom-grey-500",
          open && !disabled && "bg-telkom-grey-100",
        )}
      >
        <span className={cn(!selected && "text-telkom-grey-400")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-telkom-grey-500 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {menu}
    </div>
  );
}
