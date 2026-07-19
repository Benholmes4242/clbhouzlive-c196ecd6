/**
 * VideoSlot — single-owner <video>. If the store's openId matches a
 * pre-warmed element (the one created inside the tap handler to claim
 * the iOS gesture token — see audioContract.ts), adopt it. Otherwise
 * mount a fresh element and attach.
 *
 * Poster-first: shown until first frame paints, then crossfaded away.
 * The mute button lives in Chrome; this component subscribes to the
 * session-audio store and pushes `el.muted` down.
 */

import React, { useEffect, useRef, useState } from 'react';

import { useSessionAudio } from '@/audio/sessionAudioStore';

import { FSV2 } from '../tokens';
import { attach, withBandwidthHint, type Fsv2Source } from '../player/fsv2Player';
import { takePreWarmed, dropPreWarmed } from '../player/audioContract';
import { traceReveal, hudEvent } from '../perf/trace';
import { registerVideoEl } from '../debug/hudBus';
import { WATCHDOG_MS, armWatchdog } from './Watchdogs';
import { Fsv2TapForSoundPill } from './TapForSoundPill';

const TRACK_WATCHDOG_MS = 1200;
const TRACK_RECOVERY_LIMIT = 1;

function totalVideoFrames(el: HTMLVideoElement): number {
  try {
    const q = (el as HTMLVideoElement & { getVideoPlaybackQuality?: () => { totalVideoFrames: number } })
      .getVideoPlaybackQuality?.();
    return q?.totalVideoFrames ?? 0;
  } catch { return 0; }
}

function instrumentElement(openId: string, el: HTMLVideoElement, tag: string) {
  hudEvent(openId, `el.adopt.${tag}`, {
    parent: el.parentElement?.tagName,
    hasSrc: !!el.src,
    muted: el.muted,
    readyState: el.readyState,
  });
  const evs = ['loadstart', 'loadedmetadata', 'canplay', 'playing', 'pause', 'stalled', 'waiting', 'error', 'ended', 'emptied'];
  const handlers: Array<[string, EventListener]> = [];
  let tuCount = 0;
  for (const name of evs) {
    const h: EventListener = () => {
      const p: Record<string, unknown> = {};
      if (name === 'loadedmetadata') { p.vw = el.videoWidth; p.vh = el.videoHeight; }
      if (name === 'error') { p.code = el.error?.code; p.msg = el.error?.message; }
      if (name === 'canplay' || name === 'playing') p.rs = el.readyState;
      hudEvent(openId, `el.${name}`, p);
    };
    el.addEventListener(name, h);
    handlers.push([name, h]);
  }
  const tuH: EventListener = () => {
    if (tuCount < 3) {
      hudEvent(openId, 'el.timeupdate', { t: +el.currentTime.toFixed(3), n: tuCount });
      tuCount++;
    }
  };
  el.addEventListener('timeupdate', tuH);
  handlers.push(['timeupdate', tuH]);
  return () => { for (const [n, h] of handlers) el.removeEventListener(n, h); };
}

interface Props {
  source: Fsv2Source;
  posterUrl?: string | null;
  active: boolean;
  openId: string;
  startPosition?: number;
  onFirstReveal?: () => void;
  safeAreaBottom: number;
}

