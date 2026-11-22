/**
 * Amateur News — the index (/discover/news).
 *
 * A THIN SHELL around the shared amateur index (NewsTabPage), exactly as
 * WireNewsPage is a shell around NewsTab. The Discover NEWS tab mounts the same
 * NewsTabPage, so the two cannot drift in typography, geometry or reading
 * experience — there is only one index body. Never copy its JSX here.
 *
 * It MUST render for a guest: a shared Walker Cup link that hits a login wall
 * is worthless. NewsTabPage gates its interactive bits on the viewer.
 *
 * NO PAGE-LEVEL BACK BUTTON. The back arrow lives in the chrome island (see the
 * two /discover/news entries in chrome-v2/registry.ts).
 */
import { useNavigate } from 'react-router-dom';
import { NAV_CLEARANCE } from '@/lib/navClearance';

import { NewsTabPage } from '@/components/explore-tab-new/NewsTabPage';
import { NewsChromeBridge } from '@/features/tourhub/news/NewsChromeBridge';
import { FONT, TOUR_CANVAS } from '@/features/tourhub/_shared/tokens';

export function AmateurNewsPage() {
  const navigate = useNavigate();
  return (
    <main style={{ background: TOUR_CANVAS, minHeight: '100dvh', fontFamily: FONT }}>
      <NewsChromeBridge label="Amateur News" mode="menu" backFallback="/amateur" />
      <div style={{ paddingTop: 'var(--news-header-h)' }}>
        <NewsTabPage chrome="none" railBy="category" onOpenStory={(slug) => navigate(`/discover/news/${slug}`)} />
      </div>
      <div aria-hidden style={{ height: `var(--bottom-nav-height, ${NAV_CLEARANCE})` }} />
    </main>
  );
}

export default AmateurNewsPage;
