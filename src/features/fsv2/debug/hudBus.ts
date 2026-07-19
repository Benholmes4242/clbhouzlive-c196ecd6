/**
 * fsv2 Debug HUD bus — ring buffer + live sampler.
 *
 * Zero-cost when disabled: pushEvent/register return immediately if the
 * `fsv2Debug` flag is off. Enable via `Fsv2DebugToggle` (writes
 * localStorage 'fsv2Debug=1') or `window.__fsv2Debug(true)`.
 */

const STORAGE_KEY = 'fsv2Debug';
const MAX_ENTRIES = 400;
const SAMPLE_MS = 250;

export type HudEntry = {
  t: number; // ms since HUD start (or since first tap of current open)
  wall: number; // Date.now
  openId: string;
  name: string;
  payload: Record<string, unknown>;
};

type Listener = () => void;

let enabled = false;
try {
  enabled = typeof window !== 'undefined'
    && window.localStorage?.getItem(STORAGE_KEY) === '1';
} catch { /* ignore */ }

const buffer: HudEntry[] = [];
const listeners = new Set<Listener>();
let originT = performance.now();
let currentOpenId = '';

// Registered targets, keyed by openId (only the latest open is sampled).
type Registry = {
  openId: string;
  videoEl: HTMLVideoElement | null;
  slideEl: HTMLElement | null;
  overlayEl: HTMLElement | null;
  lastFrames: number;
  io: IntersectionObserver | null;
  lastRatio: number;
};
const registry: Registry = {
  openId: '',
  videoEl: null,
  slideEl: null,
  overlayEl: null,
  lastFrames: 0,
  io: null,
  lastRatio: 0,
};

let sampleTimer: ReturnType<typeof setInterval> | null = null;

export function isFsv2DebugEnabled(): boolean {
  return enabled;
}

