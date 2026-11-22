import React from 'react';
import { NAV_CLEARANCE } from '@/lib/navClearance';

import { NewsChromeBridge } from './NewsChromeBridge';
import { NewsTab } from './NewsTab';
import { FONT, TOUR_CANVAS } from '../_shared/tokens';

/** Standalone, non-immersive Wire index at /tour/news. Unlike the hub's
 * NewsTab, this has no PageRoot: this shell owns its one nav clearance. */
export function WireNewsPage() {
  return (
    <div style={{ background: TOUR_CANVAS, minHeight: '100dvh', fontFamily: FONT, paddingBottom: `var(--bottom-nav-height, ${NAV_CLEARANCE})` }}>
      <NewsChromeBridge titleInPage label="Tour News" mode="menu" backFallback="/tourhub" />
      <div style={{ paddingTop: 'var(--news-header-h)' }}>
        <NewsTab immersiveHero={false} />
      </div>
    </div>
  );
}

export default WireNewsPage;