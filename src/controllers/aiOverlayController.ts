// Central, framework-agnostic controller for AIChatOverlay
export type AITab = 'chat' | 'swing' | 'logs';

type OverlayListener = (open: boolean, tab: AITab) => void;

let listeners: Array<OverlayListener> = [];

export function openAIOverlay(tab: AITab = 'chat') {
  listeners.forEach(l => l(true, tab));
}

export function closeAIOverlay() {
  listeners.forEach(l => l(false, 'chat'));
}

// overlay registers once on mount
export function subscribeAIOverlay(fn: OverlayListener) {
  listeners.push(fn);
  return () => { 
    listeners = listeners.filter(x => x !== fn); 
  };
}