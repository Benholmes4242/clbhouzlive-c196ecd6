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
  RAIL_HLS_OVERRIDES,
  type LaneId,
  MAX_CONCURRENT_LOADS,
  ONE_UNMUTED_LANE,
  PAUSE_ON_HIDDEN,
  shouldGateForSaveData,
} from './lanePolicy';
import { isPerfEnabled } from '@/perf/navTiming';
import {
  vperfLaneEvent,
  vperfArmLane,
  vperfSessionStart,
  vperfSessionEnd,
  vperfSessionLevel,
  vperfSessionSuppressNextStall,
  vperfStart,
  vperfMark,
  vperfNextId,
} from '@/perf/vperf';
import { readSeededBandwidth } from './bandwidthMemory';
import { coldOpenAttach, coldOpenFirstFrame } from '@/perf/coldOpen';
import { trace, traceLookup, elIdOf, traceGenElId } from '@/perf/trace';
import { feedLaneRoles } from './feedLaneRoles';
import { useSessionAudio } from '@/audio/sessionAudioStore';
import { audioDebugEnabled, logAudio, msSinceOpen } from '@/perf/audioDebug';

/**
 * Wrap `muted` on an <video> instance so every write is logged. The
 * accessor delegates to the prototype descriptor, so behaviour is
 * byte-identical when audioDebug is off (this helper isn't called then).
 *
 * Stack: top 3-4 meaningful frames of new Error().stack, trimmed to
 * "fn @ file:line". Catches ALL writers — engine policy, tile effects,
 * borrow machinery, external code — since it hooks the setter itself.
 */
function installMutedSetterProbe(el: HTMLVideoElement, laneId: LaneId): void {
  try {
    const proto = Object.getPrototypeOf(el) as HTMLMediaElement;
    // HTMLMediaElement.prototype has the real descriptor.
    let desc: PropertyDescriptor | undefined;
    let cursor: any = proto;
    while (cursor && !desc) {
      desc = Object.getOwnPropertyDescriptor(cursor, 'muted');
      if (!desc) cursor = Object.getPrototypeOf(cursor);
    }
    if (!desc || !desc.get || !desc.set) return;
    const nativeGet = desc.get.bind(el);
    const nativeSet = desc.set.bind(el);
    Object.defineProperty(el, 'muted', {
      configurable: true,
      enumerable: true,
      get() { return nativeGet(); },
      set(value: boolean) {
        try {
          const raw = new Error().stack || '';
          const frames = raw.split('\n').map(s => s.trim()).filter(Boolean)
            // Drop "Error" header and this probe's own frame.
            .filter(l => !/^Error/i.test(l) && !/installMutedSetterProbe|Object\.set /.test(l))
            .slice(0, 4)
            .map(l => l.replace(/^at\s+/, ''));
          logAudio('muted.set', {
            laneId,
            value: !!value,
            msSinceOpen: msSinceOpen(),
            stack: frames,
          });
        } catch {}
        nativeSet(value);
      },
    });
  } catch {}
}


export type LaneAudioPolicy = 'session' | 'always-muted' | 'local';




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
  /** RAW lane.postId — may be a bare postId or an ownerKey (`${postId}:${idx}`)
   *  depending on which entry point wrote last. Consumers should handle both
   *  shapes (exact match OR `${postId}:` prefix). Do NOT normalize here. */
  postId: string | null;
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
  audioPolicy: LaneAudioPolicy;
}


