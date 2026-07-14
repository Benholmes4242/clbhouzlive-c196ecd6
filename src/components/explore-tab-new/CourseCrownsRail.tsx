import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useRegionFeats, type FeatRow } from './hooks/useRegionFeats';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { SPACE } from '@/lib/spacing';
import { formatHcp } from '@/lib/formatHcp';
import { FONT } from './gamingLightTokens';

const CARD_BG = '#141A22';
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
  const avatarSrc = row.holder_avatar ?? null;

  return (
    <button
      type="button"
      onClick={() => {
        if (row.course_id) navigate(`/courses/${row.course_id}`);
      }}
      className="text-left active:scale-[0.99] transition-transform"
      style={{
        flexShrink: 0,
        width: 230,
        borderRadius: 18,
        background: CARD_BG,
        border: 'none',
        cursor: 'pointer',
        fontFamily: FONT,
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(15,23,42,0.12)',
        padding: '16px 17px 15px',
      }}
    >
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
          marginTop: 8,
          fontSize: 13,
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

      <div
        style={{
          marginTop: 10,
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-0.03em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {scoreValue}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1,
          }}
        >
          {scoreLabel}
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          paddingTop: 13,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            overflow: 'hidden',
            flexShrink: 0,
            boxShadow: '0 0 0 2px #FBBC2E',
          }}
        >
          {avatarSrc ? (
            <SquircleAvatar
              size={36}
              src={avatarSrc}
              alt={holder}
              fallback={initials(holder)}
              hideRing
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'rgba(255,255,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              {initials(holder)}
            </div>
          )}
        </div>

        <div
          style={{
            minWidth: 0,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 13.5,
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {holder}
            </span>
            {hasHcp ? (
              <span
                style={{
                  fontSize: 13.5,
                  fontWeight: 800,
                  color: GOLD,
                  lineHeight: 1.2,
                  flexShrink: 0,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatHcp(row.holder_hcp)}
              </span>
            ) : null}
          </div>
          {club ? (
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {club}
            </div>
          ) : null}
        </div>
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
