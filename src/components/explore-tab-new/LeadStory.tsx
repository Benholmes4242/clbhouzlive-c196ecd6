import { useMemo, useState } from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useRegionFeats, sortRecordsAllTime, rowToPar, toParText, type FeatRow, type RecordsMode } from './hooks/useRegionFeats';
import { TierSeeAllSheet } from './TierSeeAllSheet';
import { useScorecardOpener } from './useScorecardOpener';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { SPACE } from '@/lib/spacing';
import { relativeTime } from '@/utils/relativeTime';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const GOLD = '#FBBC2E';
const UNDER_PAR = '#FF4D57';

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

interface Props {
  region: string | null;
  regionUpper: string;
  mode: RecordsMode;
}

export function LeadStory({ region, regionUpper, mode }: Props) {
  const { data } = useRegionFeats(region, 'records', mode);
  const [sheetOpen, setSheetOpen] = useState(false);
  const opener = useScorecardOpener();

  const rows = useMemo<FeatRow[]>(() => {
    const raw = data ?? [];
    return mode === 'alltime' ? sortRecordsAllTime(raw) : raw;
  }, [data, mode]);

  const record = rows[0];
  if (!record) return null;

  const image = record.thumbnail_image ?? record.course_image ?? null;
  const holder = formatHolderName(record.holder_name);
  const when = record.play_date ?? record.attained_at ?? null;
  const par = rowToPar(record);
  const isStableford = record.category === 'best_stableford_all_time';
  const numericValue =
    typeof record.value === 'number'
      ? record.value
      : typeof record.value === 'string' && record.value.trim() !== '' && !isNaN(Number(record.value))
        ? Number(record.value)
        : null;
  const grossText =
    numericValue != null ? String(numericValue) : record.feat_value ?? '';

  const overline = mode === 'alltime'
    ? `Deepest record · All time · ${regionUpper}`
    : `Latest course record · ${regionUpper}`;

  const bgImage = image
    ? `linear-gradient(180deg, rgba(15,23,42,0) 40%, rgba(15,23,42,0.72) 100%), url("${image}")`
    : undefined;
  const bgSolid = image ? undefined : 'linear-gradient(180deg, #3E5C3A, #23361F)';

  const handleRowTap = (row: FeatRow) => {
    if (row.score_id) opener.openByScore(row.score_id, null, row.user_id);
    else if (row.user_id) opener.openProfile(row.user_id);
  };

  const heroValue = par != null && !isStableford
    ? toParText(par)
    : grossText || '—';
  const heroColor = par != null && par < 0 && !isStableford ? UNDER_PAR : '#FFFFFF';
  const microLabel = par != null && !isStableford
    ? (grossText ? `${grossText} GROSS` : 'GROSS')
    : 'GROSS';

  return (
    <section style={{ marginTop: SPACE.sectionSection, padding: `0 ${SPACE.pagePadX}px` }}>
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="text-left active:scale-[0.995] transition-transform"
        style={{
          position: 'relative',
          width: '100%',
          minHeight: 210,
          borderRadius: 20,
          overflow: 'hidden',
          border: 'none',
          padding: '16px 18px 16px',
          cursor: 'pointer',
          fontFamily: FONT,
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: bgImage ?? bgSolid,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          boxShadow: '0 6px 22px rgba(15,23,42,0.16)',
        }}
      >
        {/* Overline row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
            position: 'relative',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: GOLD,
              lineHeight: 1,
            }}
          >
            {overline}
          </div>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              color: GOLD,
              lineHeight: 1,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            View all \u203A
          </span>
        </div>

        {/* Bottom row */}
        <div
          style={{
            marginTop: 24,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 12,
            position: 'relative',
          }}
        >
          {/* Left: course name + holder line */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 27,
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: '#FFFFFF',
                lineHeight: 1.02,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {record.course_name}
            </div>
            <div
              style={{
                marginTop: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 0,
              }}
            >
              <SquircleAvatar
                size={24}
                src={record.holder_avatar}
                alt={holder}
                fallback={initials(holder)}
                hairlineRing
                ringColor={GOLD}
              />
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minWidth: 0,
                }}
              >
                {holder}
              </span>
              {when ? (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.55)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {relativeTime(when)}
                </span>
              ) : null}
            </div>
          </div>

          {/* Right: to-par big number + microlabel */}
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              minWidth: 0,
            }}
          >
            <div
              className="tabular-nums"
              style={{
                fontSize: 56,
                fontWeight: 900,
                letterSpacing: '-0.035em',
                lineHeight: 0.9,
                color: heroColor,
              }}
            >
              {heroValue}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 9.5,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.65)',
                whiteSpace: 'nowrap',
              }}
            >
              {microLabel}
            </div>
          </div>
        </div>
      </button>

      <TierSeeAllSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tier="records"
        region={region}
        rows={rows}
        onRowTap={handleRowTap}
        initialMode={mode}
      />
      <RoundDetailSheet
        open={!!opener.target}
        onClose={opener.close}
        scoreId={opener.target?.scoreId ?? null}
        connectionId={opener.target?.connectionId ?? null}
        profileUserId={opener.target?.profileUserId ?? null}
      />
    </section>
  );
}

export default LeadStory;
