import React, { createContext, useContext, useState, useEffect } from 'react';

type MyJourneyPreset = 'real' | 'none' | '5' | '20' | '50' | '100' | '200';
type FriendsPreset = 'real' | 'none' | 'low' | 'mid' | 'high';

type Top100DebugState = {
  enabled: boolean;
  myPreset: MyJourneyPreset;
  friendsPreset: FriendsPreset;
};

type Top100DebugContextValue = {
  state: Top100DebugState;
  setState: (next: Top100DebugState) => void;
};

const Top100DebugContext = createContext<Top100DebugContextValue | undefined>(
  undefined
);

const STORAGE_KEY = 'top100-debug-state';

export const Top100DebugProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setStateInternal] = useState<Top100DebugState>({
    enabled: false,
    myPreset: 'real',
    friendsPreset: 'real',
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setStateInternal((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, []);

  const setState = (next: Top100DebugState) => {
    setStateInternal(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  return (
    <Top100DebugContext.Provider value={{ state, setState }}>
      {children}
    </Top100DebugContext.Provider>
  );
};

export const useTop100Debug = () => {
  const ctx = useContext(Top100DebugContext);
  if (!ctx) {
    throw new Error('useTop100Debug must be used within Top100DebugProvider');
  }
  return ctx;
};
