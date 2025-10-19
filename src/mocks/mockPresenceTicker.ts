import { MOCK_CREATORS } from './live_clubhouse';

export function startMockPresence(onUpdate: (onlineMap: Record<string, boolean>) => void) {
  // seed random online states
  const online: Record<string, boolean> = {};
  MOCK_CREATORS.forEach(c => { online[c.id] = Math.random() < 0.5; });
  onUpdate({ ...online });

  const interval = setInterval(() => {
    // flip a few users randomly to simulate activity
    const flips = Math.max(2, Math.floor(Math.random() * 4));
    for (let i = 0; i < flips; i++) {
      const idx = Math.floor(Math.random() * MOCK_CREATORS.length);
      const id = MOCK_CREATORS[idx].id;
      online[id] = !online[id];
    }
    onUpdate({ ...online });
  }, 1500); // ~≤2s update window

  return () => clearInterval(interval);
}
