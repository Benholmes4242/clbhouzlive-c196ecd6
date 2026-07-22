/**
 * AudioBroker — single source of truth for which pooled <video> element is
 * allowed to be unmuted.
 *
 * Phase 2 of the video hardening plan. All VideoSlot instances register here;
 * the broker subscribes to the session mute store and fullscreen feed store,
 * then writes `video.muted = true/false` directly on the resolved speaker.
 *
 * Resolution rules (in priority order):
 *   1. Session muted → every registered element is muted.
 *   2. Fullscreen viewer open → the fullscreen-session slot with focus wins.
 *   3. Otherwise → the most-recently-focused inline-session slot wins.
 *   4. always-muted slots never speak.
 */

import { useSessionAudio } from '@/audio/sessionAudioStore';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { videoDebug } from '@/config/videoDebug';
import { logAudio } from '@/perf/audioDebug';

export type AudioPolicy = 'inline-session' | 'fullscreen-session' | 'always-muted';

interface AudioRegistration {
  slotKey: string;
  video: HTMLVideoElement;
  policy: AudioPolicy;
  wantsFocus: boolean;
  lastFocusAt: number;
}

class AudioBrokerImpl {
  private regs = new Map<string, AudioRegistration>();
  private manualRegs = new Map<string, AudioRegistration>(); // non-VideoSlot speakers (e.g. VideoEngine)
  private sessionUnsub: (() => void) | null = null;
  private fsUnsub: (() => void) | null = null;
  private initialized = false;

  private ensureInit() {
    if (this.initialized || typeof window === 'undefined') return;
    this.sessionUnsub = useSessionAudio.subscribe(() => this.reconcile('session-change'));
    this.fsUnsub = useFullscreenFeedStore.subscribe(() => this.reconcile('overlay-change'));
    this.initialized = true;
  }

  register(slotKey: string, video: HTMLVideoElement, policy: AudioPolicy = 'inline-session') {
    this.ensureInit();
    const existing = this.regs.get(slotKey);
    const reg: AudioRegistration = {
      slotKey,
      video,
      policy,
      wantsFocus: existing?.wantsFocus ?? false,
      lastFocusAt: existing?.lastFocusAt ?? 0,
    };
    this.regs.set(slotKey, reg);
    videoDebug('audio', 'register', { slotKey, policy });
    this.reconcile('register');
  }

  unregister(slotKey: string) {
    if (!this.regs.has(slotKey)) return;
    this.regs.delete(slotKey);
    videoDebug('audio', 'unregister', { slotKey });
    this.reconcile('unregister');
  }

  setPolicy(slotKey: string, policy: AudioPolicy) {
    const reg = this.regs.get(slotKey);
    if (!reg || reg.policy === policy) return;
    reg.policy = policy;
    videoDebug('audio', 'setPolicy', { slotKey, policy });
    this.reconcile('policy-change');
  }

  claimFocus(slotKey: string) {
    const reg = this.regs.get(slotKey);
    if (!reg) return;
    const now = performance.now();
    if (!reg.wantsFocus || reg.lastFocusAt !== now) {
      reg.wantsFocus = true;
      reg.lastFocusAt = now;
      videoDebug('audio', 'claimFocus', { slotKey, policy: reg.policy });
      this.reconcile('focus-claim');
    }
  }

  releaseFocus(slotKey: string) {
    const reg = this.regs.get(slotKey);
    if (!reg || !reg.wantsFocus) return;
    reg.wantsFocus = false;
    videoDebug('audio', 'releaseFocus', { slotKey });
    this.reconcile('focus-release');
  }

  /** Manual speakers for legacy engine lanes (e.g. VideoEngine fullscreen). */
  registerManual(slotKey: string, video: HTMLVideoElement, policy: AudioPolicy = 'fullscreen-session') {
    this.ensureInit();
    this.manualRegs.set(slotKey, {
      slotKey,
      video,
      policy,
      wantsFocus: false,
      lastFocusAt: 0,
    });
    videoDebug('audio', 'registerManual', { slotKey, policy });
    this.reconcile('register-manual');
  }

  unregisterManual(slotKey: string) {
    if (!this.manualRegs.has(slotKey)) return;
    this.manualRegs.delete(slotKey);
    videoDebug('audio', 'unregisterManual', { slotKey });
    this.reconcile('unregister-manual');
  }

