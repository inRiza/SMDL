"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-telkom-grey-900 group-[.toaster]:border-telkom-grey-200 group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg",
          description: "group-[.toast]:text-telkom-grey-600",
          actionButton:
            "group-[.toast]:bg-telkom-red group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-telkom-grey-100 group-[.toast]:text-telkom-grey-700",
          success: "group-[.toast]:border-emerald-200 group-[.toast]:text-emerald-800",
          error: "group-[.toast]:border-red-200 group-[.toast]:text-red-800",
        },
      }}
      {...props}
    />
  );
}
