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
import { fsv, fsvEl, fsvTimeSample } from '@/perf/fsvTelemetry';

/** Lanes we emit rich FSV telemetry for — noisy lanes (feed-next preload) skipped. */
const FSV_LANES = new Set<LaneId>(['fullscreen', 'feed-active']);
const isFsv = (id: LaneId): boolean => FSV_LANES.has(id);

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
  /** postId this lane's current source belongs to (for lastPos tracking). */
  postId: string | null;
  /** Non-hidden host the lane element is currently mounted into (null while parked). */
  mountedHost: HTMLElement | null;
  /** Persistent play-intent. Set true by engine.play(), false by pause()/release()/unmount. */
  wantPlay: boolean;
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
  el.loop = true; // Stage-1 polish: loop by default on both feed + fullscreen lanes.
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
        postId: null,
        mountedHost: null,
        wantPlay: false,
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

  /**
   * Move the lane's <video> into a host container. Idempotent + move-safe:
   * appendChild atomically removes the element from any previous parent and
   * inserts it here. Safe to call from whichever card just became active.
   */
  mountLane(laneId: LaneId, hostEl: HTMLElement): void {
    const lane = this.getLane(laneId);
    const alreadyParented = lane.el.parentElement === hostEl;
    if (!alreadyParented) {
      hostEl.appendChild(lane.el);
      DBG(laneId, 'mounted');
    }
    lane.mountedHost = hostEl;
    if (isFsv(laneId)) {
      fsvEl('eng.mountLane', lane.el, {
        laneId,
        alreadyParented,
        wantPlay: lane.wantPlay,
        postId: lane.postId,
      });
    }
    // If play-intent is set (from a pre-mount play() or a still-loading source),
    // kick it off now — wantPlay persists through source changes.
    if (lane.wantPlay && lane.el.paused) {
      const p = lane.el.play();
      if (p && typeof (p as Promise<void>).catch === 'function') {
        (p as Promise<void>).catch(() => { /* autoplay reject — safe */ });
      }
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
    if (isFsv(laneId)) fsvEl('eng.unmount', lane.el, { laneId, postId: lane.postId });
    lane.mountedHost = null;
    lane.wantPlay = false;
  }

  /**
   * Load (or re-point) a source into a lane. Reuses the lane's existing
   * hls instance via loadSource — never destroys/recreates it.
   */
  load(
    laneId: LaneId,
    opts: { hlsUrl: string; posterUrl?: string | null; startPosition?: number; postId?: string | null }
  ): void {
    const lane = this.getLane(laneId);
    const { hlsUrl, posterUrl = null, startPosition = -1, postId = null } = opts;
    // Same postId + same URL already loaded → no reload. This makes remount
    // (element moving between card hosts) cheap and avoids re-fetching HLS.
    const alreadyLoaded =
      lane.postId != null &&
      lane.postId === postId &&
      lane.hlsUrl === hlsUrl &&
      lane.state !== 'idle' &&
      lane.state !== 'error';
    if (alreadyLoaded) {
      DBG(laneId, 'skip reload: same postId+url', { state: lane.state });
      if (isFsv(laneId)) {
        fsvEl('eng.load', lane.el, {
          laneId, postId, startPosition, alreadyLoaded: true, state: lane.state,
        });
      }
      return;
    }
    const priorPostId = lane.postId;
    const priorHlsUrl = lane.hlsUrl;
    const priorFirstFrame = lane.firstFrame;
    lane.postId = postId;


    if (this.saveDataGated) {
      DBG(laneId, 'skip load: save-data gated');
      if (isFsv(laneId)) fsv('eng.load', { laneId, skipped: 'save-data-gated' });
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
    // Reset playback position on source change so B doesn't inherit A's time.
    let resetToZero = false;
    if (startPosition <= 0) {
      try { lane.el.currentTime = 0; resetToZero = true; } catch { /* noop */ }
    }
    // NOTE: do NOT clear wantPlay here — a mid-load play() intent must persist
    // so the engine can start playback once the new source reaches canplay.

    if (posterUrl) lane.el.poster = posterUrl;

    // Detach any previous per-load listeners.
    lane.detachFns.forEach((fn) => fn());
    lane.detachFns = [];

    const native = isNativeHlsSupported(lane.el);
    const usingNative = native && !Hls.isSupported();
    if (isFsv(laneId)) {
      fsvEl('eng.load', lane.el, {
        laneId,
        postId,
        priorPostId,
        urlChanged: priorHlsUrl !== hlsUrl,
        priorFirstFrame,
        startPosition,
        resetToZero,
        wantPlay: lane.wantPlay,
        native: usingNative,
        hlsInstanceReused: !!lane.hls,
        hlsUrlTail: hlsUrl.slice(-42),
      });
    }
    if (usingNative) {
      // Safari path — no hls.js instance, use the element's native player.
      lane.el.src = hlsUrl;
      this.wireElementEvents(lane, /* usingHls */ false);
      if (startPosition > 0) {
        const onMeta = () => {
          if (isFsv(laneId)) fsvEl('eng.load.nativeSeek', lane.el, { laneId, seekTo: startPosition });
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
    if (isFsv(laneId)) {
      fsv('eng.load.hlsCfg', {
        laneId,
        startPositionCfg: startPosition,
        instanceReused: !!priorHlsUrl,
      });
    }

    const onManifest = () => {
      // Enforce ABR ceiling based on manifest levels.
      const cap = ABR_MAX_KBPS * 1000;
      const maxLevel = hls.levels.reduce<number>((best, lvl, idx) => {
        return lvl.bitrate <= cap ? idx : best;
      }, hls.levels.length - 1);
      hls.autoLevelCapping = maxLevel;
      if (isFsv(laneId)) {
        fsvEl('eng.load.manifest', lane.el, {
          laneId, levels: hls.levels.length, autoLevelCap: maxLevel,
        });
      }
      this.transition(lane, 'ready');
    };
    const onError = (_evt: unknown, data: any) => {
      if (data?.fatal) {
        if (isFsv(laneId)) fsv('eng.load.error', { laneId, details: data?.details });
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


  /**
   * Preload a source into a lane without playing it. Used to warm the
   * next feed card (via the `feed-next` lane) so manifest + first segment
   * are fetched before activation → near-instant play on centering.
   */
  preload(
    laneId: LaneId,
    opts: { hlsUrl: string; posterUrl?: string | null; postId?: string | null }
  ): void {
    this.load(laneId, {
      hlsUrl: opts.hlsUrl,
      posterUrl: opts.posterUrl ?? null,
      startPosition: -1,
      postId: opts.postId ?? null,
    });
    // Explicitly ensure the preload lane is paused (its element is in the
    // hidden host — nothing to render — but paused keeps the decoder cool).
    const lane = this.getLane(laneId);
    if (!lane.el.paused) lane.el.pause();
  }

  private wireElementEvents(lane: Lane, _usingHls: boolean) {
    const el = lane.el;
    const trace = isFsv(lane.id);
    // Unified "ready to show" gate for BOTH fullscreen (open) and feed-active
    // (close/resume). Only flip firstFrame once the element has actually
    // seeked to (or past) the requested position — preventing frame-0 flash.
    const markReadyToShow = (source: string) => {
      if (lane.firstFrame) return;
      if (lane.id !== 'fullscreen' && lane.id !== 'feed-active') return;
      const target = lane.startPosition > 0 ? lane.startPosition : 0;
      const now = lane.el.currentTime || 0;
      // With a seek target, wait until element playhead is at/past target - 0.3s.
      // Without a target (startPosition<=0), any painted frame counts.
      if (target > 0 && now < target - 0.3) {
        if (trace) {
          fsv('eng.markFF', {
            laneId: lane.id, source, target: +target.toFixed(3),
            now: +now.toFixed(3), flipped: false, reason: 'below-target',
          });
        }
        return;
      }
      lane.firstFrame = true;
      if (trace) {
        fsv('eng.markFF', {
          laneId: lane.id, source, target: +target.toFixed(3),
          now: +now.toFixed(3), flipped: true,
        });
      }
      this.emit(lane);
    };
    const onLoadstart = () => { if (trace) fsvEl('el.loadstart', el, { laneId: lane.id }); };
    const onLoadedMeta = () => { if (trace) fsvEl('el.loadedmeta', el, { laneId: lane.id, startPos: lane.startPosition }); };
    const onLoadedData = () => {
      if (trace) fsvEl('el.loadeddata', el, { laneId: lane.id, startPos: lane.startPosition });
      if (this.loadingCount > 0) this.loadingCount--;
      if (lane.state === 'loading') this.transition(lane, 'ready');
      // loadeddata alone does NOT flip firstFrame anymore — we wait for the
      // seek to land. When there IS no seek target, loadeddata is enough.
      if (lane.startPosition <= 0) markReadyToShow('loadeddata@start<=0');
    };
    const onSeeking = () => { if (trace) fsvEl('el.seeking', el, { laneId: lane.id, target: lane.startPosition }); };
    const onSeeked = () => {
      if (trace) fsvEl('el.seeked', el, { laneId: lane.id, target: lane.startPosition });
      markReadyToShow('seeked');
    };

    const onPlaying = () => { if (trace) fsvEl('el.playing', el, { laneId: lane.id }); };
    const onWaiting = () => { if (trace) fsvEl('el.waiting', el, { laneId: lane.id }); };
    const onStalled = () => { if (trace) fsvEl('el.stalled', el, { laneId: lane.id }); };
    const onRateChange = () => { if (trace) fsvEl('el.ratechange', el, { laneId: lane.id, rate: el.playbackRate }); };
    const onCanPlayThru = () => { if (trace) fsvEl('el.canplaythru', el, { laneId: lane.id }); };
    const onTime = () => {
      if (lane.postId) this.lastPos.set(lane.postId, lane.el.currentTime || 0);
      if (trace) fsvTimeSample(`${lane.id}:time`, el, { laneId: lane.id, target: lane.startPosition });
      if (lane.id === 'fullscreen' && !lane.firstFrame) markFsFirstFrame('timeupdate');
      // Gapless loop for short clips (<15s): native loop leaves a 100-300ms
      // gap on iOS HLS. Preempt the seam by seeking to 0 + play() ourselves.
      const dur = lane.el.duration;
      if (isFinite(dur) && dur > 0 && dur < 15) {
        const remaining = dur - (lane.el.currentTime || 0);
        if (remaining < 0.1) {
          try { lane.el.currentTime = 0; } catch { /* noop */ }
          const p = lane.el.play();
          if (p && typeof (p as Promise<void>).catch === 'function') {
            (p as Promise<void>).catch(() => { /* autoplay reject — safe */ });
          }
        }
      }
      this.emit(lane);
    };

    const onPlay = () => {
      if (trace) fsvEl('el.play', el, { laneId: lane.id });
      this.transition(lane, 'playing');
    };
    const onPause = () => {
      if (trace) fsvEl('el.pause', el, { laneId: lane.id });
      if (lane.state !== 'error') this.transition(lane, 'paused');
    };

    const onError = () => {
      if (trace) fsvEl('el.error', el, { laneId: lane.id, err: el.error?.code });
      this.transition(lane, 'error');
    };
    const onCanPlay = () => {
      if (trace) fsvEl('el.canplay', el, { laneId: lane.id, wantPlay: lane.wantPlay, mounted: !!lane.mountedHost });
      // Honor persistent play-intent: if play() was called before/while the
      // (new) source was loading, kick it off now that it's ready.
      if (lane.wantPlay && lane.mountedHost && lane.el.paused) {
        if (trace) fsvEl('eng.canplayKick', el, { laneId: lane.id, startPos: lane.startPosition });
        const p = lane.el.play();
        if (p && typeof (p as Promise<void>).catch === 'function') {
          (p as Promise<void>).catch(() => { /* autoplay reject — safe */ });
        }
      }
    };
    el.addEventListener('loadstart', onLoadstart);
    el.addEventListener('loadedmetadata', onLoadedMeta);
    el.addEventListener('loadeddata', onLoadedData);
    el.addEventListener('canplay', onCanPlay);
    el.addEventListener('canplaythrough', onCanPlayThru);
    el.addEventListener('seeking', onSeeking);
    el.addEventListener('seeked', onSeeked);
    el.addEventListener('playing', onPlaying);
    el.addEventListener('waiting', onWaiting);
    el.addEventListener('stalled', onStalled);
    el.addEventListener('ratechange', onRateChange);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('error', onError);
    lane.detachFns.push(() => {
      el.removeEventListener('loadstart', onLoadstart);
      el.removeEventListener('loadedmetadata', onLoadedMeta);
      el.removeEventListener('loadeddata', onLoadedData);
      el.removeEventListener('canplay', onCanPlay);
      el.removeEventListener('canplaythrough', onCanPlayThru);
      el.removeEventListener('seeking', onSeeking);
      el.removeEventListener('seeked', onSeeked);
      el.removeEventListener('playing', onPlaying);
      el.removeEventListener('waiting', onWaiting);
      el.removeEventListener('stalled', onStalled);
      el.removeEventListener('ratechange', onRateChange);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('error', onError);
    });
  }


  play(laneId: LaneId, opts: { callerPostId?: string | null } = {}): Promise<void> {
    const lane = this.getLane(laneId);
    const caller = opts.callerPostId ?? null;
    const priorPostId = lane.postId;
    const priorWantPlay = lane.wantPlay;
    // Ownership: the moment a card issues play() it becomes the lane owner.
    // Guarantees pause() owner-guard below can reject stale outgoing cards
    // even if load() hasn't yet updated lane.postId for this caller.
    if (caller != null) lane.postId = caller;
    // Persistent intent: set now, honored on mount + on canplay after (re)load.
    lane.wantPlay = true;
    if (isFsv(laneId)) {
      fsvEl('eng.play', lane.el, {
        laneId, caller, priorPostId, priorWantPlay,
        mounted: !!lane.mountedHost, state: lane.state, startPos: lane.startPosition,
      });
    }
    if (!lane.mountedHost) {
      DBG(laneId, 'play() queued — no mounted host');
      if (isFsv(laneId)) fsv('eng.play.queued', { laneId, caller });
      return Promise.resolve();
    }
    if (isFsv(laneId)) fsvEl('eng.play.kick', lane.el, { laneId });
    const p = lane.el.play();
    return Promise.resolve(p).catch((err) => {
      DBG(laneId, 'play() rejected', err);
      if (isFsv(laneId)) fsv('eng.play.rejected', { laneId, err: String(err) });
    });
  }

  pause(laneId: LaneId, opts: { callerPostId?: string | null } = {}): void {
    const lane = this.getLane(laneId);
    const caller = opts.callerPostId ?? null;
    // OWNER GUARD: only the current lane owner may pause it. Stale outgoing
    // cards (caller != lane.postId) must NOT pause the incoming card that
    // already took the lane. Null caller = engine-wide (pauseAll/visibility/
    // release) — always allowed.
    if (caller != null && lane.postId != null && caller !== lane.postId) {
      if (isFsv(laneId)) {
        fsv('eng.pause.stale', { laneId, caller, lanePostId: lane.postId });
      }
      return;
    }
    if (isFsv(laneId)) {
      fsvEl('eng.pause', lane.el, {
        laneId, caller, lanePostId: lane.postId, wantPlayBefore: lane.wantPlay,
      });
    }
    lane.wantPlay = false;
    if (!lane.el.paused) lane.el.pause();
  }


  pauseAll(): void {
    this.lanes.forEach((lane) => {
      lane.wantPlay = false;
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

  /** Set object-fit on the lane's <video> element. */
  setObjectFit(laneId: LaneId, fit: 'cover' | 'contain'): void {
    this.getLane(laneId).el.style.objectFit = fit;
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
    lane.wantPlay = false;
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

  /** Read the last known playback position for a post (session-scoped). */
  getLastPos(postId: string | null | undefined): number {
    if (!postId) return 0;
    return this.lastPos.get(postId) ?? 0;
  }



  /** Test-only utility: list lane ids currently registered. */
  listLanes(): LaneId[] {
    return Array.from(this.lanes.keys());
  }
}

export const VideoEngine = new VideoEngineImpl();
export type { LaneId } from './lanePolicy';
