import { create } from 'zustand';

const KEY = 'clbhouz-audio-muted';
const LEGACY_KEY = 'clbhouz-feed-muted';

function initialMuted(): boolean {
  try {
    const v = sessionStorage.getItem(KEY);
    if (v !== null) return JSON.parse(v);
    const legacy = sessionStorage.getItem(LEGACY_KEY);
    if (legacy !== null) {
      // one-time migration
      sessionStorage.setItem(KEY, legacy);
      sessionStorage.removeItem(LEGACY_KEY);
      return JSON.parse(legacy);
    }
  } catch {}
  return true; // sessions start muted
}

let lastUnmuteGestureTs = 0;
export const getLastUnmuteGestureTs = () => lastUnmuteGestureTs;

interface SessionAudioState {
  isMuted: boolean;
  setMuted: (v: boolean) => void;
  mute: () => void;
  unmute: () => void;
  toggle: () => void;
}

export const useSessionAudio = create<SessionAudioState>((set, get) => ({
  isMuted: initialMuted(),
  setMuted: (v) => {
    if (!v) lastUnmuteGestureTs = Date.now(); // unmutes only happen in gestures
    try { sessionStorage.setItem(KEY, JSON.stringify(v)); } catch {}
    set({ isMuted: v });
  },
  mute: () => get().setMuted(true),
  unmute: () => get().setMuted(false),
  toggle: () => get().setMuted(!get().isMuted),
}));
