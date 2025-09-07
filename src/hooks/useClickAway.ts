import { useEffect } from "react";

export function useClickAway(
  refs: Array<React.RefObject<HTMLElement>>,
  onAway: (evt: Event) => void,
  opts: { disabled?: boolean } = {}
) {
  useEffect(() => {
    if (opts.disabled) return;

    const handler = (evt: Event) => {
      const path = (evt as any).composedPath?.() || [];
      const target = evt.target as Node;

      // If click is inside ANY of the refs, do nothing
      const inside = refs.some(ref => {
        const el = ref.current;
        if (!el) return false;
        return el.contains(target) || path.includes?.(el);
      });

      // Allow opt-out via data attribute on elements we consider "inside"
      const node = target as HTMLElement;
      if (node?.closest?.("[data-keep-open='true']")) return;

      if (!inside) onAway(evt);
    };

    // pointerdown closes *before* focus shifts; also handle capture phase
    document.addEventListener("pointerdown", handler, true);
    // Fallbacks for older devices/browsers
    document.addEventListener("mousedown", handler, true);
    document.addEventListener("touchstart", handler, true);

    return () => {
      document.removeEventListener("pointerdown", handler, true);
      document.removeEventListener("mousedown", handler, true);
      document.removeEventListener("touchstart", handler, true);
    };
  }, [refs, onAway, opts.disabled]);
}