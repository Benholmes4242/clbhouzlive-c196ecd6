import React from 'react';

import { NewsChromeBridge } from './NewsChromeBridge';
import { NewsTab } from './NewsTab';
import { FONT, SLATE_50 } from '../_shared/tokens';

/** Standalone, non-immersive Wire index at /tour/news. */
export function WireNewsPage() {
  return (
    <div style={{ background: SLATE_50, minHeight: '100dvh', fontFamily: FONT }}>
      <NewsChromeBridge label="The Wire" mode="menu" backFallback="/tourhub" />
      {/* The app shell owns the safe-area inset; this pays only the fixed
          non-bleeding island's published content height. */}
      <div style={{ paddingTop: 'var(--header-h, 64px)' }}>
        <NewsTab immersiveHero={false} />
      </div>
    </div>
  );
}

export default WireNewsPage;