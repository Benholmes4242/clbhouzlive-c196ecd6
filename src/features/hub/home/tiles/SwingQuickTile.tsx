/**
 * Swing Coach Quick Upload Tile
 * Compact tile balanced with Echo
 */

import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile } from '../components/Tile';
import { ViewAllPill } from '../components/ViewAllPill';

export function SwingQuickTile() {
  const inputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();

  const pick = () => inputRef.current?.click();

  const onPick: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    nav('/hub/echo/swing', { state: { preselectedFileName: file.name } });
  };

  return (
    <Tile 
      title="Swing Coach" 
      subtitle="Upload for instant analysis" 
      variant="compact"
      right={<ViewAllPill onClick={() => nav('/hub/echo/swing')} />}
    >
      <div className="space-y-3">
        <div className="rounded-xl border border-white/12 bg-white/5 aspect-[16/9]" />
        <button 
          type="button" 
          className="h-11 w-full rounded-xl border border-white/15 text-white/90 hover:bg-white/10 transition"
          onClick={pick}
        >
          Upload Swing Video
        </button>
        <input ref={inputRef} type="file" accept="video/*" hidden onChange={onPick} />
      </div>
    </Tile>
  );
}
