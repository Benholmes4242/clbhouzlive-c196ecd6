import { Clapperboard, Film } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Eyebrow, InkAction } from './tokens';
import {
  CommunityClipTile,
  CommunityVideoTile,
} from './CommunityMediaTiles';
import {
  MIN_RAIL_TILES,
  type CommunityVideo,
} from './hooks/useCommunityVideos';

/**
 * THE TWO MEDIA RAILS (BRIEF_DISCOVER_MEDIA_RAILS §1.8, §3.3, §4).
 *
 * NOT COURSE-LED, deliberately: these read the whole media library, so they do
 * NOT respond to ScopePills and must not sit inside its filtered region.
 *
 * A tier with fewer than MIN_RAIL_TILES tiles renders NOTHING — no heading, no
 * empty state, no skeleton left behind. A two-tile rail reads as a fault.
 *
 * OFF-SCREEN RAILS DECODE NOTHING: the rail's own IntersectionObserver drops
 * `visible`, which unmounts every video element in it, so a page with three
 * media sections cannot quietly drain a phone.
 */

/** Rails scroll to the right edge: the last tile bleeds off, announcing scroll. */
const SCROLLER: React.CSSProperties = {
  display: 'flex',
  overflowX: 'auto',
  paddingRight: 0,
  willChange: 'transform',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none',
};

function useRailVisible<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio > 0.1),
      { threshold: [0, 0.1, 0.3] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, visible };
}

interface Props {
  items: CommunityVideo[];
  onTilePress: (item: CommunityVideo) => void;
  onSeeAll: () => void;
  /** Optional outer spacing override (the caller owns the section seam). */
  style?: CSSProperties;
}

export function LatestVideosRail({ items, onTilePress, onSeeAll, style }: Props) {
  const { t } = useTranslation('courses');
  const { ref, visible } = useRailVisible<HTMLElement>();
  if (items.length < MIN_RAIL_TILES) return null;

  return (
    <section ref={ref} style={style}>
      {/* NO COUNT IN THE HEADING — thin supply must not advertise itself. */}
      <Eyebrow
        icon={Clapperboard}
        aside={<InkAction onClick={onSeeAll}>{t('discover.videosAction', 'All videos')}</InkAction>}
      >
        {t('discover.videosHeading', 'Latest videos')}
      </Eyebrow>

      <div style={{ ...SCROLLER, gap: 12, margin: '0 -14px', padding: '0 14px 2px' }}>
        {items.map((item) => (
          <CommunityVideoTile
            key={item.key}
            item={item}
            railVisible={visible}
            onPress={onTilePress}
          />
        ))}
      </div>
    </section>
  );
}

export function ClipsRail({ items, onTilePress, onSeeAll }: Props) {
  const { t } = useTranslation('courses');
  const { ref, visible } = useRailVisible<HTMLElement>();
  if (items.length < MIN_RAIL_TILES) return null;

  return (
    <section ref={ref}>
      <Eyebrow
        icon={Film}
        aside={<InkAction onClick={onSeeAll}>{t('discover.clipsAction', 'See all')}</InkAction>}
      >
        {t('discover.clipsHeading', 'Clips')}
      </Eyebrow>

      <div style={{ ...SCROLLER, gap: 8, margin: '0 -14px', padding: '0 14px 2px' }}>
        {items.map((item) => (
          <CommunityClipTile
            key={item.key}
            item={item}
            railVisible={visible}
            onPress={onTilePress}
          />
        ))}
      </div>
    </section>
  );
}
