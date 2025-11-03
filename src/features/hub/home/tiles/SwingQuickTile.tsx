/**
 * Swing Coach Quick Upload Tile
 * Quick access to upload swing video from dashboard
 */

import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TileHeader } from '../parts/TileHeader';

interface SwingQuickTileProps {
  className?: string;
}

export function SwingQuickTile({ className }: SwingQuickTileProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();

  const pick = () => inputRef.current?.click();

  const onPick: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Hand off to Swing page (it already handles upload)
    nav('/hub/echo/swing', { state: { preselectedFileName: file.name } });
  };

  return (
    <section className={className}>
      <TileHeader 
        title="Swing Coach" 
        subtitle="Upload a swing for instant analysis" 
        viewAllTo="/hub/echo/swing" 
      />
      <div className="row">
        <button type="button" className="chip" onClick={pick}>Upload Swing Video</button>
        <input ref={inputRef} type="file" accept="video/*" hidden onChange={onPick} />
      </div>
    </section>
  );
}
