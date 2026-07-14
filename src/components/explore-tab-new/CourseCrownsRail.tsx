import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useRegionFeats, type FeatRow } from './hooks/useRegionFeats';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { SPACE } from '@/lib/spacing';
import { formatHcp } from '@/lib/formatHcp';
import { FONT } from './gamingLightTokens';
import type { ScorecardOpener } from './useScorecardOpener';

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

function CrownCard({ row, opener }: { row: FeatRow; opener?: ScorecardOpener }) {
  const navigate = useNavigate();
  const holder = formatHolderName(row.holder_name);
  const isStableford = row.category === 'best_stableford_all_time';
  const scoreValue =
    row.value != null ? String(row.value) : row.feat_value ?? '--';
  const hasHcp = row.holder_hcp != null;
  const club = (row.holder_club ?? '').trim();
  const avatarSrc = row.holder_avatar ?? null;

  const numericValue =
    typeof row.value === 'number'
      ? row.value
      : typeof row.value === 'string' && row.value.trim() !== '' && !isNaN(Number(row.value))
      ? Number(row.value)
      : null;
  const showDelta =
    !isStableford && row.course_par != null && numericValue != null;
  const delta = showDelta ? numericValue! - (row.course_par as number) : 0;
  const deltaLabel =
    delta === 0 ? 'E' : delta < 0 ? `-${Math.abs(delta)}` : `+${delta}`;
  const deltaColor = delta < 0 ? '#D2222D' : '#FFFFFF';

  return (
    <button
      type="button"
      onClick={() => {
        if (row.score_id) opener?.openByScore(row.score_id, null, row.user_id);
        else if (row.course_id) navigate(`/courses/${row.course_id}`);
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
          justifyContent: 'space-between',
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
      </div>

      <div
        style={{
          marginTop: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1,
            letterSpacing: '0.02em',
          }}
        >
          {isStableford ? 'STABLEFORD' : `Par ${row.course_par ?? '--'}`}
        </div>
        {showDelta ? (
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: deltaColor,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {deltaLabel}
          </div>
        ) : null}
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
        <SquircleAvatar
          size={36}
          src={avatarSrc}
          alt={holder}
          fallback={initials(holder)}
          hairlineRing
          ringColor={GOLD}
        />

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
  opener?: ScorecardOpener;
}

export function CourseCrownsRail({ region, opener }: Props) {
  const navigate = useNavigate();
  const { data } = useRegionFeats(region, 'records');
  const rows = useMemo(() => (data ?? []).slice(0, 8), [data]);

  if (rows.length === 0) return null;

  return (
    <section style={{ marginTop: SPACE.sectionSection }}>
      <DiscoverSectionHeader
        eyebrow={`\u{1F451} Course Crowns \u00B7 ${regionUpperFor(region)}`}
        title="Course records"
        linkLabel="All"
        onLinkClick={() => navigate('/courses')}
      />
      <div
        className="flex overflow-x-auto scrollbar-hide"
        style={{ padding: '0 16px', gap: 9 }}
      >
        {rows.map((row, i) => (
          <CrownCard key={`${row.course_id ?? i}-${i}`} row={row} opener={opener} />
        ))}
      </div>
    </section>
  );
}

export default CourseCrownsRail;
