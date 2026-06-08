import { memo, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Trophy } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import { useTitlesInReach, type TitleInReach } from '@/hooks/gam/useTitlesInReach';
import { ExploreSectionHeader } from './ExploreSectionHeader';
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
  return (CATEGORY_META[base]?.label ?? base).toUpperCase();
}

function RankCard({ row, onTap }: { row: TitleInReach; onTap: () => void }) {
  const initial = (row.course_name || '?').charAt(0).toUpperCase();
  return (
    <button
      type="button"
      onClick={onTap}
      className="block text-left active:scale-[0.99] transition-transform"
      style={{
        width: 250,
        flexShrink: 0,
        background: SURFACE,
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: 130, background: SLATE_50 }}>
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
              'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.10) 45%, rgba(0,0,0,0.75) 100%)',
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
        {/* course name */}
        <h3
          style={{
            position: 'absolute',
            bottom: 10,
            left: 12,
            right: 60,
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: '-0.01em',
            color: '#FFFFFF',
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {row.course_name}
        </h3>
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
      <div style={{ padding: '10px 12px 12px' }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: DEEP_AMBER,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
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
  const { data, isLoading } = useTitlesInReach(effectiveUserId, '90d');
  const navigate = useNavigate();

  if (!effectiveUserId || connLoading || !connection) return null;
  if (isLoading || !data || data.length === 0) return null;

  return (
    <section style={{ padding: '0 0 0' }}>
      <ExploreSectionHeader
        title="Titles within reach"
        icon={Trophy}
        sub="Courses you've played — and how close you are"
      />
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide" style={{ paddingBottom: 4 }}>
        {data.map(row => (
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
