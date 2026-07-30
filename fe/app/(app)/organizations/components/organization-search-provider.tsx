"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type OrganizationSearchContextValue = {
  showLoading: boolean;
  navigate: (url: string) => void;
  refresh: () => void;
};

const OrganizationSearchContext =
  createContext<OrganizationSearchContextValue | null>(null);

const LOADING_DELAY_MS = 250;
const MIN_LOADING_MS = 700;

export function OrganizationSearchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [showLoading, setShowLoading] = useState(false);
  const isSearchingRef = useRef(false);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAtRef = useRef<number | null>(null);

  const clearDelayTimer = useCallback(() => {
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
  }, []);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const navigate = useCallback(
    (url: string) => {
      clearDelayTimer();
      clearHideTimer();
      isSearchingRef.current = true;

      delayTimerRef.current = setTimeout(() => {
        if (!isSearchingRef.current) return;
        shownAtRef.current = Date.now();
        setShowLoading(true);
      }, LOADING_DELAY_MS);

      startTransition(() => {
        router.push(url);
      });
    },
    [router, startTransition, clearDelayTimer, clearHideTimer]
  );

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router, startTransition]);

  useEffect(() => {
    if (isPending) return;

    isSearchingRef.current = false;
    clearDelayTimer();

    if (!shownAtRef.current) {
      setShowLoading(false);
      return;
    }

    const elapsed = Date.now() - shownAtRef.current;
    const remaining = MIN_LOADING_MS - elapsed;

    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      shownAtRef.current = null;
      setShowLoading(false);
    }, Math.max(remaining, 0));
  }, [searchParams, pathname, isPending, clearDelayTimer, clearHideTimer]);

  useEffect(
    () => () => {
      clearDelayTimer();
      clearHideTimer();
    },
    [clearDelayTimer, clearHideTimer]
  );

  return (
    <OrganizationSearchContext.Provider value={{ showLoading, navigate, refresh }}>
      {children}
    </OrganizationSearchContext.Provider>
  );
}

export function useOrganizationSearch() {
  const context = useContext(OrganizationSearchContext);
  if (!context) {
    throw new Error(
      "useOrganizationSearch must be used within OrganizationSearchProvider"
    );
  }
  return context;
}
