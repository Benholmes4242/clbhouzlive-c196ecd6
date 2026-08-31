/**
 * AmateurNewsPage — /discover/news. The amateur half of the news programme.
 *
 * IT IS THE TOUR NEWS PAGE. LeadStory and StoryRow are imported from the tour
 * wire, not reimplemented: a golfer must recognise this instantly as the same
 * product pointed at the other half of the sport, and a second implementation
 * of the same list would drift within a month.
 *
 * The only substantive difference is the lens: the tour picker is replaced by a
 * CATEGORY row (mens | womens | boys | girls | seniors | midam | county |
 * university | international), because tour slugs mean nothing here.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { safeGoBack } from '@/utils/navigation';
import { LeadStory, StoryRow } from '@/features/tourhub/news/NewsTab';
import { OVERVIEW_HERO_HEIGHT } from '@/features/tourhub/components/overview-v3/OverviewHero';
import {
  FONT,
  HAIRLINE_INK_10,
  INK,
  INK_MUTE,
  SLATE_50,
} from '@/features/tourhub/_shared/tokens';
import { AMATEUR_CATEGORIES, AMATEUR_CATEGORY_LABEL } from './categories';
import { useAmateurStories, type AmateurStory } from './useAmateurStories';

const KICKER: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
};

/** Text-only lens row, per the platform's tab/filter law: no fill, no outline. */
function CategoryRow({
  value,
  onChange,
  counts,
}: {
  value: string;
  onChange: (v: string) => void;
  counts: Record<string, number>;
}) {
  const options: { id: string; label: string }[] = [
    { id: 'all', label: 'All' },
    ...AMATEUR_CATEGORIES.filter((c) => (counts[c] ?? 0) > 0).map((c) => ({
      id: c,
      label: AMATEUR_CATEGORY_LABEL[c],
    })),
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        overflowX: 'auto',
        padding: '12px 14px 10px',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}
    >
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: FONT,
              fontSize: 12.5,
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: active ? INK : 'rgba(255,255,255,0.55)',
            }}
          >
            {o.label.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

function BackButton() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      aria-label="Back"
      onClick={() => safeGoBack(navigate, '/clubhouse?tab=discover')}
      className="active:scale-[0.94]"
      style={{
        position: 'absolute',
        top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        left: 10,
        zIndex: 3,
        width: 34,
        height: 34,
        borderRadius: 12,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.42)',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <ChevronLeft size={18} color="#FFFFFF" strokeWidth={2.2} />
    </button>
  );
}

export function AmateurNewsPage() {
  const navigate = useNavigate();
  const [category, setCategory] = React.useState<string>('all');
  const { all, stories, isLoading } = useAmateurStories(category);

  const counts = React.useMemo(() => {
    const out: Record<string, number> = {};
    for (const s of all) for (const c of s.categories) out[c] = (out[c] ?? 0) + 1;
    return out;
  }, [all]);

  const [lead, rest] = React.useMemo<[AmateurStory | null, AmateurStory[]]>(() => {
    if (stories.length === 0) return [null, []];
    const first = stories[0];
    // No image means no photo-led lead — the list simply has none that day.
    if (!first.image_url) return [null, stories];
    return [first, stories.slice(1)];
  }, [stories]);

  const open = (slug: string) => navigate(`/discover/news/${slug}`);

  return (
    <div style={{ background: SLATE_50, minHeight: '100dvh', fontFamily: FONT, position: 'relative' }}>
      <BackButton />

      {isLoading ? (
        <div>
          <Skeleton style={{ height: OVERVIEW_HERO_HEIGHT, width: '100%', borderRadius: 0 }} />
          <div style={{ padding: '0 14px' }}>
            <Skeleton style={{ height: 62, width: '100%', marginTop: 16 }} />
            <Skeleton style={{ height: 62, width: '100%', marginTop: 12 }} />
          </div>
        </div>
      ) : all.length === 0 ? (
        <div
          style={{
            padding: 'calc(env(safe-area-inset-top, 0px) + 76px) 14px 0',
            fontSize: 13,
            color: INK_MUTE,
          }}
        >
          No amateur stories yet.
        </div>
      ) : (
        <>
          {lead && <LeadStory story={lead} onOpen={() => open(lead.slug)} />}
          {!lead && (
            <div style={{ height: 'calc(env(safe-area-inset-top, 0px) + 60px)' }} aria-hidden />
          )}

          <div style={{ borderBottom: `1px solid ${HAIRLINE_INK_10}` }}>
            <CategoryRow value={category} onChange={setCategory} counts={counts} />
          </div>

          {stories.length === 0 ? (
            <div style={{ padding: '18px 14px', fontSize: 13, color: INK_MUTE }}>
              Nothing filed under this yet.
            </div>
          ) : (
            <div>
              {rest.map((s, i) => (
                <div key={s.id} style={{ borderTop: i === 0 ? 'none' : `1px solid ${HAIRLINE_INK_10}` }}>
                  <StoryRow story={s} onOpen={() => open(s.slug)} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div
        aria-hidden
        style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + var(--bottom-nav-height, 88px) + 16px)' }}
      />
    </div>

  );
}

export default AmateurNewsPage;
