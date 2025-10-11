import React, { createContext, useContext, useMemo, useRef, useState, useEffect } from 'react';

type RowKey = number;
type CardId = string;

type Ctx = {
  cols: number;
  getRow: (index: number) => RowKey;
  canPlay: (row: RowKey, candidate: CardId) => boolean;
  claim: (row: RowKey, card: CardId) => void;
  release: (row: RowKey, card: CardId) => void;
};

function useResponsiveCols() {
  const getColumns = () => {
    if (window.matchMedia('(min-width: 1280px)').matches) return 5;
    if (window.matchMedia('(min-width: 768px)').matches) return 4;
    return 3;
  };

  const [cols, setCols] = useState(getColumns);

  useEffect(() => {
    const handler = () => setCols(getColumns());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return cols;
}

const RowCtx = createContext<Ctx | null>(null);

export const RowAutoplayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cols = useResponsiveCols();
  const rowLeaders = useRef<Map<RowKey, CardId>>(new Map());

  const api = useMemo<Ctx>(() => ({
    cols,
    getRow: (index) => Math.floor(index / cols),
    canPlay: (row, candidate) => rowLeaders.current.get(row) === candidate,
    claim: (row, card) => {
      if (!rowLeaders.current.has(row)) {
        rowLeaders.current.set(row, card);
      }
    },
    release: (row, card) => {
      if (rowLeaders.current.get(row) === card) {
        rowLeaders.current.delete(row);
      }
    }
  }), [cols]);

  return <RowCtx.Provider value={api}>{children}</RowCtx.Provider>;
};

export function useRowAutoplay() {
  const ctx = useContext(RowCtx);
  if (!ctx) throw new Error('useRowAutoplay must be used within RowAutoplayProvider');
  return ctx;
}
