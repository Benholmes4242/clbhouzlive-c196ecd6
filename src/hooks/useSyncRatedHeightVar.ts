import { useEffect } from "react";

export function useSyncRatedHeightVar() {
  useEffect(() => {
    const el = document.querySelector(".rated-card") as HTMLElement;
    if (!el) return;

    const setVar = () =>
      document.documentElement.style.setProperty("--rated-card-h", `${el.offsetHeight}px`);

    const ro = new ResizeObserver(() => setVar());
    ro.observe(el);
    setVar();
    return () => ro.disconnect();
  }, []);
}