import { useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';
import {
  useRecentCourseRecords,
  type RecentCourseRecord,
} from '@/hooks/gam/useRecentCourseRecords';
import { ExploreSectionHeader } from './ExploreSectionHeader';
import {
  INK,
  INK_MUTE,
  INK_FAINT,
  HAIRLINE_INK_8,
  INK_TINT_06,
} from '@/features/courses/_shared/tokens';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const CARD_W = 220;
const GOLD = '#FBBC2E';
const DEEP_GOLD = '#E07F0E';

const CATEGORY_LABEL: Record<string, string> = {
  lowest_gross_all_time: 'Gross record',
  best_stableford_all_time: 'Stableford record',
  best_score_diff_all_time: 'Net record',
  most_birdies_all_time: 'Most birdies',
  most_eagles_all_time: 'Most eagles',
  most_aces_all_time: 'Most aces',
  lowest_gross_90d: 'Gross record',
  best_stableford_90d: 'Stableford record',
  best_score_diff_90d: 'Net record',
  most_birdies_90d: 'Most birdies',
  most_eagles_90d: 'Most eagles',
  most_aces_90d: 'Most aces',
};

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startToday - that) / 86400000);
  if (dayDiff <= 0) return 'today';
  if (dayDiff === 1) return 'yesterday';
  if (dayDiff < 7) return `${dayDiff}d ago`;
  if (dayDiff < 30) return `${Math.floor(dayDiff / 7)}w ago`;
  if (dayDiff < 365) return `${Math.floor(dayDiff / 30)}mo ago`;
  return `${Math.floor(dayDiff / 365)}y ago`;
}

function holderDisplay(r: RecentCourseRecord): string {
  return r.holder_name?.trim() || r.holder_username?.trim() || 'A golfer';
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('');
}

interface Props {
  userId?: string;
}

export function LatestRecordsStrip(_: Props = {}) {
  const navigate = useNavigate();
  const { data, isLoading } = useRecentCourseRecords(8);

  if (isLoading) {
    return (
      <section style={{ padding: '0 0 0', fontFamily: FONT }}>
        <ExploreSectionHeader
          icon={Crown}
          title="Latest records"
          sub="Champions · official WHS data"
        />
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide" style={{ paddingBottom: 4 }}>
          {Array.from({ length: 2 }).map((_v, i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                flexShrink: 0,
                width: CARD_W,
                height: 268,
                borderRadius: 16,
                background: INK_TINT_06,
              }}
            />
          ))}
        </div>
      </section>
    );
  }

  const records = data ?? [];
  if (records.length === 0) return null;

  return (
    <section style={{ padding: '0 0 0', fontFamily: FONT }}>
      <ExploreSectionHeader
        icon={Crown}
        title="Latest course records"
        sub="Champions · official WHS data"
      />
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide" style={{ paddingBottom: 4 }}>
        {records.map((r, i) => (
          <RecordHeroCard
            key={`${r.course_id}-${r.category}-${i}`}
            record={r}
            onTap={() =>
              navigate(`/courses/${r.course_id}`, { state: { activeTab: 'legends' } })
            }
          />
        ))}
      </div>
    </section>
  );
}

interface CardProps {
  record: RecentCourseRecord;
  onTap: () => void;
}

function RecordHeroCard({ record, onTap }: CardProps) {
  const label = CATEGORY_LABEL[record.category] ?? 'Record';
  const holder = holderDisplay(record);

  return (
    <button
      type="button"
      onClick={onTap}
      className="text-left active:scale-[0.98] transition-transform"
      style={{
        flexShrink: 0,
        width: CARD_W,
        background: '#FFFFFF',
        border: `1px solid ${HAIRLINE_INK_8}`,
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {/* Hero image */}
      <div style={{ position: 'relative', width: '100%', height: 180, background: INK_TINT_06 }}>
        {record.thumbnail_image ? (
          <img
            src={record.thumbnail_image}
            alt=""
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : null}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(15,23,42,0) 35%, rgba(15,23,42,0.82) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Category label top-left */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 12,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#FFFFFF',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {label}
        </div>
        {/* Value bottom-right */}
        <div
          style={{
            position: 'absolute',
            right: 12,
            bottom: 8,
            color: '#FFFFFF',
            fontSize: 38,
            fontWeight: 300,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
            fontFeatureSettings: '"tnum" 1, "kern" 1',
            textShadow: '0 2px 6px rgba(0,0,0,0.4)',
          }}
        >
          {record.value}
        </div>
        {/* Course name bottom-left */}
        <div
          style={{
            position: 'absolute',
            left: 12,
            right: 76,
            bottom: 12,
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.005em',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {record.course_name}
        </div>
      </div>

      {/* Holder row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 12px 14px',
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12, // ~34% squircle
              overflow: 'hidden',
              background: INK_TINT_06,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: INK_MUTE,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {record.holder_avatar ? (
              <img
                src={record.holder_avatar}
                alt=""
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              initials(holder)
            )}
          </div>
          {/* Crown badge */}
          <div
            style={{
              position: 'absolute',
              top: -5,
              right: -5,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${GOLD} 0%, ${DEEP_GOLD} 100%)`,
              border: '1.5px solid #FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              lineHeight: 1,
            }}
            aria-hidden
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M5 19h14l1-9-5 3-3-6-3 6-5-3 1 9z" />
            </svg>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              color: INK,
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {holder}
          </p>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: 10,
              fontWeight: 600,
              color: INK_FAINT,
              letterSpacing: '0.02em',
              lineHeight: 1.2,
            }}
          >
            {timeAgo(record.attained_at)}
          </p>
        </div>
      </div>
    </button>
  );
}

export default LatestRecordsStrip;
