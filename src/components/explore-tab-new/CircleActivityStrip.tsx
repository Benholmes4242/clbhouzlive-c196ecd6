import { useState, useMemo } from 'react';
import { Activity } from 'lucide-react';
import { ExploreSectionHeader } from './ExploreSectionHeader';
import {
  useCircleActivity,
  type CircleActivityRow,
  type CircleFeatType,
  type CircleFeatTone,
} from './hooks/useCircleActivity';
import {
  AMBER,
  INK,
  INK_MUTE,
  INK_FAINT,
  HAIRLINE_INK_8,
  INK_TINT_06,
} from '@/features/courses/_shared/tokens';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const CARD_W = 240;
const AMBER_TEXT = '#c97a10';

const FEAT_META: Record<CircleFeatType, { emoji: string; label: string }> = {
  ace: { emoji: '🕳️', label: 'HOLE-IN-ONE' },
  albatross: { emoji: '🦅', label: 'ALBATROSS' },
  under_par: { emoji: '🏌️', label: 'UNDER PAR' },
  eagle: { emoji: '🦅', label: 'EAGLE' },
  pb_gross: { emoji: '💎', label: 'PERSONAL BEST' },
  pb_stableford: { emoji: '💎', label: 'PERSONAL BEST' },
  birdie_haul: { emoji: '🐦', label: 'BIRDIE HAUL' },
  stableford: { emoji: '🔥', label: 'STABLEFORD' },
};

function toneStyle(tone: CircleFeatTone): { bg: string; fg: string } {
  if (tone === 'gold') return { bg: AMBER, fg: '#FFFFFF' };
  if (tone === 'amber') return { bg: 'rgba(247,147,30,0.92)', fg: '#FFFFFF' };
  return { bg: 'rgba(15,23,42,0.72)', fg: '#FFFFFF' };
}

function valueColor(tone: CircleFeatTone): string {
  return tone === 'plain' ? INK_MUTE : AMBER_TEXT;
}

function formatFriendName(raw: string): string {
  const s = (raw ?? '').trim();
  if (!s) return 'A friend';
  if (s.includes(',')) {
    const [last, first] = s.split(',').map((x) => x.trim());
    if (first && last) return `${first.split(/\s+/)[0]} ${last[0].toUpperCase()}.`;
    return s;
  }
  return s;
}

function initials(name: string): string {
  const parts = (name || '').replace(',', ' ').split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

function relDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startToday - that) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

interface Props {
  userId?: string;
}

export function CircleActivityStrip({ userId }: Props) {
  const { data, isLoading } = useCircleActivity(userId);
  const [sheet, setSheet] = useState<{ scoreId: string; connectionId: string } | null>(null);

  const rows = useMemo(() => data ?? [], [data]);

  const Header = (
    <ExploreSectionHeader
      kicker="FRIENDS RECENT HIGHLIGHTS"
      kickerColor="amber"
      title="Your friends"
      sub="What your circle's been pulling off"
      icon={Activity}
      iconTone="amber"
    />
  );

  if (isLoading) {
    return (
      <section style={{ fontFamily: FONT }}>
        {Header}
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide" style={{ paddingBottom: 4 }}>
          {Array.from({ length: 2 }).map((_v, i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                flexShrink: 0,
                width: CARD_W,
                height: 180,
                borderRadius: 16,
                background: INK_TINT_06,
              }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (rows.length === 0) {
    return (
      <section style={{ fontFamily: FONT }}>
        {Header}
        <div style={{ padding: '0 16px 4px' }}>
          <div
            style={{
              background: '#FFFFFF',
              border: `1px solid ${HAIRLINE_INK_8}`,
              borderRadius: 16,
              padding: '18px 16px',
              fontSize: 14,
              fontWeight: 600,
              color: INK_MUTE,
              lineHeight: 1.45,
            }}
          >
            No highlights from your circle yet —{' '}
            <span style={{ color: AMBER_TEXT, fontWeight: 800 }}>go set the pace.</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{ fontFamily: FONT }}>
      {Header}
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide" style={{ paddingBottom: 4 }}>
        {rows.map((r, i) => (
          <CircleActivityCard
            key={`${r.score_id}-${i}`}
            row={r}
            onTap={() => setSheet({ scoreId: r.score_id, connectionId: r.connection_id })}
          />
        ))}
      </div>

      <RoundDetailSheet
        open={!!sheet}
        onClose={() => setSheet(null)}
        scoreId={sheet?.scoreId ?? null}
        connectionId={sheet?.connectionId ?? null}
      />
    </section>
  );
}

interface CardProps {
  row: CircleActivityRow;
  onTap: () => void;
}

function CircleActivityCard({ row, onTap }: CardProps) {
  const meta = FEAT_META[row.feat_type] ?? { emoji: '⛳', label: 'HIGHLIGHT' };
  const tone = toneStyle(row.feat_tone);
  const friend = formatFriendName(row.friend_name);

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
      {/* Top image strip */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 96,
          background: row.course_image
            ? INK_TINT_06
            : 'linear-gradient(135deg, #0F172A 0%, #1e293b 100%)',
        }}
      >
        {row.course_image ? (
          <img
            src={row.course_image}
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
              'linear-gradient(180deg, rgba(15,23,42,0) 40%, rgba(15,23,42,0.78) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Feat badge */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 999,
            background: tone.bg,
            color: tone.fg,
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: '0.1em',
            lineHeight: 1.2,
            textTransform: 'uppercase',
          }}
        >
          <span aria-hidden style={{ fontSize: 11, lineHeight: 1 }}>{meta.emoji}</span>
          <span>{meta.label}</span>
        </div>
        {/* Course name */}
        <div
          style={{
            position: 'absolute',
            left: 10,
            right: 10,
            bottom: 8,
            color: '#FFFFFF',
            fontSize: 12.5,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.005em',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {row.course_name}
        </div>
      </div>

      {/* Body row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '11px 13px',
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '34%',
            overflow: 'hidden',
            background: INK_TINT_06,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: INK_MUTE,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {row.friend_avatar ? (
            <img
              src={row.friend_avatar}
              alt=""
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            initials(row.friend_name)
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 13.5,
              fontWeight: 700,
              color: INK,
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {friend}
          </p>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: 12,
              lineHeight: 1.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: valueColor(row.feat_tone),
                letterSpacing: '-0.005em',
              }}
            >
              {row.feat_value}
            </span>
            <span style={{ color: INK_FAINT, fontWeight: 600 }}> · {relDate(row.play_date)}</span>
          </p>
        </div>
      </div>
    </button>
  );
}

export default CircleActivityStrip;
