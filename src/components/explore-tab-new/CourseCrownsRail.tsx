import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useRegionFeats, type FeatRow } from './hooks/useRegionFeats';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { SPACE } from '@/lib/spacing';
import { formatHcp } from '@/lib/formatHcp';
import { FONT } from './gamingLightTokens';

const CARD_BG = '#171E28';
const GOLD = '#FBBC2E';

const REGION_HUMAN: Record<string, string> = {
  'uk-ireland': 'GB&I',
  usa: 'USA',
  'continental-europe': 'EUROPE',
  'rest-of-world': 'REST OF WORLD',
};
function regionUpperFor(slug: string | null): string {
  return slug ? REGION_HUMAN[slug] ?? 'REGION' : 'WORLDWIDE';
}

function formatHolderName(raw?: string | null): string {
  const s = (raw ?? '').trim();
  if (!s) return 'A golfer';
  if (s.includes(', ')) {
    const [before, after] = s.split(', ').map((x) => x.trim());
    if (before && after) return `${after} ${before}`;
  }
  return s;
}

function initials(name: string): string {
  return (
    (name || '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

function CrownCard({ row }: { row: FeatRow }) {
  const navigate = useNavigate();
  const holder = formatHolderName(row.holder_name);
  const isStableford = row.category === 'best_stableford_all_time';
  const scoreLabel = isStableford ? 'STABLEFORD' : 'GROSS';
  const scoreValue =
    row.value != null ? String(row.value) : row.feat_value ?? '--';
  const hasHcp = row.holder_hcp != null;
  const club = (row.holder_club ?? '').trim();

  return (
    <button
      type="button"
      onClick={() => {
        if (row.course_id) navigate(`/courses/${row.course_id}`);
      }}
      className="text-left active:scale-[0.99] transition-transform"
      style={{
        flexShrink: 0,
        width: 300,
        minHeight: 168,
        borderRadius: 18,
        background: CARD_BG,
        border: 'none',
        cursor: 'pointer',
        fontFamily: FONT,
        display: 'flex',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(15,23,42,0.12)',
        padding: 0,
      }}
    >
      {/* LEFT: course + score */}
      <div
        style={{
          flex: 1.4,
          padding: '14px 14px 14px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minWidth: 0,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              letterSpacing: '0.1em',
              color: GOLD,
              lineHeight: 1,
            }}
          >
            {'\u{1F451} COURSE RECORD'}
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 12.5,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.course_name}
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 60,
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-0.04em',
              lineHeight: 0.9,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {scoreValue}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.08em',
              lineHeight: 1,
            }}
          >
            {scoreLabel}
          </div>
        </div>
      </div>

      {/* RIGHT: player rail */}
      <div
        style={{
          flex: 0.85,
          background:
            'linear-gradient(180deg, #FBBC2E18, rgba(255,255,255,0.02))',
          borderLeft: '1px solid #FBBC2E33',
          padding: '14px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          minWidth: 0,
        }}
      >
        <div style={{ boxShadow: `0 0 0 2px ${GOLD}`, borderRadius: '34%' }}>
          <SquircleAvatar
            size={56}
            src={row.holder_avatar ?? null}
            alt={holder}
            fallback={initials(holder)}
          />
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: '#fff',
            textAlign: 'center',
            lineHeight: 1.15,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
            width: '100%',
          }}
        >
          {holder}
        </div>
        {hasHcp ? (
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: GOLD,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatHcp(row.holder_hcp)}
          </div>
        ) : null}
        {club ? (
          <div
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
              textAlign: 'center',
            }}
          >
            {club}
          </div>
        ) : null}
      </div>
    </button>
  );
}

interface Props {
  region: string | null;
}

export function CourseCrownsRail({ region }: Props) {
  const navigate = useNavigate();
  const { data } = useRegionFeats(region, 'records');
  const rows = useMemo(() => (data ?? []).slice(0, 8), [data]);

  if (rows.length === 0) return null;

  const firstHolder = rows[0]?.holder_name
    ? formatHolderName(rows[0].holder_name)
    : null;

  return (
    <section style={{ marginTop: SPACE.sectionSection }}>
      <DiscoverSectionHeader
        eyebrow={`\u{1F451} Course Crowns \u00B7 ${regionUpperFor(region)}`}
        title={firstHolder ? `Held by ${firstHolder}` : 'Course crowns'}
        linkLabel="All"
        onLinkClick={() => navigate('/courses')}
      />
      <div
        className="flex overflow-x-auto scrollbar-hide"
        style={{ padding: '0 16px', gap: 9 }}
      >
        {rows.map((row, i) => (
          <CrownCard key={`${row.course_id ?? i}-${i}`} row={row} />
        ))}
      </div>
    </section>
  );
}

export default CourseCrownsRail;
