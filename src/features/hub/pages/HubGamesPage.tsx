/**
 * Hub Games Page
 * Full-screen glass page overlaying the origin page.
 */
import React from 'react';
import { SearchGamesPage } from '@/features/hub/games/SearchGamesPage';
import '../home/hubTheme.css';

export function HubGamesPage() {
  return (
    <div
      className="hub-glass-page fixed inset-0 z-[9999]"
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(120px)',
        WebkitBackdropFilter: 'blur(120px)',
      }}
    >
      <SearchGamesPage />
    </div>
  );
}
