import { useEffect, useRef, useState } from "react";

type Opts = {
  /** start preloading a bit early so 60% is instant */
  prebufferRatio?: number; // default 0.35
  /** actual play threshold */
  playRatio?: number;      // default 0.6
  /** stop loading when way off-screen */
  detachRatio?: number;    // default 0.1
};

export function useAutoplayVisibility<T extends HTMLVideoElement>(
  ref: React.RefObject<T>,
  { prebufferRatio = 0.35, playRatio = 0.6, detachRatio = 0.1 }: Opts = {}
) {
  const [shouldPlay, setShouldPlay] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Always safe defaults for mobile autoplay
    el.muted = true;
    el.playsInline = true;

    // One observer with precise thresholds
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        const r = e.intersectionRatio;

        // eager buffer a bit before 60%
        if (r >= prebufferRatio && el.preload !== "auto") {
          el.preload = "auto";
          // kick the pipeline without playing yet
          el.load?.();
        }

        // actual play/pause rule
        const playNow =
          e.isIntersecting && r >= playRatio && !document.hidden;

        setShouldPlay(playNow);

        // save CPU if far off-screen
        if (r <= detachRatio) {
          try {
            el.pause();
            el.removeAttribute("src"); // detach stream
            // keep poster visible
          } catch {}
        }
      },
      {
        root: null,
        // a little vertical padding to make fast scrolls smoother
        rootMargin: "8% 0% 8% 0%",
        threshold: [0, detachRatio, prebufferRatio, playRatio, 1]
      }
    );

    observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, [ref, prebufferRatio, playRatio, detachRatio]);

  return shouldPlay;
}

