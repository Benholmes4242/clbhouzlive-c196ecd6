/**
 * fsv2Player — owns ONE <video> element outright. Native HLS on Safari/
 * Median WKWebView (`el.canPlayType('application/vnd.apple.mpegurl')`);
 * hls.js elsewhere. Falls back to `mp4Url` when no HLS is available.
 *
 * Purposely small — no engine, no lanes, no lifecycle machinery beyond
 * attach/detach.
 */

import type Hls from 'hls.js';

export interface Fsv2Source {
  hlsUrl?: string;
  mp4Url?: string;
}

export interface Fsv2AttachOpts {
  muted: boolean;
  startPosition?: number;
  onFirstFrame?: () => void;
}

export interface Fsv2AttachedPlayer {
  detach: () => void;
}

function canPlayNativeHls(el: HTMLVideoElement): boolean {
  try {
    return !!el.canPlayType('application/vnd.apple.mpegurl');
  } catch {
    return false;
  }
}

/**
 * Attach a source to an existing <video> element. Returns a `detach`
 * function that clears listeners and the hls.js instance if any.
 *
 * Does NOT call `.play()` — the caller decides when (must be inside a
 * gesture-token call stack for unmuted playback on iOS).
 */
export async function attach(
  el: HTMLVideoElement,
  source: Fsv2Source,
  opts: Fsv2AttachOpts,
): Promise<Fsv2AttachedPlayer> {
  el.muted = opts.muted;
  el.playsInline = true;
  el.setAttribute('playsinline', 'true');
  el.setAttribute('webkit-playsinline', 'true');
  el.preload = 'auto';

  const onLoaded = () => {
    if (opts.startPosition && opts.startPosition > 0.05) {
      try { el.currentTime = opts.startPosition; } catch { /* ignore */ }
    }
  };
  const onFirstFrame = () => {
    try { opts.onFirstFrame?.(); } catch { /* ignore */ }
  };

  el.addEventListener('loadedmetadata', onLoaded);
  el.addEventListener('loadeddata', onFirstFrame);
  el.addEventListener('playing', onFirstFrame);

  let hls: Hls | null = null;

  const hasHls = !!source.hlsUrl;
  const hasMp4 = !!source.mp4Url;
  const hintedHls = hasHls ? withBandwidthHint(source.hlsUrl!) : '';

  if (hasHls && canPlayNativeHls(el)) {
    el.src = hintedHls;
    el.load();
  } else if (hasHls) {
    try {
      const mod = await import('hls.js');
      const HlsCtor = (mod.default || (mod as unknown as { Hls: typeof Hls }).Hls) as typeof Hls;
      if (HlsCtor.isSupported()) {
        hls = new HlsCtor({ enableWorker: true });
        hls.loadSource(hintedHls);
        hls.attachMedia(el);
      } else if (hasMp4) {
        el.src = source.mp4Url!;
        el.load();
      }
    } catch {
      if (hasMp4) {
        el.src = source.mp4Url!;
        el.load();
      }
    }
  } else if (hasMp4) {
    el.src = source.mp4Url!;
    el.load();
  }

  return {
    detach: () => {
      el.removeEventListener('loadedmetadata', onLoaded);
      el.removeEventListener('loadeddata', onFirstFrame);
      el.removeEventListener('playing', onFirstFrame);
      try { el.pause(); } catch { /* ignore */ }
      if (hls) {
        try { hls.destroy(); } catch { /* ignore */ }
      }
      try { el.removeAttribute('src'); el.load(); } catch { /* ignore */ }
    },
  };
}
