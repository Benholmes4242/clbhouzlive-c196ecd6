/**
 * Swing Coach Quick Upload Tile
 * Quick access to upload swing video from dashboard
 */

import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile } from '../components/Tile';
import { TileHeader } from '../components/TileHeader';

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
    <Tile>
      <TileHeader 
        title="Swing Coach" 
        subtitle="Upload a swing for instant analysis" 
        onViewAll={() => nav('/hub/echo/swing')} 
      />
      <div className="mt-2">
        <button 
          type="button" 
          className="px-3.5 py-2.5 rounded-2xl border border-white/14 bg-white/06 text-[13px] font-medium text-white hover:bg-white/12 transition-all duration-200"
          onClick={pick}
        >
          Upload Swing Video
        </button>
        <input ref={inputRef} type="file" accept="video/*" hidden onChange={onPick} />
      </div>
    </Tile>
  );
}
