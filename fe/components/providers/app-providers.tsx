"use client";

import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ConfirmDialogProvider } from "@/components/providers/confirm-dialog-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <ConfirmDialogProvider>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </ConfirmDialogProvider>
    </TooltipProvider>
  );
}
