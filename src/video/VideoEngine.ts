/**
 * VideoEngine — Stage 0 headless singleton.
 *
 * Core rule (non-negotiable): ONE <video> element = ONE hls.js instance =
 * ONE owner, for that element's entire life. To show video elsewhere,
 * create a NEW lane there. NEVER move an hls instance between elements.
 * NEVER detachMedia -> attachMedia to "hand off". Re-point a lane's
 * SOURCE via hls.loadSource(); the element and instance stay bound.
 *
 * Lane elements live in a stable hidden host container from birth; a lane
 * is "mounted" into a surface host by appendChild on the ELEMENT (its own
 * hls instance follows it — that's legal, we never swap the instance).
 * We prefer this over cross-tree remount because React never owns lane
 * elements.
 */

import Hls, { type HlsConfig } from 'hls.js';
import {
  ABR_MAX_KBPS,
  DEFAULT_LANE_IDS,
  HLS_CONFIG,
  type LaneId,
  MAX_CONCURRENT_LOADS,
  ONE_UNMUTED_LANE,
  PAUSE_ON_HIDDEN,
  shouldGateForSaveData,
} from './lanePolicy';

type LaneState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'error';

type LaneListener = (snapshot: LaneSnapshot) => void;

export interface LaneSnapshot {
  laneId: LaneId;
  state: LaneState;
  currentTime: number;
  readyState: number;
  duration: number;
  muted: boolean;
  firstFrame: boolean;
  error?: string;
}

interface Lane {
  id: LaneId;
  el: HTMLVideoElement;
  hls: Hls | null; // null when native HLS (Safari)
  state: LaneState;
  hlsUrl: string | null;
  posterUrl: string | null;
  startPosition: number;
  firstFrame: boolean;
  listeners: Set<LaneListener>;
  detachFns: Array<() => void>;
}

const DBG = (...args: unknown[]) => {
  if (typeof window !== 'undefined' && (window as any).__VIDEO_ENGINE_DBG__) {
    // eslint-disable-next-line no-console
    console.info('[VideoEngine]', ...args);
  }
};

const HIDDEN_HOST_ID = '__video_engine_hidden_host__';

function ensureHiddenHost(): HTMLElement {
  if (typeof document === 'undefined') {
    throw new Error('VideoEngine requires a DOM');
  }
  let host = document.getElementById(HIDDEN_HOST_ID);
  if (!host) {
    host = document.createElement('div');
    host.id = HIDDEN_HOST_ID;
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText =
      'position:fixed;left:-99999px;top:-99999px;width:1px;height:1px;pointer-events:none;visibility:hidden;';
    document.body.appendChild(host);
  }
  return host;
}

function createLaneElement(laneId: LaneId): HTMLVideoElement {
  const el = document.createElement('video');
  el.dataset.laneId = laneId;
  el.playsInline = true;
  el.muted = true;
  el.preload = 'metadata';
  el.setAttribute('webkit-playsinline', 'true');
  el.style.cssText = 'width:100%;height:100%;object-fit:cover;background:#000;';
  return el;
}

function isNativeHlsSupported(el: HTMLVideoElement): boolean {
  return el.canPlayType('application/vnd.apple.mpegurl') !== '';
}

class VideoEngineImpl {
  private lanes = new Map<LaneId, Lane>();
  private booted = false;
  private saveDataGated = false;
  private loadingCount = 0;
  /** Session-scoped resume map, keyed by post/media id. Written by callers. */
  public lastPos = new Map<string, number>();