  claimManualFocus(slotKey: string) {
    const reg = this.manualRegs.get(slotKey);
    if (!reg) return;
    reg.wantsFocus = true;
    reg.lastFocusAt = performance.now();
    videoDebug('audio', 'claimManualFocus', { slotKey, policy: reg.policy });
    this.reconcile('focus-claim-manual');
  }

  releaseManualFocus(slotKey: string) {
    const reg = this.manualRegs.get(slotKey);
    if (!reg || !reg.wantsFocus) return;
    reg.wantsFocus = false;
    videoDebug('audio', 'releaseManualFocus', { slotKey });
    this.reconcile('focus-release-manual');
  }

  private reconcile(reason: string) {
    const sessionMuted = useSessionAudio.getState().isMuted;

    let speaker: AudioRegistration | null = null;
    let branch: 'session-muted' | 'fullscreen' | 'inline' | 'none' = 'none';
    let whyNone: string | null = null;

    if (sessionMuted) {
      branch = 'none';
      whyNone = 'session-muted';
    } else {
      // Fullscreen-session speakers (Clubhouse viewer, profile viewer,
      // manual engine lanes) always outrank inline sessions.
      const fsCandidates = [
        ...Array.from(this.regs.values()),
        ...Array.from(this.manualRegs.values()),
      ].filter((r) => r.policy === 'fullscreen-session' && r.wantsFocus);
      if (fsCandidates.length > 0) {
        speaker = fsCandidates.sort((a, b) => b.lastFocusAt - a.lastFocusAt)[0];
        branch = 'fullscreen';
      } else {
        const inlineCandidates = Array.from(this.regs.values()).filter(
          (r) => r.policy === 'inline-session' && r.wantsFocus
        );
        if (inlineCandidates.length === 0) {
          branch = 'none';
          whyNone = 'no-inline-focus';
        } else {
          speaker = inlineCandidates.sort((a, b) => b.lastFocusAt - a.lastFocusAt)[0];
          branch = 'inline';
        }
      }
    }

    const writes: Array<{ slotKey: string; from: boolean; to: boolean; manual: boolean }> = [];
    const allRegs = new Map([...this.regs, ...this.manualRegs]);
    allRegs.forEach((reg) => {
      const desiredMuted = reg.policy === 'always-muted' || reg !== speaker;
      const actualMuted = reg.video.muted;
      if (actualMuted !== desiredMuted) {
        writes.push({ slotKey: reg.slotKey, from: actualMuted, to: desiredMuted, manual: !!this.manualRegs.has(reg.slotKey) });
      }
    });

    logAudio('broker.decision', {
      reason,
      sessionMuted,
      fsOpen,
      branch,
      whyNone,
      speaker: speaker?.slotKey ?? null,
      registrations: Array.from(allRegs.values()).map((r) => ({
        slotKey: r.slotKey,
        policy: r.policy,
        wantsFocus: r.wantsFocus,
        lastFocusAt: Math.round(r.lastFocusAt),
        currentMuted: r.video.muted,
        manual: !!this.manualRegs.has(r.slotKey),
      })),
      writes,
    });

    if (writes.length === 0) {
      videoDebug('audio', 'reconcile noop', { reason, branch, speaker: speaker?.slotKey ?? null });
      return;
    }

    // Mute non-speakers first, then unmute speaker — preserves the invariant
    // that at most one element is unmuted at any instant.
    writes.forEach((w) => {
      if (w.to) {
        const reg = allRegs.get(w.slotKey);
        if (reg) reg.video.muted = true;
      }
    });
    writes.forEach((w) => {
      if (!w.to) {
        const reg = allRegs.get(w.slotKey);
        if (reg) reg.video.muted = false;
      }
    });

    videoDebug('audio', 'reconcile applied', {
      reason,
      branch,
      speaker: speaker?.slotKey ?? null,
      writes,
    });
  }

  getSummary() {
    const allRegs = new Map([...this.regs, ...this.manualRegs]);
    return {
      count: allRegs.size,
      speaker: Array.from(allRegs.values()).find(
        (r) => !r.video.muted && r.policy !== 'always-muted'
      )?.slotKey ?? null,
    };
  }
}

export const AudioBroker = new AudioBrokerImpl();
