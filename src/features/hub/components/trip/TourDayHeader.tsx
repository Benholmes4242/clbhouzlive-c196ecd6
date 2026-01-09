/**
 * TourDayHeader - Premium day header for trip timeline
 * Tour-grade: Shows day number, date, and meta (games/notes/location)
 */

import React from 'react';
import { Flag, StickyNote } from 'lucide-react';

interface TourDayHeaderProps {
  title: string; // "Day 2 · Tuesday 14 Jan"
  gamesCount?: number;
  notesCount?: number;
  country?: string;
}

export function TourDayHeader({ title, gamesCount, notesCount, country }: TourDayHeaderProps) {
  // Build meta items
  const metaItems: React.ReactNode[] = [];
  
  if (gamesCount && gamesCount > 0) {
    metaItems.push(
      <span key="games" className="flex items-center gap-1">
        <Flag className="w-3 h-3" />
        {gamesCount} {gamesCount === 1 ? 'game' : 'games'}
      </span>
    );
  }
  
  if (notesCount && notesCount > 0) {
    metaItems.push(
      <span key="notes" className="flex items-center gap-1">
        <StickyNote className="w-3 h-3" />
        {notesCount} {notesCount === 1 ? 'note' : 'notes'}
      </span>
    );
  }
  
  if (country) {
    metaItems.push(
      <span key="country" className="flex items-center gap-1">
        📍 {country}
      </span>
    );
  }

  return (
    <div 
      className="flex flex-col gap-0.5 px-4 py-2.5 rounded-2xl my-2"
      style={{
        background: 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Line 1: Primary - Day N · Date */}
      <span className="text-[14px] font-semibold text-foreground">
        {title}
      </span>
      
      {/* Line 2: Meta strip - only show if we have items */}
      {metaItems.length > 0 && (
        <div className="flex items-center gap-3 text-[12px] text-slate-500">
          {metaItems.map((item, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-300">·</span>}
              {item}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
