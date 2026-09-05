/**
 * Amateur News — the index (/discover/news).
 *
 * IT IS THE TOUR NEWS PAGE, pointed at the other half of the sport: LeadStory
 * and StoryRow are imported from the wire rather than reimplemented, so the two
 * beats cannot drift apart in typography, geometry or reading experience.
 *
 * It MUST render for a guest: a shared Walker Cup link that hits a login wall
 * is worthless. Nothing on this page reads the viewing member.
 *
 * NO PAGE-LEVEL BACK BUTTON. The back arrow lives in the chrome island (see the
 * two /discover/news entries in chrome-v2/registry.ts); a second one here would
 * sit at the same coordinates as the island.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';

import { LeadStory, StoryRow } from '@/features/tourhub/news/NewsTab';
import { NewsChromeBridge } from '@/features/tourhub/news/NewsChromeBridge';
import { useStoryEngagement } from '@/features/stories/useStoryEngagement';
import { FONT, HAIRLINE_INK_10, INK, INK_MUTE, SLATE_50 } from '@/features/tourhub/_shared/tokens';

import { AMATEUR_CATEGORIES, categoryLabel } from './categories';
import { useAmateurStories, type AmateurStory } from './useAmateurStories';

const KICKER: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const BOTTOM_SPACER = 'calc(env(safe-area-inset-bottom, 0px) + var(--bottom-nav-height, 88px) + 16px)';

/**
 * The category row. TEXT ONLY, per the platform's tab/filter law: no fill, no
 * outline. Counted from the UNFILTERED list so the row does not change shape as
 * you filter it.
 */
function CategoryRow({
  all,
  active,
  onChange,
}: {
  all: AmateurStory[];
  active: string | null;
  onChange: (next: string | null) => void;
}) {
  const { t } = useTranslation('courses');
  const label = (value: string, fallback: string) =>
    t(`amateurNews.categories.${value}`, fallback);

  const counts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const s of all) for (const c of s.categories) map.set(c, (map.get(c) ?? 0) + 1);
    return map;
  }, [all]);

  const options = React.useMemo(
    () => AMATEUR_CATEGORIES.filter((c) => (counts.get(c.value) ?? 0) > 0),
    [counts],
  );

  const item = (value: string | null, text: string) => {
    const on = (active ?? null) === value;
    return (
      <button
        key={value ?? 'all'}
        type="button"
        role="tab"
        aria-selected={on}
        onClick={() => onChange(value)}
        style={{
          flex: 'none',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          ...KICKER,
          color: on ? INK : 'rgba(255,255,255,0.55)',
        }}
      >
        {text}
      </button>
    );
  };

  return (
    <div
      role="tablist"
      aria-label={t('amateurNews.filterAria', 'Filter amateur news')}
      className="scrollbar-hide"
      style={{
        display: 'flex',
        gap: 16,
        overflowX: 'auto',
        minWidth: 0,
        padding: '12px 14px 10px',
        borderBottom: `1px solid ${HAIRLINE_INK_10}`,
      }}
    >
      {item(null, t('amateurNews.all', 'All'))}
      {options.map((c) => item(c.value, categoryLabel(c.value, label)))}
    </div>
  );
}

export function AmateurNewsPage() {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const [category, setCategory] = React.useState<string | null>(null);
  const { all, stories, isPending } = useAmateurStories(category);

  const newest = all[0] ?? null;
  const leadInList = !!newest?.image_url;
  /* The lead is the newest story of the WHOLE beat, and it only exists when it
     carries a photograph — a photo-led band with no photo is a grey slab. */
  const lead = leadInList && (!category || newest?.categories.includes(category)) ? newest : null;
  const rows = lead ? stories.filter((s) => s.id !== lead.id) : stories;

  const open = (slug: string) => navigate(`/discover/news/${slug}`);

  /* ONE READ PER WINDOW, never per row: every visible id in a single RPC. */
  const { engagementFor } = useStoryEngagement(
    'amateur_story',
    React.useMemo(() => stories.map((s) => s.id), [stories]),
  );

  return (
    <div style={{ background: SLATE_50, minHeight: '100dvh', fontFamily: FONT }}>
      <NewsChromeBridge label="Amateur News" mode="menu" backFallback="/explore" />
      {isPending ? (
        <div>
          <Skeleton style={{ height: 232, width: '100%', borderRadius: 0 }} />
          <div style={{ padding: '0 14px' }}>
            <Skeleton style={{ height: 62, width: '100%', marginTop: 16 }} />
            <Skeleton style={{ height: 62, width: '100%', marginTop: 12 }} />
          </div>
        </div>
      ) : (
        <>
          {lead ? (
            <LeadStory story={lead} onOpen={() => open(lead.slug)} immersiveHero={false} engagement={engagementFor(lead.id)} />
          ) : (
            <div aria-hidden style={{ height: 60 }} />
          )}

          {all.length > 0 && <CategoryRow all={all} active={category} onChange={setCategory} />}

          {all.length === 0 ? (
            <div style={{ padding: '18px 14px', fontSize: 13, color: INK_MUTE }}>
              {t('amateurNews.emptyAll', 'The first stories are on their way.')}
            </div>
          ) : rows.length === 0 && !lead ? (
            <div style={{ padding: '18px 14px', fontSize: 13, color: INK_MUTE }}>
              {t('amateurNews.emptyFilter', 'Nothing filed under this yet.')}
            </div>
          ) : (
            <div>
              {rows.map((s, i) => (
                <div key={s.id} style={{ borderTop: i === 0 ? 'none' : `1px solid ${HAIRLINE_INK_10}` }}>
                  <StoryRow story={s} onOpen={() => open(s.slug)} engagement={engagementFor(s.id)} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div aria-hidden style={{ height: BOTTOM_SPACER }} />
    </div>
  );
}

export default AmateurNewsPage;
