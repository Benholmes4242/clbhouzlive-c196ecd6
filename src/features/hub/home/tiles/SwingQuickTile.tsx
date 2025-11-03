/**
 * Swing Coach Quick Upload Tile
 * Quick access to upload swing video from dashboard
 */

import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TileHeader } from '../parts/TileHeader';
import { Upload } from 'lucide-react';

interface SwingQuickTileProps {
  className?: string;
}

export function SwingQuickTile({ className }: SwingQuickTileProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();

  const pick = () => inputRef.current?.click();

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Navigate to swing coach - it will handle the upload
    nav('/hub/echo/swing');
  };

  return (
    <section className={className}>
      <TileHeader 
        title="Swing Coach" 
        subtitle="Upload a swing for instant analysis" 
        viewAllTo="/hub/echo/swing" 
      />
      <div className="row">
        <button 
          className="chip flex items-center gap-2" 
          onClick={pick} 
          aria-pressed="false"
        >
          <Upload className="w-4 h-4" />
          Upload Swing Video
        </button>
        <input 
          ref={inputRef} 
          type="file" 
          accept="video/*" 
          hidden 
          onChange={onPick}
        />
      </div>
    </section>
  );
}
