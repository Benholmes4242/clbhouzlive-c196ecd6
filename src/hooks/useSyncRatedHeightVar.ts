import { useEffect } from "react";

const DEFAULT_RATED_H = 240;

export function useSyncRatedHeightVar() {
  useEffect(() => {
    const setVar = (h: number) =>
      document.documentElement.style.setProperty("--rated-card-h", `${h}px`);

    // always set a safe default first (prevents 0px collapse)
    setVar(DEFAULT_RATED_H);

    const ro = new ResizeObserver((entries) => {
      const el = entries[0]?.target as HTMLElement | undefined;
      if (el?.offsetHeight) setVar(el.offsetHeight);
    });

    const tryAttach = () => {
      const target = document.querySelector(".rated-card") as HTMLElement | null;
      if (target) {
        ro.observe(target);
        setVar(target.offsetHeight || DEFAULT_RATED_H);
        return true;
      }
      return false;
    };

    // try now; if not present yet, wait for DOM insertion
    if (!tryAttach()) {
      const mo = new MutationObserver(() => {
        if (tryAttach()) mo.disconnect();
      });
      mo.observe(document.body, { childList: true, subtree: true });
      return () => {
        ro.disconnect();
        mo.disconnect();
      };
    }

    return () => ro.disconnect();
  }, []);
}