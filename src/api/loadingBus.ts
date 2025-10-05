type Listener = (delta: 1 | -1) => void;
const listeners = new Set<Listener>();

export const loadingBus = {
  begin: () => listeners.forEach(l => l(1)),
  end:   () => listeners.forEach(l => l(-1)),
  subscribe: (fn: Listener) => { 
    listeners.add(fn); 
    return () => { 
      listeners.delete(fn); 
    }; 
  }
};
