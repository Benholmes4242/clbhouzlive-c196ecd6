import React, { createContext, useContext, useMemo, useRef, useState } from "react";

type Ctx = {
  loading: boolean;
  begin: () => void;
  end: () => void;
  suppressUntil: number;  // epoch ms
};

const LoadingCtx = createContext<Ctx | null>(null);
export const useGlobalLoading = () => useContext(LoadingCtx)!;

export function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(0);
  const boot = useRef(Date.now());
  const SUPPRESS_MS = 800; // tweak if needed

  const value = useMemo<Ctx>(() => ({
    loading: active > 0,
    begin: () => setActive(v => v + 1),
    end:   () => setActive(v => Math.max(0, v - 1)),
    suppressUntil: boot.current + SUPPRESS_MS,
  }), [active]);

  return <LoadingCtx.Provider value={value}>{children}</LoadingCtx.Provider>;
}
