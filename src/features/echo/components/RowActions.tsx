import React from 'react';

export function RowActions({ id, onMore, onStar, onDelete }:{
  id: string;
  onMore: () => void; onStar: () => void; onDelete: () => void;
}) {
  return (
    <>
      <button aria-label="More options" className="p-2 rounded-xl hover:bg-white/10" onClick={onMore}>⋯</button>
      <button aria-label="Star conversation" className="p-2 rounded-xl hover:bg-white/10" onClick={onStar}>⭐</button>
      <button aria-label="Delete conversation" className="p-2 rounded-xl hover:bg-white/10" onClick={onDelete}>🗑️</button>
    </>
  );
}
