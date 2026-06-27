import { memo, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { CrownMark } from './DiscoverMarks';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import { useTitlesInReach, type TitleInReach } from '@/hooks/gam/useTitlesInReach';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SLATE_50, SURFACE } from '@/features/courses/_shared/tokens';

const AMBER = '#F7931E';
const DEEP_AMBER = '#B26818';
const GOLD = '#FBBC2E';

interface WhereYoudRankProps {
  userId: string | undefined;
}

const CATEGORY_META: Record<string, { label: string; unit: string; style: 'off' | 'back' }> = {
  lowest_gross: { label: 'Gross', unit: 'strokes', style: 'off' },
  best_score_diff: { label: 'Score', unit: 'strokes', style: 'off' },
  most_birdies: { label: 'Birdies', unit: 'birdies', style: 'back' },
  best_stableford: { label: 'Stableford', unit: 'points', style: 'back' },
  most_eagles: { label: 'Eagles', unit: 'eagles', style: 'back' },
  most_aces: { label: 'Hole-in-one', unit: 'aces', style: 'back' },
  most_rounds: { label: 'Most rounds', unit: 'rounds', style: 'back' },
};

function stripWindow(category: string): string {
  return category.replace(/_(90d|all_time)$/, '');
}

function gapCopy(category: string, gap: number): string {
  const base = stripWindow(category);
  const meta = CATEGORY_META[base];
  if (!meta) return `${Math.round(gap)} off the record`;
  const n = Math.round(gap);
  return meta.style === 'off'
    ? `${n} ${meta.unit} off the ${meta.label.toLowerCase()} record`
    : `${n} ${meta.unit} back in ${meta.label}`;
}

function categoryLabel(category: string): string {
  const base = stripWindow(category);
  return (CATEGORY_META[base]?.label ?? base.replace(/_/g, ' ')).toUpperCase();
}

function RankCard({ row, onTap }: { row: TitleInReach; onTap: () => void }) {
  const initial = (row.course_name || '?').charAt(0).toUpperCase();
  return (
    <button
      type="button"
      onClick={onTap}
      className="block text-left active:scale-[0.99] transition-transform"
      style={{
        width: 244,
        flexShrink: 0,
        background: SURFACE,
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: 116, background: SLATE_50 }}>
        {row.hero_image_url ? (
          <img
            src={row.hero_image_url}
            alt={row.course_name}
            loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 48,
              fontWeight: 900,
            }}
          >
            {initial}
          </div>
        )}
        {/* scrim */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.10) 45%, rgba(0,0,0,0.65) 100%)',
          }}
        />
        {/* category pill */}
        <span
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: '#FFFFFF',
            background: 'rgba(15,23,42,0.55)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            padding: '4px 8px',
            borderRadius: 999,
          }}
        >
          <Crown size={11} color={GOLD} fill={GOLD} strokeWidth={1.5} />
          {categoryLabel(row.category)}
        </span>
        {/* rank */}
        <div
          style={{
            position: 'absolute',
            bottom: 6,
            right: 12,
            fontSize: 22,
            fontWeight: 800,
            color: '#FFFFFF',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          #{row.user_rank}
        </div>
      </div>
      <div
        style={{
          height: 56,
          padding: '0 13px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 14.5,
            fontWeight: 800,
            color: '#0F172A',
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {row.course_name}
        </p>
        <p
          style={{
            margin: '2px 0 0',
            fontSize: 12,
            fontWeight: 500,
            color: DEEP_AMBER,
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {gapCopy(row.category, row.gap)}
        </p>
      </div>
    </button>
  );
}

function WhereYoudRankInner({ userId }: WhereYoudRankProps) {
  const { user } = useSupabaseSession();
  const effectiveUserId = userId ?? user?.id;
  const { data: connection, isLoading: connLoading } = useWhsConnection(effectiveUserId);
  const { data, isLoading } = useTitlesInReach(effectiveUserId);
  const navigate = useNavigate();

  // One random seed per mount → cards stay stable during this visit, but a
  // fresh visit (remount) re-picks. We pick 3 from the nearest pool, de-duped
  // by course so the same course doesn't appear twice across categories.
  const seedRef = useRef(Math.random());
  const picks = useMemo(() => {
    if (!data || data.length === 0) return [];
    // De-dup by course_id, keeping the nearest (data is already rank/gap ordered).
    const seen = new Set<string>();
    const unique: TitleInReach[] = [];
    for (const row of data) {
      if (seen.has(row.course_id)) continue;
      seen.add(row.course_id);
      unique.push(row);
    }
    // Deterministic shuffle from the per-mount seed (mulberry32-ish).
    let s = Math.floor(seedRef.current * 2 ** 32) || 1;
    const rand = () => {
      s |= 0;
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const arr = unique.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, 6);
  }, [data]);

  if (!effectiveUserId || connLoading || !connection) return null;
  if (isLoading) return null;
  if (picks.length === 0) return null;

  return (
    <section style={{ padding: '0 0 0' }}>
      <ExploreSectionHeader
        title="Titles within your reach"
        mark={<CrownMark />}
        sub="Courses you've played, where you're close to the lead"
      />
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide" style={{ paddingBottom: 4 }}>
        {picks.map(row => (
          <RankCard
            key={`${row.course_id}-${row.category}`}
            row={row}
            onTap={() => navigate(`/courses/${row.course_id}?tab=legends`)}
          />
        ))}
      </div>
    </section>
  );
}

export const WhereYoudRank = memo(WhereYoudRankInner);