  boot(laneIds: LaneId[] = DEFAULT_LANE_IDS): void {
    if (this.booted) return;
    this.booted = true;
    this.saveDataGated = shouldGateForSaveData();
    const host = ensureHiddenHost();
    for (const id of laneIds) {
      const el = createLaneElement(id);
      host.appendChild(el);
      this.lanes.set(id, {
        id,
        el,
        hls: null,
        state: 'idle',
        hlsUrl: null,
        posterUrl: null,
        startPosition: -1,
        firstFrame: false,
        listeners: new Set(),
        detachFns: [],
      });
    }
    if (PAUSE_ON_HIDDEN && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onVisibility);
    }
    DBG('booted', { laneIds, saveDataGated: this.saveDataGated });
  }

  private onVisibility = () => {
    if (typeof document === 'undefined') return;
    if (document.hidden) this.pauseAll();
  };

  private getLane(laneId: LaneId): Lane {
    if (!this.booted) this.boot();
    const lane = this.lanes.get(laneId);
    if (!lane) throw new Error(`VideoEngine: unknown lane "${laneId}"`);
    return lane;
  }

  /** Move the lane's <video> into a host container. Instance stays bound. */
  mountLane(laneId: LaneId, hostEl: HTMLElement): void {
    const lane = this.getLane(laneId);
    if (lane.el.parentElement !== hostEl) {
      hostEl.appendChild(lane.el);
      DBG(laneId, 'mounted');
    }
  }

  /** Return the lane's element to the hidden host (does not release source). */
  unmountLane(laneId: LaneId): void {
    const lane = this.getLane(laneId);
    const host = ensureHiddenHost();
    if (lane.el.parentElement !== host) {
      host.appendChild(lane.el);
      DBG(laneId, 'unmounted');
    }
  }

  /**
   * Load (or re-point) a source into a lane. Reuses the lane's existing
   * hls instance via loadSource — never destroys/recreates it.
   */
  load(
    laneId: LaneId,
    opts: { hlsUrl: string; posterUrl?: string | null; startPosition?: number }
  ): void {
    const lane = this.getLane(laneId);
    const { hlsUrl, posterUrl = null, startPosition = -1 } = opts;

    if (this.saveDataGated) {
      DBG(laneId, 'skip load: save-data gated');
      return;
    }
    if (this.loadingCount >= MAX_CONCURRENT_LOADS && lane.state !== 'ready' && lane.state !== 'playing') {
      // Soft cap — still allow, hls.js queues internally, but log for tuning.
      DBG(laneId, 'over MAX_CONCURRENT_LOADS', this.loadingCount);
    }

    lane.hlsUrl = hlsUrl;
    lane.posterUrl = posterUrl;
    lane.startPosition = startPosition;
    lane.firstFrame = false;

    if (posterUrl) lane.el.poster = posterUrl;

    // Detach any previous per-load listeners.
    lane.detachFns.forEach((fn) => fn());
    lane.detachFns = [];

    const native = isNativeHlsSupported(lane.el);
    if (native && !Hls.isSupported()) {
      // Safari path — no hls.js instance, use the element's native player.
      lane.el.src = hlsUrl;
      this.wireElementEvents(lane, /* usingHls */ false);
      if (startPosition > 0) {
        const onMeta = () => {
          try {
            lane.el.currentTime = startPosition;
          } catch {
            /* noop */
          }
          lane.el.removeEventListener('loadedmetadata', onMeta);
        };
        lane.el.addEventListener('loadedmetadata', onMeta);
        lane.detachFns.push(() => lane.el.removeEventListener('loadedmetadata', onMeta));
      }
      this.transition(lane, 'loading');
      return;
    }

    // hls.js path.
    if (!lane.hls) {
      const config: Partial<HlsConfig> = {
        ...HLS_CONFIG,
        startPosition,
        // hls.js expects bps
        abrEwmaDefaultEstimate: 500_000,
        maxStarvationDelay: 4,
        // Cap ABR to policy ceiling
        capLevelOnFPSDrop: true,
      };
      lane.hls = new Hls(config);
      lane.hls.attachMedia(lane.el); // one-time bind for this element's life
      DBG(laneId, 'created hls instance');
    } else {
      // Re-point: stop current load, then load new source. Instance & element stay.
      lane.hls.stopLoad();
    }

    const hls = lane.hls;
    hls.config.startPosition = startPosition;
    hls.loadSource(hlsUrl);

    const onManifest = () => {
      // Enforce ABR ceiling based on manifest levels.
      const cap = ABR_MAX_KBPS * 1000;
      const maxLevel = hls.levels.reduce<number>((best, lvl, idx) => {
        return lvl.bitrate <= cap ? idx : best;
      }, hls.levels.length - 1);
      hls.autoLevelCapping = maxLevel;
      this.transition(lane, 'ready');
    };
    const onError = (_evt: unknown, data: any) => {
      if (data?.fatal) {
        lane.state = 'error';
        this.emit(lane, data?.details ?? 'fatal');
      }
    };
    hls.on(Hls.Events.MANIFEST_PARSED, onManifest);
    hls.on(Hls.Events.ERROR, onError);
    lane.detachFns.push(() => {
      hls.off(Hls.Events.MANIFEST_PARSED, onManifest);
      hls.off(Hls.Events.ERROR, onError);
    });

    this.wireElementEvents(lane, /* usingHls */ true);
    this.transition(lane, 'loading');
    this.loadingCount++;
    DBG(laneId, 'load', { hlsUrl, startPosition });
  }

  private wireElementEvents(lane: Lane, _usingHls: boolean) {
    const el = lane.el;
    const onLoadedData = () => {
      if (!lane.firstFrame) {
        lane.firstFrame = true;
        this.emit(lane);
      }
      if (this.loadingCount > 0) this.loadingCount--;
      if (lane.state === 'loading') this.transition(lane, 'ready');
    };
    const onTime = () => this.emit(lane);
    const onPlay = () => this.transition(lane, 'playing');
    const onPause = () => {
      if (lane.state !== 'error') this.transition(lane, 'paused');
    };
    const onError = () => this.transition(lane, 'error');
    el.addEventListener('loadeddata', onLoadedData);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('error', onError);
    lane.detachFns.push(() => {
      el.removeEventListener('loadeddata', onLoadedData);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('error', onError);
    });
  }

  play(laneId: LaneId): Promise<void> {
    const lane = this.getLane(laneId);
    const p = lane.el.play();
    return Promise.resolve(p).catch((err) => {
      DBG(laneId, 'play() rejected', err);
    });
  }

  pause(laneId: LaneId): void {
    const lane = this.getLane(laneId);
    if (!lane.el.paused) lane.el.pause();
  }

  pauseAll(): void {
    this.lanes.forEach((lane) => {
      if (!lane.el.paused) lane.el.pause();
    });
  }

  seek(laneId: LaneId, seconds: number): void {
    const lane = this.getLane(laneId);
    try {
      lane.el.currentTime = seconds;
    } catch {
      /* noop */
    }
  }

  getTime(laneId: LaneId): number {
    return this.getLane(laneId).el.currentTime || 0;
  }

  setMuted(laneId: LaneId, muted: boolean): void {
    const lane = this.getLane(laneId);
    if (!muted && ONE_UNMUTED_LANE) {
      // Enforce: mute every other lane first.
      this.lanes.forEach((other) => {
        if (other.id !== laneId) other.el.muted = true;
      });
    }
    lane.el.muted = muted;
    this.emit(lane);
  }

  /** Release the current source but keep the element+instance for reuse. */
  release(laneId: LaneId): void {
    const lane = this.getLane(laneId);
    if (lane.hls) {
      lane.hls.stopLoad();
      lane.hls.detachMedia();
      // Rebind so the instance stays paired with THIS element for its life.
      lane.hls.attachMedia(lane.el);
    } else {
      lane.el.removeAttribute('src');
      lane.el.load();
    }
    lane.detachFns.forEach((fn) => fn());
    lane.detachFns = [];
    lane.hlsUrl = null;
    lane.firstFrame = false;
    this.transition(lane, 'idle');
    DBG(laneId, 'released');
  }

  snapshot(laneId: LaneId): LaneSnapshot {
    const lane = this.getLane(laneId);
    return {
      laneId,
      state: lane.state,
      currentTime: lane.el.currentTime || 0,
      readyState: lane.el.readyState,
      duration: isFinite(lane.el.duration) ? lane.el.duration : 0,
      muted: lane.el.muted,
      firstFrame: lane.firstFrame,
    };
  }

  subscribe(laneId: LaneId, listener: LaneListener): () => void {
    const lane = this.getLane(laneId);
    lane.listeners.add(listener);
    // fire once with current state
    listener(this.snapshot(laneId));
    return () => lane.listeners.delete(listener);
  }

  private transition(lane: Lane, next: LaneState) {
    if (lane.state === next) {
      this.emit(lane);
      return;
    }
    lane.state = next;
    this.emit(lane);
    DBG(lane.id, '->', next);
  }

  private emit(lane: Lane, error?: string) {
    const snap = this.snapshot(lane.id);
    if (error) snap.error = error;
    lane.listeners.forEach((l) => {
      try {
        l(snap);
      } catch {
        /* noop */
      }
    });
  }

  /** Test-only utility: list lane ids currently registered. */
  listLanes(): LaneId[] {
    return Array.from(this.lanes.keys());
  }
}

export const VideoEngine = new VideoEngineImpl();
export type { LaneId } from './lanePolicy';