const DBG = (...args: unknown[]) => {
  // Gate on the DBG pill (isPerfEnabled) so device WebViews (no window
  // console) can enable traces via the on-screen toggle. Legacy
  // window.__VIDEO_ENGINE_DBG__ still honored for quick browser flips.
  const flag =
    typeof window !== 'undefined' && (window as any).__VIDEO_ENGINE_DBG__;
  if (!flag && !isPerfEnabled()) return;
  // eslint-disable-next-line no-console
  console.info('[VideoEngine]', ...args);
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
  // [TRACE] element identity — every lane <video> carries a stable short id
  // so trace lines across layers can prove they hold the SAME element.
  (el.dataset as any).vid = traceGenElId();
  // Muted-setter probe (audioDebug only). Installed BEFORE any write so the
  // initial mute below is captured too. No-op when the flag is off.
  if (audioDebugEnabled()) installMutedSetterProbe(el, laneId);
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
  /**
   * Stage-7 PR-1 fix: lanes currently borrowed by the fullscreen viewer.
   * Owner-caller pauses on these lanes are ignored (the ex-owner tile no
   * longer drives playback while borrowed). Null-caller engine-wide pauses
   * (pauseAll, document.hidden) still pause them — visibility semantics
   * must be preserved.
   */
  private borrowedLanes = new Set<LaneId>();
  /**
   * Stage-7 Audio v3: per-borrow volumechange guard detachers. While a lane
   * is borrowed by the fullscreen viewer, an element-level `volumechange`
   * listener defends the session audio policy — any external writer that
   * mutes the element out from under us (e.g. a tile-side effect firing on
   * deactivate) is corrected on the next microtask and traced to the HUD.
   * Cleared on clearBorrowed BEFORE the rail's own policy is restored so
   * handback muting does not falsely trip the guard.
   */
  private borrowGuardDetach = new Map<LaneId, () => void>();

  /**
   * Autoplay-blocked signal — fires when a 'session' lane's unmuted play()
   * is rejected by the browser and we degrade THIS lane to muted so playback
   * continues. Consumers (feed slide, fullscreen overlay) show a
   * "Tap for sound" pill in response. We deliberately do NOT write the
   * session store here — the user's session intent stays "unmuted"; the
   * pill's tap re-asserts it with a fresh user gesture.
   */
  private autoplayBlockedListeners = new Set<(laneId: LaneId) => void>();

  onAutoplayBlocked(fn: (laneId: LaneId) => void): () => void {
    this.autoplayBlockedListeners.add(fn);
    return () => {
      this.autoplayBlockedListeners.delete(fn);
    };
  }

  private emitAutoplayBlocked(laneId: LaneId): void {
    this.autoplayBlockedListeners.forEach((fn) => {
      try { fn(laneId); } catch {}
    });
  }

  markBorrowed(laneId: LaneId): void {
    this.borrowedLanes.add(laneId);
    DBG('markBorrowed', { laneId });
    logAudio('borrow.marked', { laneId, msSinceOpen: msSinceOpen() });
    // Attach volumechange guard: while borrowed, the effective policy is
    // 'session', so any external write that contradicts the session store
    // must be corrected. Self-triggered volumechanges are naturally
    // terminating — the reassert writes the expected value, the resulting
    // volumechange matches sessionMuted, and the branch no-ops.
    const lane = this.lanes.get(laneId);
    if (lane) {
      const el = lane.el;
      const onVC = () => {
        if (!this.borrowedLanes.has(laneId)) return;
        const sessionMuted = useSessionAudio.getState().isMuted;
        if (el.muted !== sessionMuted) {
          logAudio('audio.guard.reassert', {
            laneId,
            externalValue: el.muted,
            expected: sessionMuted,
            msSinceOpen: msSinceOpen(),
          });
          this.applyAudioPolicy(lane, 'guard-reassert');
        }
      };
      el.addEventListener('volumechange', onVC);
      this.borrowGuardDetach.set(laneId, () => {
        try { el.removeEventListener('volumechange', onVC); } catch {}
      });
    }
  }

  clearBorrowed(laneId: LaneId): void {
    // Detach the borrow guard FIRST so the handback's applyAudioPolicy
    // (which re-mutes rails) does not fire the reassert branch.
    const detach = this.borrowGuardDetach.get(laneId);
    if (detach) {
      detach();
      this.borrowGuardDetach.delete(laneId);
    }
    this.borrowedLanes.delete(laneId);
    DBG('clearBorrowed', { laneId });
    logAudio('borrow.cleared', { laneId, msSinceOpen: msSinceOpen() });
    // Handback returns the lane muted and audio-neutral. The returned lane
    // is about to be rotated/idled by the feed's post-close activation flow;
    // a muted return can never steal the ONE_UNMUTED_LANE slot from whichever
    // lane the feed actually promotes. The feed's activation path
    // (play() → applyAudioPolicy trigger='activation') then applies session
    // policy to whichever lane actually speaks, unmuting the true speaker
    // via the same invariant-respecting setMuted route.
    const lane = this.lanes.get(laneId);
    if (lane) {
      this.setMuted(laneId, true);
      logAudio('handback.done', {
        laneId,
        elMutedAfter: lane.el.muted,
        elVolumeAfter: lane.el.volume,
        elPausedAfter: lane.el.paused,
        msSinceOpen: msSinceOpen(),
      });
    }
  }

  /** Public read: is this lane currently borrowed by the fullscreen viewer?
   *  Tile-side hooks (useRailLane belt-and-braces mute, etc.) consult this
   *  before writing to `el.muted` so they never fight the viewer's session
   *  policy. Handback restores the declared policy — no tile-side rewrite
   *  needed. */
  isBorrowed(laneId: LaneId): boolean {
    return this.borrowedLanes.has(laneId);
  }



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
        audioPolicy: 'always-muted',
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

  private resetFirstFrameForLane(lane: Lane, reason: string): void {
    if (!lane.firstFrame) {
      // Still log the reset intent so ordering (reset BEFORE snapshot read)
      // is provable even when firstFrame was already false.
      const openT = traceLookup({ postId: lane.postId });
      trace('engine.reset', {
        openId: openT?.openId,
        laneId: lane.id,
        elId: elIdOf(lane.el),
        reason,
        wasTrue: false,
      });
      return;
    }
    lane.firstFrame = false;
    DBG(lane.id, 'firstFrame.reset', { reason, postId: lane.postId });
    {
      const openT = traceLookup({ postId: lane.postId });
      trace('engine.reset', {
        openId: openT?.openId,
        laneId: lane.id,
        elId: elIdOf(lane.el),
        reason,
        wasTrue: true,
      });
    }
    this.emit(lane);
  }

  resetFirstFrame(laneId: LaneId, reason = 'manual'): void {
    this.resetFirstFrameForLane(this.getLane(laneId), reason);
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
      // INVARIANT TRIPWIRE — double-bind guard for the singleton fullscreen
      // lane. The React-layer single-source gate in FeedSlide should make
      // this impossible; if it ever fires, a new render path started
      // binding 'fullscreen' concurrently and must be gated.
      if (
        laneId === 'fullscreen' &&
        lane.mountedHost &&
        lane.mountedHost !== hostEl &&
        lane.el.parentElement === lane.mountedHost &&
        !this.borrowedLanes.has(laneId)
      ) {
        const openT = traceLookup({ ownerKey: lane.postId });
        trace('lane.bind.rejected', {
          openId: openT?.openId,
          laneId,
          reason: 'fullscreen-already-bound',
          currentPostId: lane.postId,
        });
      }
      hostEl.appendChild(lane.el);
      DBG(laneId, 'mounted');
    }
    lane.mountedHost = hostEl;
    // AUDIO POLICY: apply on mount so a lane's element muted state reflects
    // its policy the moment it's parented into a surface host.
    this.applyAudioPolicy(lane, 'mount');
    // If play-intent is set (from a pre-mount play() or a still-loading source),
    // kick it off now — wantPlay persists through source changes.
    if (lane.wantPlay && lane.el.paused) {
      const p = lane.el.play();
      if (p && typeof (p as Promise<void>).catch === 'function') {
        (p as Promise<void>).catch(() => { /* autoplay reject — safe */ });
      }
    }
  }

  /**
   * Declare a lane's audio policy. 'session' lanes follow useSessionAudio;
   * 'always-muted' lanes stay muted regardless; 'local' lanes are left alone
   * (only setMuted controls them). Applied immediately.
   */
  setAudioPolicy(laneId: LaneId, policy: LaneAudioPolicy): void {
    const lane = this.getLane(laneId);
    if (lane.audioPolicy === policy) return;
    lane.audioPolicy = policy;
    this.applyAudioPolicy(lane, 'policy-change');
  }

  /**
   * Public re-apply of a lane's declared audio policy. Same code path the
   * session-toggle uses; call this at bind sites (fullscreen borrow / cold)
   * to push current useSessionAudio state onto the freshly-parented element.
   * No-op for 'always-muted' / 'local' semantics is preserved inside
   * applyAudioPolicy. Safe when the lane doesn't exist (silent return).
   */
  applyLaneAudioPolicy(laneId: LaneId): void {
    const lane = this.lanes.get(laneId);
    if (!lane) return;
    this.applyAudioPolicy(lane, 'external-bind');
  }

  private applyAudioPolicy(lane: Lane, trigger: 'mount' | 'activation' | 'policy-change' | 'external-bind' | 'guard-reassert' | 'unknown' = 'unknown'): void {
    // Borrow override: while the fullscreen viewer owns this lane's element,
    // the effective policy is 'session' regardless of the lane's declared
    // policy (rails ship as 'always-muted'/'local' but must sing in the
    // viewer). Handback re-runs this after clearBorrowed to restore.
    const borrowed = this.borrowedLanes.has(lane.id);
    const effectivePolicy: LaneAudioPolicy = borrowed ? 'session' : lane.audioPolicy;
    const sessionMuted = useSessionAudio.getState().isMuted;
    let action: 'noop' | 'mute' | 'setMuted' = 'noop';
    if (effectivePolicy === 'always-muted') {
      if (!lane.el.muted) { action = 'mute'; }
    } else if (effectivePolicy === 'session') {
      if (lane.el.muted !== sessionMuted) { action = 'setMuted'; }
    }
    logAudio('policy.resolve', {
      laneId: lane.id,
      trigger,
      declaredPolicy: lane.audioPolicy,
      borrowed,
      effectivePolicy,
      sessionMuted,
      elMuted: lane.el.muted,
      action,
    });
    if (effectivePolicy === 'always-muted') {
      if (!lane.el.muted) { lane.el.muted = true; this.emit(lane); }
      return;
    }
    if (effectivePolicy === 'session') {
      if (lane.el.muted !== sessionMuted) {
        // Respect ONE_UNMUTED_LANE on unmute.
        this.setMuted(lane.id, sessionMuted);
      }
      return;
    }
    // 'local' → leave alone.
  }



  /** Return the lane's element to the hidden host (does not release source). */
  unmountLane(laneId: LaneId): void {
    // BORROW GUARD (Stage-7 PR-2): while a lane is borrowed by the fullscreen
    // viewer, ignore unmountLane calls — the element lives in the viewer's
    // wrapper right now, and re-parenting it into the hidden host would steal
    // it back mid-playback. returnBorrow clears the borrow flag BEFORE its
    // own fallback park, so it isn't affected.
    if (this.borrowedLanes.has(laneId)) {
      const lane = this.getLane(laneId);
      // PERMANENT REGRESSION TRIPWIRE — do not remove.
      DBG('unmount.borrowed', { laneId, postId: lane.postId });
      return;
    }
    const lane = this.getLane(laneId);
    const host = ensureHiddenHost();
    if (lane.el.parentElement !== host) {
      host.appendChild(lane.el);
      DBG(laneId, 'unmounted');
    }
    lane.mountedHost = null;
    lane.wantPlay = false;
    if (laneId === 'fullscreen') {
      this.resetFirstFrameForLane(lane, 'unmount');
    }
    vperfSessionEnd(laneId, 'unmount');
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
    // [TRACE] engine.load — one line per load() call, before any decisions.
    {
      const openT = traceLookup({ ownerKey: postId, postId: lane.postId });
      trace('engine.load', {
        openId: openT?.openId,
        laneId,
        ownerKeyIn: postId,
        priorPostId: lane.postId,
        priorFirstFrame: lane.firstFrame,
        elId: elIdOf(lane.el),
        hlsInstanceReused: !!lane.hls,
      });
    }
    // Same postId + same URL already loaded → no reload. This makes remount
    // (element moving between card hosts) cheap and avoids re-fetching HLS.
    //
    // OWNER-KEY EQUIVALENCE (scoped): treat a BARE `X` and canonical `X:0`
    // as the SAME primary-media owner. Historically the feed warm-preload
    // wrote bare `post.id` while active playback wrote `${postId}:0`, so
    // this compare missed on promotion → reload → poster flash. The write
    // sites are now canonical, but this defensive normalisation prevents
    // any future caller from reintroducing the bug.
    //
    // HARD CONSTRAINT — bare↔`:0` ONLY. Carousel slides `X:1`, `X:2`, …
    // MUST remain distinct owners; this is NOT "strip everything after the
    // colon". Implementation: if a key has no ':', treat it as `${key}:0`;
    // then compare full strings.
    const normalizeOwnerKey = (k: string | null): string | null =>
      k == null ? null : (k.includes(':') ? k : `${k}:0`);
    const laneOwner = normalizeOwnerKey(lane.postId);
    const callOwner = normalizeOwnerKey(postId);
    const alreadyLoaded =
      laneOwner != null &&
      laneOwner === callOwner &&
      lane.hlsUrl === hlsUrl &&
      lane.state !== 'idle' &&
      lane.state !== 'error';
    if (alreadyLoaded) {
      DBG(laneId, 'skip reload: same postId+url', {
        state: lane.state,
        lanePostId: lane.postId,
        callPostId: postId,
      });

      lane.posterUrl = posterUrl;
      lane.startPosition = startPosition;
      const target = startPosition > 0 ? startPosition : 0;
      const now = lane.el.currentTime || 0;
      const needsResumeSeek = target > 0 && Math.abs(now - target) > 0.35;
      if (needsResumeSeek) {
        // Same source, different desired playhead. A warm skip must still seek
        // before surfaces reveal this lane; otherwise React sees the stale
        // firstFrame=true snapshot for one paint and users get a frame-0/old-
        // frame flash before playback resumes at the intended time.
        lane.firstFrame = false;
        this.emit(lane);
        try { lane.el.currentTime = target; } catch { /* noop */ }
      } else if (lane.el.readyState >= 2) {
        lane.firstFrame = true;
        try { lane.el.removeAttribute('poster'); } catch {}
        this.emit(lane);
      }
      // Signal 'warm' cache hit to any pending autoplay arm — the caller
      // (useRailLane / useWatchAutoplay) checks the returned _warmSkipHit flag.
      (this as any)._lastLoadWasWarmSkip = true;
      return;
    }
    (this as any)._lastLoadWasWarmSkip = false;
    // Session re-point: if a session was running on this lane, close it out
    // before the new source takes over.
    const identityChanged = lane.postId != null && laneOwner !== callOwner;
    if (identityChanged) {
      vperfSessionEnd(laneId, 'load-repoint');
      this.resetFirstFrameForLane(lane, 'load-repoint');
    }


    lane.postId = postId;


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
    // Reset playback position on source change so B doesn't inherit A's time.
    if (startPosition <= 0) {
      try { lane.el.currentTime = 0; } catch { /* noop */ }
    }
    // NOTE: do NOT clear wantPlay here — a mid-load play() intent must persist
    // so the engine can start playback once the new source reaches canplay.

    if (posterUrl) lane.el.poster = posterUrl;

    // Detach any previous per-load listeners.
    lane.detachFns.forEach((fn) => fn());
    lane.detachFns = [];

    const native = isNativeHlsSupported(lane.el);
    const usingNative = native && !Hls.isSupported();
    if (usingNative) {
      // Safari path — no hls.js instance, use the element's native player.
      lane.el.src = hlsUrl;
      {
        const openT = traceLookup({ ownerKey: lane.postId });
        trace('engine.attach', {
          openId: openT?.openId,
          laneId,
          elId: elIdOf(lane.el),
          srcSet: hlsUrl,
          hlsAttached: false,
        });
      }
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
      // Rail lanes get the small-tile cold-start profile (lowest startLevel +
      // capLevelToPlayerSize). Feed-active/fullscreen skip the cap so they
      // render at manifest-appropriate quality for the viewport.
      const isRail = laneId.startsWith('rail-');
      const coldFullscreen = laneId === 'fullscreen';
      // [PREDICT] Part 1 — seed ABR from persisted bandwidth memory for
      // FEED-ACTIVE / FULLSCREEN lanes only. Rails intentionally excluded:
      // their startLevel:0 + capLevelToPlayerSize profile is correct for
      // small tiles and seeding would only cost data on the first tile.
      const seededBw = isRail ? null : readSeededBandwidth();
      (lane as any)._seededBw = seededBw;
      const config: Partial<HlsConfig> = {
        ...HLS_CONFIG,
        ...(isRail ? RAIL_HLS_OVERRIDES : {}),
        ...(coldFullscreen ? { startLevel: 0 } : {}),
        startPosition,
        // hls.js expects bps. When we have a fresh seed, use it; otherwise
        // fall back to the conservative default the engine has always used.
        abrEwmaDefaultEstimate: seededBw ?? 500_000,
        maxStarvationDelay: 4,
        // Cap ABR to policy ceiling
        capLevelOnFPSDrop: true,
      };
      lane.hls = new Hls(config);
      lane.hls.attachMedia(lane.el); // one-time bind for this element's life
      DBG(laneId, 'created hls instance', { seededBw });

    } else {
      // Re-point: stop current load, then load new source. Instance & element stay.
      lane.hls.stopLoad();
    }

    const hls = lane.hls;
    hls.config.startPosition = startPosition;
    hls.loadSource(hlsUrl);
    // [TRACE] engine.attach — source pointed at this lane's element.
    {
      const openT = traceLookup({ ownerKey: lane.postId });
      trace('engine.attach', {
        openId: openT?.openId,
        laneId,
        elId: elIdOf(lane.el),
        srcSet: hlsUrl,
        hlsAttached: true,
      });
    }

    // [COLDOPEN] attach — trace only wires up if this is the 'fullscreen'
    // lane taking the cold path started by openWithOrigin.
    try {
      coldOpenAttach({
        laneId,
        hlsUrl,
        hls,
        el: lane.el,
        cap: typeof hls.autoLevelCapping === 'number' ? hls.autoLevelCapping : null,
        startLevel: hls.config?.startLevel ?? null,
        capReason: laneId.startsWith('rail-') ? 'rail-override' : 'none',
      });
    } catch { /* trace-only */ }

    const onManifest = () => {
      // Enforce ABR ceiling based on manifest levels.
      const cap = ABR_MAX_KBPS * 1000;
      const maxLevel = hls.levels.reduce<number>((best, lvl, idx) => {
        return lvl.bitrate <= cap ? idx : best;
      }, hls.levels.length - 1);
      hls.autoLevelCapping = maxLevel;
      // SOFT-RESET HYGIENE: do NOT promote to 'ready' here. MANIFEST_PARSED
      // fires before any segment is decoded, so element.readyState is still 0
      // — promoting state='ready' now creates a state/readyState decoupling
      // that lets the borrow stateGate lie for the window until loadeddata.
      // Real promotion happens in markReadyToShow (loadeddata/canplay) below.
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


  /**
   * Preload a source into a lane without playing it. Used to warm the
   * next feed card (via the `feed-next` lane) so manifest + first segment
   * are fetched before activation → near-instant play on centering.
   */
  preload(
    laneId: LaneId,
    opts: {
      hlsUrl: string;
      posterUrl?: string | null;
      postId?: string | null;
      /**
       * GUARD: caller asserts this ownerKey currently owns the 'active' role's
       * physical lane. When provided, preload refuses to write if:
       *  (a) `laneId` is the physical lane currently bound to role 'active', or
       *  (b) the active lane's current postId (normalized bare↔`:0`) equals
       *      `expectedActiveOwnerKey` AND the incoming postId differs — i.e.
       *      this write would evict/rebind the known-active binding.
       * When omitted, preload behaves as before (no guard).
       */
      expectedActiveOwnerKey?: string;
    }
  ): void {
    // OwnerKey discipline: bare `X` → canonical `X:0`. Flag so callers can be
    // audited and eventually normalized at the source.
    let postId = opts.postId ?? null;
    if (postId != null && !postId.includes(':')) {
      const from = postId;
      postId = `${postId}:0`;
      try {
        trace('preload.normalized', { laneId, from, to: postId });
      } catch { /* trace-only */ }
    }
    // Active-lane identity guard.
    const norm = (k: string | null): string | null =>
      k == null ? null : (k.includes(':') ? k : `${k}:0`);
    try {
      const activeLaneId = feedLaneRoles.laneForRole('active');
      const activeSnap = this.snapshot(activeLaneId);
      const activeOwner = norm(activeSnap.postId);
      const incomingOwner = norm(postId);
      const expected = opts.expectedActiveOwnerKey ?? null;
      const wouldWriteActiveLane = laneId === activeLaneId;
      const wouldEvictKnownActive =
        expected != null &&
        activeOwner === norm(expected) &&
        incomingOwner !== activeOwner;
      if (wouldWriteActiveLane || wouldEvictKnownActive) {
        try {
          trace('preload.rejected', {
            laneId,
            reason: wouldWriteActiveLane ? 'is-active-lane' : 'would-evict-active',
            incomingOwnerKey: incomingOwner,
            expectedActiveOwnerKey: expected,
            currentActiveLanePostId: activeSnap.postId,
            activeLaneId,
          });
        } catch { /* trace-only */ }
        return;
      }
    } catch (error) {
      if (opts.expectedActiveOwnerKey != null) {
        try {
          trace('preload.rejected', {
            laneId,
            reason: 'guard-check-failed',
            incomingOwnerKey: norm(postId),
            expectedActiveOwnerKey: opts.expectedActiveOwnerKey,
            error: error instanceof Error ? error.message : String(error),
          });
        } catch { /* trace-only */ }
        return;
      }
      /* engine not booted / lane missing with no guarded caller — preserve legacy fall-through */
    }
    this.load(laneId, {
      hlsUrl: opts.hlsUrl,
      posterUrl: opts.posterUrl ?? null,
      startPosition: -1,
      postId,
    });
    // Explicitly ensure the preload lane is paused (its element is in the
    // hidden host — nothing to render — but paused keeps the decoder cool).
    const lane = this.getLane(laneId);
    if (!lane.el.paused) lane.el.pause();
  }

  private wireElementEvents(lane: Lane, _usingHls: boolean) {
    const el = lane.el;
    // Unified "ready to show" gate for BOTH fullscreen (open) and feed-active
    // (close/resume). Only flip firstFrame once the element has actually
    // seeked to (or past) the requested position — preventing frame-0 flash.
    const markReadyToShow = (_source: string) => {
      if (lane.firstFrame) return;
      // PR-A: feed-next / feed-prev added so early-motion can actually
      // reveal moving frames while the card scrolls in (previously the
      // lane played invisibly because firstFrame never flipped).
      if (
        lane.id !== 'fullscreen' &&
        lane.id !== 'feed-active' &&
        lane.id !== 'feed-next' &&
        lane.id !== 'feed-prev' &&
        !lane.id.startsWith('rail-')
      ) return;
      const target = lane.startPosition > 0 ? lane.startPosition : 0;
      const now = lane.el.currentTime || 0;
      // With a seek target, wait until element playhead is at/past target - 0.3s.
      // Without a target (startPosition<=0), any painted frame counts.
      if (target > 0 && now < target - 0.3) return;
      lane.firstFrame = true;
      // Once we have real painted frames, strip the poster attribute so the
      // browser cannot re-composite the poster image on subsequent
      // appendChild re-parents (borrow/return, host swaps). load() re-sets
      // the poster per new source, so future cold-loads still get their
      // pre-paint cover.
      try { lane.el.removeAttribute('poster'); } catch {}
      // [TRACE] engine.firstFrame — REAL frame? videoWidth>0 == real,
      // videoWidth==0 == phantom (stale flag re-emit).
      {
        const openT = traceLookup({ ownerKey: lane.postId });
        trace('engine.firstFrame', {
          openId: openT?.openId,
          laneId: lane.id,
          elId: elIdOf(lane.el),
          currentTime: +(lane.el.currentTime || 0).toFixed(3),
          readyState: lane.el.readyState,
          videoWidth: (lane.el as HTMLVideoElement).videoWidth || 0,
          videoHeight: (lane.el as HTMLVideoElement).videoHeight || 0,
          source: _source,
        });
      }
      // [VPERF] first painted frame — resolves fs.open/autoplay firstFrame arms.
      vperfLaneEvent(lane.id, 'firstFrame');
      // [COLDOPEN] firstFrame — trace only reacts if this lane matches.
      try { coldOpenFirstFrame(lane.id); } catch { /* trace-only */ }
      this.emit(lane);
    };
    const onLoadedData = () => {
      if (this.loadingCount > 0) this.loadingCount--;
      if (lane.state === 'loading') this.transition(lane, 'ready');
      // Do not reveal on loadeddata. WebKit can fire it before a synchronous
      // currentTime reset/seek has visibly committed, which exposes frame 0 or
      // the previous decoded frame for one paint. timeupdate/seeked below are
      // the first safe composited-frame signals.
    };
    const onSeeked = () => {
      vperfLaneEvent(lane.id, 'seeked');
      markReadyToShow('seeked');
    };

    const onTime = () => {
      if (lane.postId) this.lastPos.set(lane.postId, lane.el.currentTime || 0);
      if (!lane.firstFrame) markReadyToShow('timeupdate');
      // Gapless loop for short clips (<15s): native loop leaves a 100-300ms
      // gap on iOS HLS. Preempt the seam by seeking to 0 + play() ourselves.
      const dur = lane.el.duration;
      if (isFinite(dur) && dur > 0 && dur < 15) {
        const remaining = dur - (lane.el.currentTime || 0);
        if (remaining < 0.1) {
          // [VPERF] S7 loop.gap — measure seek-to-0 → next 'playing' event.
          const gapId = vperfNextId(`loop.gap:${lane.id}`);
          vperfStart(gapId, 'loop.gap', { laneId: lane.id, postId: lane.postId });
          vperfSessionSuppressNextStall(lane.id);
          vperfArmLane(lane.id, { spanId: gapId, endOn: 'playing' });
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
      vperfLaneEvent(lane.id, 'playing');
      // Session begins on first sustained playing state.
      const hls = lane.hls;
      const startLevel = hls ? (hls.currentLevel ?? null) : null;
      const bwEstimate =
        hls && (hls as any).bandwidthEstimate ? Math.round((hls as any).bandwidthEstimate) : null;
      vperfSessionStart(lane.id, {
        el: lane.el,
        startLevel,
        bwEstimate,
        // [PREDICT] seededBw — the value fed to abrEwmaDefaultEstimate for
        // this lane's hls instance (null when unavailable / rail lane).
        seededBw: (lane as any)._seededBw ?? null,
        postId: lane.postId,
        engine: hls ? 'hls.js' : 'native',
      });

      this.transition(lane, 'playing');
    };
    const onPause = () => {
      if (lane.state !== 'error') this.transition(lane, 'paused');
      // Only emit sessions for real pauses (not the borrow guard's suppressed pauses).
      if (!lane.el.paused) return;
      vperfSessionEnd(lane.id, 'pause');
    };
    const onWaiting = () => {
      vperfLaneEvent(lane.id, 'waiting');
    };

    const onError = () => {
      this.transition(lane, 'error');
      vperfSessionEnd(lane.id, 'error');
    };
    const onCanPlay = () => {
      vperfLaneEvent(lane.id, 'canplay');
      // Honor persistent play-intent: if play() was called before/while the
      // (new) source was loading, kick it off now that it's ready.
      if (lane.wantPlay && lane.mountedHost && lane.el.paused) {
        const p = lane.el.play();
        if (p && typeof (p as Promise<void>).catch === 'function') {
          (p as Promise<void>).catch(() => { /* autoplay reject — safe */ });
        }
      }
    };
    el.addEventListener('loadeddata', onLoadedData);
    el.addEventListener('canplay', onCanPlay);
    el.addEventListener('seeked', onSeeked);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('waiting', onWaiting);
    el.addEventListener('error', onError);
    lane.detachFns.push(() => {
      el.removeEventListener('loadeddata', onLoadedData);
      el.removeEventListener('canplay', onCanPlay);
      el.removeEventListener('seeked', onSeeked);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('waiting', onWaiting);
      el.removeEventListener('error', onError);
    });

    // [VPERF] hls.js LEVEL_SWITCHED feeds session.levelSwitches / endLevel.
    if (lane.hls) {
      const hls = lane.hls;
      const onLevel = (_evt: unknown, data: any) => {
        const level = typeof data?.level === 'number' ? data.level : -1;
        const bw = (hls as any).bandwidthEstimate ? Math.round((hls as any).bandwidthEstimate) : null;
        vperfSessionLevel(lane.id, level, bw);
      };
      hls.on(Hls.Events.LEVEL_SWITCHED, onLevel);
      lane.detachFns.push(() => hls.off(Hls.Events.LEVEL_SWITCHED, onLevel));
    }
  }


  play(laneId: LaneId, opts: { callerPostId?: string | null; viaViewer?: boolean } = {}): Promise<void> {
    const lane = this.getLane(laneId);
    const caller = opts.callerPostId ?? null;
    // Trace viewer-sourced play so device captures show the path.
    if (opts.viaViewer) {
      DBG(laneId, 'play.viaViewer', { caller, lanePostId: lane.postId });
    }

    // Ownership: the moment a card issues play() it becomes the lane owner.
    // Guarantees pause() owner-guard below can reject stale outgoing cards
    // even if load() hasn't yet updated lane.postId for this caller.
    if (caller != null) {
      // Repoint to a DIFFERENT owner must atomically reset firstFrame — else
      // the reveal gate (firstFrame && laneOwnerMatches && targetReady) can
      // match the NEW postId against the PREVIOUS video's decoded frame and
      // flash prior content under the new identity. Same-owner resume keeps
      // its frame (no regression to instant re-open of the same video).
      const norm = (k: string | null): string | null =>
        k == null ? null : (k.includes(':') ? k : `${k}:0`);
      const laneOwner = norm(lane.postId);
      const callOwner = norm(caller);

      if (lane.postId != null && laneOwner !== callOwner && lane.firstFrame) {
        lane.firstFrame = false;
        DBG(lane.id, 'firstFrame.reset', { reason: 'play.repoint', from: lane.postId, to: caller });
      }
      lane.postId = caller;
    }

    // Persistent intent: set now, honored on mount + on canplay after (re)load.
    lane.wantPlay = true;
    // AUDIO POLICY: on activation, re-consult session store so an earlier
    // unmute carries to the NEXT video (inheritance on activation).
    this.applyAudioPolicy(lane, 'activation');
    logAudio('resume.activate', {
      laneId,
      callerPostId: caller ?? null,
      borrowed: this.borrowedLanes.has(laneId),
      msSinceOpen: msSinceOpen(),
    });
    if (!lane.mountedHost) {
      DBG(laneId, 'play() queued — no mounted host');
      return Promise.resolve();
    }
    const p = lane.el.play();
    return Promise.resolve(p).catch((err) => {
      DBG(laneId, 'play() rejected', err);
      // Unmuted-rejection fallback for 'session' lanes: WebKit rejects
      // unmuted autoplay in cold contexts. Degrade THIS lane to muted so
      // playback continues, and signal the pill layer. Do NOT touch the
      // session store — the pill's tap re-asserts unmute with a gesture.
      if (!lane.el.muted && lane.audioPolicy === 'session') {
        lane.el.muted = true;
        const p2 = lane.el.play();
        Promise.resolve(p2).catch(() => { /* muted retry rejected — safe */ });
        this.emitAutoplayBlocked(lane.id);
        return;
      }
      // Belt-and-braces retry: muted lanes rarely reject, but one deferred
      // retry removes the stuck-paused edge case where an autoplay-policy
      // rejection would otherwise leave wantPlay=true with no recovery.
      setTimeout(() => {
        const cur = this.getLane(laneId);
        if (!cur.wantPlay || !cur.mountedHost || !cur.el.paused) return;
        try {
          const p2 = cur.el.play();
          Promise.resolve(p2).catch(() => { /* retry rejected — safe */ });
        } catch {}
      }, 250);
    });
  }

  /**
   * Capture the element's LIVE currentTime → lastPos for the lane's current
   * owner, synchronously. Safe to call any time; never gated. Used to:
   *  - freeze lastPos at the true scroll-out position on pause/unbind
   *    (timeupdate is throttled and stops at pause, so it would otherwise
   *    be stale by up to seconds under iOS scroll load), and
   *  - keep the emitted snapshot's currentTime in sync so subscribers
   *    (InlineVideo) see the true value on the next render.
   */
  captureLastPos(laneId: LaneId): void {
    const lane = this.lanes.get(laneId);
    if (!lane || !lane.postId) return;
    const t = lane.el.currentTime;
    if (typeof t === 'number' && isFinite(t) && t >= 0) {
      this.lastPos.set(lane.postId, t);
      this.emit(lane);
    }
  }

  pause(laneId: LaneId, opts: { callerPostId?: string | null; viaViewer?: boolean } = {}): void {
    const lane = this.getLane(laneId);
    // GUARD (paused-frame accuracy): capture the TRUE currentTime BEFORE any
    // early-return below. The borrow/owner guards correctly refuse to PAUSE
    // a borrowed or handed-off lane, but the true position is always worth
    // recording — capturing is side-effect-free and prevents stale lastPos
    // from surviving into resume. Only the pause ACTION is guarded.
    this.captureLastPos(laneId);
    const caller = opts.callerPostId ?? null;
    // Trace viewer-sourced pause so device captures show the path.
    if (opts.viaViewer) {
      DBG(laneId, 'pause.viaViewer', { caller, lanePostId: lane.postId });
    }
    // BORROW GUARD (Stage-7 PR-1 fix): while a lane is borrowed by the
    // fullscreen viewer, ignore owner-caller pauses — the ex-owner tile is
    // no longer driving playback. Null-caller engine-wide pauses (pauseAll,
    // document.hidden) MUST still pause borrowed lanes. viewer-sourced pauses
    // (viaViewer:true) also bypass the swallow — that's the scrubber's own
    // control acting on the borrowed lane.
    if (this.borrowedLanes.has(laneId) && caller != null && !opts.viaViewer) {
      // PERMANENT REGRESSION TRIPWIRE — do not remove.
      DBG('pause.borrowed', { laneId, caller, lanePostId: lane.postId });
      return;
    }
    // OWNER GUARD: only the current lane owner may pause it. Stale outgoing
    // cards (caller != lane.postId) must NOT pause the incoming card that
    // already took the lane. Null caller = engine-wide (pauseAll/visibility/
    // release) — always allowed. Normalize both sides so bare postId ≡
    // `${postId}:0` (matches the play() normalisation above; the strict !==
    // trap that bit detectRoleForMatch is disarmed here for all callers).
    const normPause = (k: string | null): string | null =>
      k == null ? null : (k.includes(':') ? k : `${k}:0`);
    if (caller != null && lane.postId != null && normPause(caller) !== normPause(lane.postId)) {
      return;
    }
    lane.wantPlay = false;
    if (!lane.el.paused) lane.el.pause();
  }



  pauseAll(): void {
    this.lanes.forEach((lane) => {
      // Capture true currentTime → lastPos before pausing (see pause()).
      if (lane.postId) {
        const t = lane.el.currentTime;
        if (typeof t === 'number' && isFinite(t) && t >= 0) {
          this.lastPos.set(lane.postId, t);
        }
      }
      lane.wantPlay = false;
      if (!lane.el.paused) lane.el.pause();
      this.emit(lane);
    });
  }




  seek(laneId: LaneId, seconds: number): void {
    const lane = this.getLane(laneId);
    // [VPERF] S6 seek — measure engine.seek() → next 'playing' event.
    // Also suppress the session's stall counter for the resulting waiting→
    // playing pair (that latency belongs to this seek, not to rebuffering).
    const seekId = vperfNextId(`seek:${lane.id}`);
    vperfStart(seekId, 'seek', { laneId: lane.id, postId: lane.postId, target: seconds });
    vperfSessionSuppressNextStall(lane.id);
    vperfArmLane(lane.id, { spanId: seekId, endOn: 'seeked', phase: 'seeked' });
    vperfArmLane(lane.id, { spanId: seekId, endOn: 'playing' });
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
    const enforcedOn: LaneId[] = [];
    logAudio('setMuted.enter', { laneId, desired: muted, msSinceOpen: msSinceOpen() });
    if (!muted && ONE_UNMUTED_LANE) {
      // Enforce: mute every other lane first.
      this.lanes.forEach((other) => {
        if (other.id !== laneId) {
          if (!other.el.muted) enforcedOn.push(other.id);
          other.el.muted = true;
        }
      });
    }
    lane.el.muted = muted;
    this.emit(lane);
    logAudio('setMuted.exit', {
      laneId, desired: muted, oneUnmutedEnforcedOn: enforcedOn,
    });
  }


  /** Set object-fit on the lane's <video> element. */
  setObjectFit(laneId: LaneId, fit: 'cover' | 'contain'): void {
    this.getLane(laneId).el.style.objectFit = fit;
  }

  /**
   * Return the intrinsic video aspect ratio (width / height) for a lane, or
   * null when unknown (metadata not yet loaded). Used by the fs.open borrow
   * path to skip the fit-swap crossfade entirely when the video aspect
   * matches the viewport aspect (no letterbox → nothing to fade to).
   */
  getLaneAspect(laneId: LaneId): number | null {
    const lane = this.lanes.get(laneId);
    if (!lane) return null;
    const w = (lane.el as HTMLVideoElement).videoWidth;
    const h = (lane.el as HTMLVideoElement).videoHeight;
    if (!w || !h) return null;
    return w / h;
  }

  /**
   * Nudge hls.js to re-evaluate the ABR level cap. Used after borrow-mounts
   * so rail lanes (whose capLevelToPlayerSize was sized against the tile)
   * upshift now that the element occupies the viewport. Safe no-op for
   * non-hls (native HLS) lanes.
   */
  nudgeLevelCap(laneId: LaneId): void {
    const lane = this.lanes.get(laneId);
    if (!lane || !lane.hls) return;
    try {
      lane.hls.autoLevelCapping = -1;
      // Trigger a level check on next tick — hls.js re-evaluates
      // capLevelToPlayerSize inside its level controller.
      lane.hls.nextLevel = lane.hls.nextLevel;
    } catch {}
  }

  /** Release the current source but keep the element+instance for reuse. */
  release(laneId: LaneId): void {
    const lane = this.getLane(laneId);
    vperfSessionEnd(laneId, 'release');
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
    this.resetFirstFrameForLane(lane, 'release');
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
      postId: lane.postId,
    };
  }

  /** Debug-only: return the underlying media element for a lane. Used by
   * AudioDebugHud (FLAGS.audioDebug) to attach volumechange/play/pause
   * listeners without pushing engine-side changes into every consumer. */
  _debugGetElement(laneId: LaneId): HTMLMediaElement | null {
    try { return this.getLane(laneId).el; } catch { return null; }
  }


  /**
   * Live-read directly from the underlying element (no cached state). Used by
   * openWithOrigin at bind time to re-validate a borrow candidate immediately
   * before committing — catches post-decision drops (rebind/HLS reattach) that
   * a prior snapshot read would miss.
   */
  isLivePlayable(laneId: LaneId): {
    playable: boolean;
    readyState: number;
    currentTime: number;
    paused: boolean;
  } {
    const lane = this.getLane(laneId);
    const el = lane.el;
    const readyState = el.readyState;
    const currentTime = el.currentTime || 0;
    const paused = el.paused;
    const playable = readyState >= 2 && currentTime > 0 && !paused;
    return { playable, readyState, currentTime, paused };
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

  /** Read the last known playback position for a post (session-scoped).
   * Shape fallback: if the exact key misses and the caller passed a bare
   * postId (no ':'), try the ownerKey-form `${postId}:0`. Single-media
   * feed posts are now keyed :0-form by InlineVideo; without this fallback,
   * bare readers (FullscreenVideoSlot storedStart, openWithOrigin's lastPos
   * ladder) silently restart at 0. Read-side only — no write-path change. */
  getLastPos(postId: string | null | undefined): number {
    if (!postId) return 0;
    const exact = this.lastPos.get(postId);
    if (exact != null) return exact;
    if (!postId.includes(':')) {
      const zero = this.lastPos.get(`${postId}:0`);
      if (zero != null) return zero;
    }
    return 0;
  }




  /** Test-only utility: list lane ids currently registered. */
  listLanes(): LaneId[] {
    return Array.from(this.lanes.keys());
  }

  /** [PREDICT] Prefetch gating: true when any lane is currently loading a
   *  manifest / segments — the PrefetchController must never compete with
   *  an active fetch on the critical path. */
  isAnyLaneLoading(): boolean {
    for (const lane of this.lanes.values()) {
      if (lane.state === 'loading') return true;
    }
    return false;
  }

}

export const VideoEngine = new VideoEngineImpl();
export type { LaneId } from './lanePolicy';

// LIVE SUBSCRIPTION: reflect session audio flips onto every 'session' lane.
// - Mute: every session lane is silenced.
// - Unmute: only session lanes with active play-intent (wantPlay) are
//   unmuted. ONE_UNMUTED_LANE exclusivity still enforces a single voice.
useSessionAudio.subscribe(({ isMuted }) => {
  const impl = VideoEngine as unknown as {
    lanes: Map<LaneId, Lane>;
    setMuted: (id: LaneId, m: boolean) => void;
  };
  impl.lanes.forEach((lane) => {
    if (lane.audioPolicy !== 'session') return;
    if (isMuted) {
      if (!lane.el.muted) impl.setMuted(lane.id, true);
    } else if (lane.wantPlay) {
      if (lane.el.muted) impl.setMuted(lane.id, false);
    }
  });
});
