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

import { NewsTabPage } from '@/components/explore-tab-new/NewsTabPage';
import { NewsChromeBridge } from '@/features/tourhub/news/NewsChromeBridge';
import { FONT, TOUR_CANVAS } from '@/features/tourhub/_shared/tokens';

const BOTTOM_SPACER = 'calc(env(safe-area-inset-bottom, 0px) + var(--bottom-nav-height, 96px) + 16px)';

export function AmateurNewsPage() {
  const navigate = useNavigate();
  return (
    <main style={{ background: TOUR_CANVAS, minHeight: '100dvh', fontFamily: FONT }}>
      <NewsChromeBridge label="Amateur News" mode="menu" backFallback="/amateur" />
      <div style={{ paddingTop: 'var(--news-header-h)' }}>
        <NewsTabPage chrome="none" railBy="category" onOpenStory={(slug) => navigate(`/discover/news/${slug}`)} />
      </div>
      <div aria-hidden style={{ height: BOTTOM_SPACER }} />
    </main>
  );
}

export default AmateurNewsPage;