export const Fsv2VideoSlot: React.FC<Props> = ({
  source,
  posterUrl,
  active,
  openId,
  startPosition,
  onFirstReveal,
  safeAreaBottom,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const elRef = useRef<HTMLVideoElement | null>(null);
  const detachRef = useRef<(() => void) | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [needsTapForSound, setNeedsTapForSound] = useState(false);
  const revealedRef = useRef(false);

  const reveal = (reason: 'first-frame' | 'forced') => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    setRevealed(true);
    traceReveal(openId, { kind: 'video', reason });
    onFirstReveal?.();
  };

  // Mount — adopt pre-warmed element if present.
  useEffect(() => {
    if (!active) return;
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    const isMuted = useSessionAudio.getState().isMuted;

    const preWarmed = takePreWarmed(openId);
    if (preWarmed) {
      // Adopt: move the element from the hidden staging area into the
      // host. It's already playing — we just need to style it in.
      const el = preWarmed.el;
      el.removeAttribute('data-fsv2-prewarm');
      el.style.position = 'absolute';
      el.style.inset = '0';
      el.style.width = '100%';
      el.style.height = '100%';
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      el.style.zIndex = '';
      el.style.top = '';
      el.style.left = '';
      el.style.objectFit = 'contain';
      el.style.background = FSV2.BACKDROP;
      el.style.transition = `opacity ${FSV2.VIDEO_CROSSFADE_MS}ms ease`;
      host.appendChild(el);
      elRef.current = el;
      detachRef.current = preWarmed.detach;
      if (preWarmed.needsTapForSound) setNeedsTapForSound(true);
      const detachInstr = instrumentElement(openId, el, 'prewarmed');
      registerVideoEl(openId, el);

      const onFrame = () => reveal('first-frame');
      el.addEventListener('loadeddata', onFrame);
      el.addEventListener('playing', onFrame);
      // If it's already past first frame, reveal immediately.
      if (el.readyState >= 2) onFrame();

      return () => {
        el.removeEventListener('loadeddata', onFrame);
        el.removeEventListener('playing', onFrame);
        detachInstr();
        registerVideoEl(openId, null);
        detachRef.current?.();
        detachRef.current = null;
        elRef.current = null;
        try { el.remove(); } catch { /* ignore */ }
      };
    }

    // No pre-warm — fresh element (non-active slides, or image opens
    // that later pager to a video).
    const el = document.createElement('video');
    el.playsInline = true;
    el.setAttribute('playsinline', 'true');
    el.setAttribute('webkit-playsinline', 'true');
    el.style.position = 'absolute';
    el.style.inset = '0';
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.objectFit = 'contain';
    el.style.background = FSV2.BACKDROP;
    el.style.opacity = '0';
    el.style.transition = `opacity ${FSV2.VIDEO_CROSSFADE_MS}ms ease`;
    host.appendChild(el);
    elRef.current = el;
    const detachInstr = instrumentElement(openId, el, 'fresh');
    registerVideoEl(openId, el);

    const onFrame = () => reveal('first-frame');
    el.addEventListener('loadeddata', onFrame);
    el.addEventListener('playing', onFrame);

    hudEvent(openId, 'src.set', { hlsUrl: !!source.hlsUrl, mp4Url: !!source.mp4Url });
    attach(el, source, { muted: isMuted, startPosition }).then((handle) => {
      if (cancelled) { handle.detach(); return; }
      detachRef.current = handle.detach;
      const p = el.play();
      if (p?.catch) {
        p.catch(() => {
          if (!el.muted) {
            el.muted = true;
            setNeedsTapForSound(true);
            try { el.play().catch(() => { /* ignore */ }); } catch { /* ignore */ }
          }
        });
      }
    }).catch(() => { /* attach failure — watchdog will force reveal */ });

    return () => {
      cancelled = true;
      el.removeEventListener('loadeddata', onFrame);
      el.removeEventListener('playing', onFrame);
      detachInstr();
      registerVideoEl(openId, null);
      detachRef.current?.();
      detachRef.current = null;
      elRef.current = null;
      try { el.remove(); } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, openId]);

  // Cleanup pre-warm registry if we never mounted for this openId.
  useEffect(() => {
    return () => dropPreWarmed(openId);
  }, [openId]);

  // Apply reveal opacity.
  useEffect(() => {
    const el = elRef.current;
    if (el) el.style.opacity = revealed ? '1' : '0';
  }, [revealed]);

  // Session-audio -> element (both directions live).
  useEffect(() => {
    const unsub = useSessionAudio.subscribe((state) => {
      const el = elRef.current;
      if (!el) return;
      el.muted = state.isMuted;
      if (!state.isMuted) setNeedsTapForSound(false);
    });
    return unsub;
  }, []);

  // Tap = pause/play toggle.
  const onTap = () => {
    const el = elRef.current;
    if (!el) return;
    if (el.paused) {
      const p = el.play();
      p?.catch?.(() => { /* ignore */ });
    } else {
      el.pause();
    }
  };

  // Watchdog on first-frame.
  useEffect(() => {
    if (!active || revealedRef.current) return;
    const cancel = armWatchdog(
      openId,
      'video-first-frame-timeout',
      WATCHDOG_MS.VIDEO_FIRST_FRAME,
      () => reveal('forced'),
    );
    return cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, openId]);

  // Video-track watchdog — iOS may lock onto Cloudflare's audio-only
  // variant if the src was set while the element was parked/detached.
  // Force one recovery cycle if playback has advanced no frames after
  // TRACK_WATCHDOG_MS of active playback.
  useEffect(() => {
    if (!active) return;
    let recoveries = 0;
    let cancelled = false;
    const t = setTimeout(async () => {
      if (cancelled) return;
      const el = elRef.current;
      if (!el || el.paused) return;
      if (totalVideoFrames(el) > 0) return;
      if (recoveries >= TRACK_RECOVERY_LIMIT) {
        hudEvent(openId, 'videoTrack.recovery.exhausted', { recoveries });
        return;
      }
      recoveries++;
      const at = el.currentTime;
      const wasMuted = el.muted;
      const hinted = source.hlsUrl ? withBandwidthHint(source.hlsUrl) : source.mp4Url ?? '';
      try {
        try { detachRef.current?.(); } catch { /* ignore */ }
        detachRef.current = null;
        el.removeAttribute('src');
        el.load();
        const handle = await attach(el, { hlsUrl: source.hlsUrl, mp4Url: source.mp4Url }, {
          muted: wasMuted,
          startPosition: at,
        });
        if (cancelled) { handle.detach(); return; }
        detachRef.current = handle.detach;
        try { el.currentTime = at; } catch { /* ignore */ }
        try { await el.play(); } catch { /* ignore */ }
        hudEvent(openId, 'videoTrack.recovered', { atMs: Math.round(at * 1000), hinted: !!hinted });
      } catch { /* swallow */ }
    }, TRACK_WATCHDOG_MS);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, openId]);

  return (
    <div
      onClick={onTap}
      style={{
        position: 'absolute',
        inset: 0,
        background: FSV2.BACKDROP,
        cursor: 'pointer',
      }}
    >
      {posterUrl && !revealed ? (
        <img
          src={posterUrl}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: 1,
            transition: `opacity ${FSV2.VIDEO_CROSSFADE_MS}ms ease`,
          }}
        />
      ) : null}
      <div ref={hostRef} style={{ position: 'absolute', inset: 0 }} />

      {needsTapForSound ? (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: safeAreaBottom + 96,
            zIndex: 4,
          }}
        >
          <Fsv2TapForSoundPill
            onClick={() => {
              useSessionAudio.getState().setMuted(false);
              const el = elRef.current;
              if (el) {
                el.muted = false;
                const p = el.play();
                p?.catch?.(() => { /* ignore */ });
              }
              setNeedsTapForSound(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
};
