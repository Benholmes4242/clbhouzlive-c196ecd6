// Simplified, quiet video play helper
export async function safePlay(v: HTMLVideoElement): Promise<boolean> {
  // don't attempt if the tab is hidden
  if (document.hidden) return false;

  // if already good enough to start, play once
  const good = v.readyState >= 2;
  try {
    if (!good) {
      // give the browser one short tick to fetch data
      await Promise.race([
        new Promise<void>((res) => {
          const onCanPlay = () => {
            v.removeEventListener("canplay", onCanPlay);
            res();
          };
          v.addEventListener("canplay", onCanPlay, { once: true });
        }),
        new Promise<void>((res) => setTimeout(res, 500)) // single short wait
      ]);
    }
    await v.play();
    return true;
  } catch {
    // swallow; autoplay policies or slow network — keep poster visible
    return false;
  }
}

// Enhanced autoplay with modal visibility guard (legacy compatibility)
export async function safePlayAfterAnimation(video: HTMLVideoElement): Promise<boolean> {
  // Wait for paint cycles to ensure modal is fully visible
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  return safePlay(video);
}

// Legacy exports for compatibility
export const isInWebView = /WebView|wv/.test(navigator.userAgent);
export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);