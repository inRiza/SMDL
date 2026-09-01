"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function finish(result: boolean) {
    setOpen(false);
    resolveRef.current?.(result);
    resolveRef.current = null;
  }

  const isDestructive = options?.variant === "destructive";

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <Dialog.Root
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) finish(false);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-100 bg-black/40 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <Dialog.Popup
            className={cn(
              "fixed top-1/2 left-1/2 z-101 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2",
              "rounded-xl border border-telkom-grey-200 bg-white p-6 shadow-xl",
              "transition duration-200 data-ending-style:scale-95 data-ending-style:opacity-0",
              "data-starting-style:scale-95 data-starting-style:opacity-0"
            )}
          >
            <Dialog.Title className="text-base font-semibold text-telkom-grey-900">
              {options?.title}
            </Dialog.Title>
            {options?.description ? (
              <Dialog.Description className="mt-2 text-sm leading-relaxed text-telkom-grey-600">
                {options.description}
              </Dialog.Description>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => finish(false)}
              >
                {options?.cancelLabel ?? "Batal"}
              </Button>
              <Button
                type="button"
                variant={isDestructive ? "destructive" : "default"}
                className={cn(
                  "cursor-pointer",
                  !isDestructive && "bg-telkom-red text-white hover:bg-telkom-red/90"
                )}
                onClick={() => finish(true)}
              >
                {options?.confirmLabel ?? "Lanjutkan"}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmDialogProvider");
  }
  return ctx.confirm;
}