export function setFsv2DebugEnabled(v: boolean): void {
  enabled = !!v;
  try {
    if (enabled) window.localStorage.setItem(STORAGE_KEY, '1');
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
  if (!enabled) stopSampler();
  emit();
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function emit(): void {
  for (const l of listeners) {
    try { l(); } catch { /* ignore */ }
  }
}

export function getEntries(): HudEntry[] {
  return buffer;
}

export function getLatestSample(): HudEntry | null {
  for (let i = buffer.length - 1; i >= 0; i--) {
    if (buffer[i].name === 'sample') return buffer[i];
  }
  return null;
}

export function pushEvent(name: string, payload: Record<string, unknown> = {}): void {
  if (!enabled) return;
  const now = performance.now();
  const openId = (payload.openId as string) || currentOpenId || '';
  if (name === 'tap') {
    originT = now;
    currentOpenId = openId;
  }
  const entry: HudEntry = {
    t: Math.round(now - originT),
    wall: Date.now(),
    openId,
    name,
    payload,
  };
  buffer.push(entry);
  if (buffer.length > MAX_ENTRIES) buffer.splice(0, buffer.length - MAX_ENTRIES);
  emit();
}

export function clearBuffer(): void {
  buffer.length = 0;
  emit();
}

export function copyToClipboard(): Promise<void> {
  const json = JSON.stringify(buffer, null, 2);
  try {
    return navigator.clipboard.writeText(json);
  } catch {
    return Promise.reject(new Error('clipboard unavailable'));
  }
}

// ---------- Element registry (called from VideoSlot / Slide) ---------------

export function registerVideoEl(openId: string, el: HTMLVideoElement | null): void {
  if (!enabled) return;
  if (registry.openId !== openId) resetRegistryForOpen(openId);
  registry.videoEl = el;
  if (el) startSampler();
}

export function registerSlideEl(openId: string, el: HTMLElement | null): void {
  if (!enabled) return;
  if (registry.openId !== openId) resetRegistryForOpen(openId);
  registry.slideEl = el;
  if (el) startSampler();
  attachIO();
}

export function registerOverlayEl(openId: string, el: HTMLElement | null): void {
  if (!enabled) return;
  if (registry.openId !== openId) resetRegistryForOpen(openId);
  registry.overlayEl = el;
}

function resetRegistryForOpen(openId: string) {
  registry.openId = openId;
  registry.videoEl = null;
  registry.slideEl = null;
  registry.overlayEl = null;
  registry.lastFrames = 0;
  registry.lastRatio = 0;
  if (registry.io) { try { registry.io.disconnect(); } catch { /* ignore */ } }
  registry.io = null;
}

function attachIO() {
  if (registry.io || !registry.videoEl) return;
  try {
    registry.io = new IntersectionObserver((entries) => {
      const e = entries[entries.length - 1];
      if (e) registry.lastRatio = e.intersectionRatio;
    }, { threshold: [0, 0.01, 0.5, 1] });
    registry.io.observe(registry.videoEl);
  } catch { /* ignore */ }
}

function ancestorChain(el: Element | null, depth = 4): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  let cur: Element | null = el;
  for (let i = 0; i < depth && cur; i++) {
    const cs = getComputedStyle(cur);
    out.push({
      tag: cur.tagName,
      cls: (cur.getAttribute('class') || '').slice(0, 60),
      op: cs.opacity,
      vis: cs.visibility,
      disp: cs.display,
      z: cs.zIndex,
      transform: cs.transform === 'none' ? '' : cs.transform.slice(0, 40),
    });
    cur = cur.parentElement;
  }
  return out;
}

function sample() {
  if (!enabled) return;
  const v = registry.videoEl;
  const s = registry.slideEl;
  const payload: Record<string, unknown> = { openId: registry.openId };

  if (v) {
    const r = v.getBoundingClientRect();
    payload.video = {
      connected: v.isConnected,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      videoW: v.videoWidth,
      videoH: v.videoHeight,
      readyState: v.readyState,
      currentTime: +v.currentTime.toFixed(3),
      paused: v.paused,
      muted: v.muted,
      psi: v.hasAttribute('playsinline'),
      wpsi: v.hasAttribute('webkit-playsinline'),
      chain: ancestorChain(v),
    };
    try {
      const q = (v as HTMLVideoElement & { getVideoPlaybackQuality?: () => { totalVideoFrames: number } }).getVideoPlaybackQuality?.();
      if (q) {
        const total = q.totalVideoFrames;
        (payload.video as Record<string, unknown>).frames = total;
        (payload.video as Record<string, unknown>).frameDelta = total - registry.lastFrames;
        registry.lastFrames = total;
      }
    } catch { /* ignore */ }
    (payload.video as Record<string, unknown>).ioRatio = +registry.lastRatio.toFixed(2);
  }

  if (s) {
    const r = s.getBoundingClientRect();
    payload.slide = {
      connected: s.isConnected,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      chain: ancestorChain(s),
    };
  }

  // Occlusion probe
  try {
    const cx = Math.round(window.innerWidth / 2);
    const cy = Math.round(window.innerHeight / 2);
    const hit = document.elementFromPoint(cx, cy);
    if (hit) {
      const cs = getComputedStyle(hit);
      const isVideoOrChild = !!v && (hit === v || v.contains(hit));
      payload.hit = {
        tag: hit.tagName,
        cls: (hit.getAttribute('class') || '').slice(0, 60),
        z: cs.zIndex,
        isVideo: isVideoOrChild,
      };
    }
  } catch { /* ignore */ }

  // Media census — count of <video> elements in the document that currently
  // hold an active source (either an `src` attribute or a MediaSource-backed
  // srcObject). Target at fullscreen open: <= 2.
  try {
    const vids = document.getElementsByTagName('video');
    let withSrc = 0;
    for (let i = 0; i < vids.length; i++) {
      const el = vids[i] as HTMLVideoElement;
      const hasAttrSrc = !!el.getAttribute('src');
      const hasObjSrc = !!el.srcObject;
      if (hasAttrSrc || hasObjSrc) withSrc += 1;
    }
    payload.mediaCensus = { videoEls: vids.length, withSrcCount: withSrc };
  } catch { /* ignore */ }

  pushEvent('sample', payload);
}


function startSampler() {
  if (sampleTimer || !enabled) return;
  sampleTimer = setInterval(sample, SAMPLE_MS);
}

function stopSampler() {
  if (sampleTimer) { clearInterval(sampleTimer); sampleTimer = null; }
}

// Dev/global helper: window.__fsv2Debug(true|false)
if (typeof window !== 'undefined') {
  (window as unknown as { __fsv2Debug?: (v?: boolean) => boolean }).__fsv2Debug = (v?: boolean) => {
    if (typeof v === 'boolean') setFsv2DebugEnabled(v);
    return enabled;
  };
}
