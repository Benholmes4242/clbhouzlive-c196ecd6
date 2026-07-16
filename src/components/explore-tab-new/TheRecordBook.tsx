import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { TierSeeAllSheet } from './TierSeeAllSheet';
import {
  useRegionFeats,
  sortRecordsAllTime,
  rowToPar,
  toParText,
  type FeatRow,
  type RecordsMode,
} from './hooks/useRegionFeats';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import { useTitlesInReach, type TitleInReach } from '@/hooks/gam/useTitlesInReach';
import type { ScorecardOpener } from './useScorecardOpener';
import { SPACE } from '@/lib/spacing';
import { relativeTime } from '@/utils/relativeTime';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const PANEL_BG = '#15171F';
const GOLD = '#FBBC2E';
const AMBER = '#F7931E';
const UNDER_PAR = '#FF4D57';
const HAIRLINE_DARK = 'rgba(255,255,255,0.07)';
const CONQUEST_HAIRLINE = 'rgba(255,255,255,0.1)';

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

// ---- Conquests helpers (retained from NextConquestsRail) ------------------
const CATEGORY_META: Record<
  string,
  { label: string; unit: string; unitSingular: string }
> = {
  lowest_gross: { label: 'Gross', unit: 'strokes', unitSingular: 'stroke' },
  best_score_diff: { label: 'Score', unit: 'strokes', unitSingular: 'stroke' },
  most_birdies: { label: 'Birdies', unit: 'birdies', unitSingular: 'birdie' },
  best_stableford: { label: 'Stableford', unit: 'points', unitSingular: 'point' },
  most_eagles: { label: 'Eagles', unit: 'eagles', unitSingular: 'eagle' },
  most_aces: { label: 'Hole-in-one', unit: 'aces', unitSingular: 'ace' },
  most_rounds: { label: 'Most rounds', unit: 'rounds', unitSingular: 'round' },
};
function stripWindow(category: string): string {
  return category.replace(/_(90d|all_time)$/, '');
}
function gapCopy(category: string, gap: number): string {
  const base = stripWindow(category);
  const meta = CATEGORY_META[base];
  const n = Math.max(0, Math.round(gap));
  if (!meta) return `${n} off the record`;
  const unit = n === 1 ? meta.unitSingular : meta.unit;
  return `${n} ${unit}`;
}
function categoryLabel(category: string): string {
  const base = stripWindow(category);
  return (CATEGORY_META[base]?.label ?? base.replace(/_/g, ' ')).toUpperCase();
}
function progressPct(_category: string, gap: number): number {
  const n = Math.max(1, Math.round(gap));
  return Math.max(20, 96 - (n - 1) * 14);
}

// ---- Panel ----------------------------------------------------------------
interface Props {
  region: string | null;
  mode: RecordsMode;
  opener?: ScorecardOpener;
  userId: string | undefined;
}

const LEDGER_ROWS = 5;
const CONQUEST_CAP = 6;

export function TheRecordBook({ region, mode, opener, userId }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data } = useRegionFeats(region, 'records', mode);

  const allRows = useMemo(() => {
    const raw = data ?? [];
    return mode === 'alltime' ? sortRecordsAllTime(raw) : raw;
  }, [data, mode]);

  const ledgerRows = useMemo(() => allRows.slice(0, LEDGER_ROWS), [allRows]);

  if (ledgerRows.length === 0) return null;

  const handleRowTap = (row: FeatRow) => {
    if (row.score_id) opener?.openByScore(row.score_id, null, row.user_id);
    else if (row.user_id) opener?.openProfile(row.user_id);
  };

  return (
    <section style={{ marginTop: SPACE.sectionSection, padding: `0 ${SPACE.pagePadX}px` }}>
      <div
        style={{
          background: PANEL_BG,
          borderRadius: 20,
          padding: '16px 16px 14px',
          fontFamily: FONT,
          color: '#FFFFFF',
          boxShadow: '0 6px 22px rgba(15,23,42,0.16)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1,
              }}
            >
              {`Course crowns · ${regionUpperFor(region)}`}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 19,
                fontWeight: 800,
                letterSpacing: '-0.01em',
                color: '#FFFFFF',
                lineHeight: 1.1,
              }}
            >
              The record book
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            style={{
              flexShrink: 0,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: AMBER,
              fontSize: 11.5,
              fontWeight: 800,
              fontFamily: FONT,
              letterSpacing: '-0.005em',
              whiteSpace: 'nowrap',
            }}
          >
            View all ›
          </button>
        </div>

        {/* Ledger */}
        <div style={{ marginTop: 10 }}>
          {ledgerRows.map((row, i) => (
            <LedgerRow
              key={`${row.course_id ?? i}-${i}`}
              row={row}
              rank={i + 1}
              onTap={() => handleRowTap(row)}
            />
          ))}
        </div>

        {/* Conquests sub-section (personal, does not follow Lens scope) */}
        <ConquestsStrip userId={userId} />
      </div>

      <TierSeeAllSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tier="records"
        region={region}
        rows={allRows}
        onRowTap={handleRowTap}
        initialMode={mode}
      />
    </section>
  );
}

// ---- Ledger row -----------------------------------------------------------
function LedgerRow({
  row,
  rank,
  onTap,
}: {
  row: FeatRow;
  rank: number;
  onTap: () => void;
}) {
  const holder = formatHolderName(row.holder_name);
  const par = rowToPar(row);
  const isStableford = row.category === 'best_stableford_all_time';
  const numericValue =
    typeof row.value === 'number'
      ? row.value
      : typeof row.value === 'string' && row.value.trim() !== '' && !isNaN(Number(row.value))
        ? Number(row.value)
        : null;
  const grossText =
    numericValue != null ? String(numericValue) : row.feat_value ?? '';
  const when = row.play_date ?? row.attained_at ?? null;

  const showToPar = par != null && !isStableford;
  const toParDisplay = showToPar ? toParText(par!) : '—';
  const toParColor = showToPar && par! < 0 ? UNDER_PAR : '#FFFFFF';
  const isFirst = rank === 1;

  return (
    <button
      type="button"
      onClick={onTap}
      className="text-left active:opacity-80 transition-opacity"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 4px',
        width: '100%',
        background: 'transparent',
        border: 'none',
        borderTop: isFirst ? 'none' : `0.5px solid ${HAIRLINE_DARK}`,
        cursor: 'pointer',
        fontFamily: FONT,
        color: '#FFFFFF',
      }}
    >
      {/* Rank */}
      <div
        style={{
          width: 16,
          flexShrink: 0,
          fontSize: 11,
          fontWeight: 800,
          color: isFirst ? GOLD : 'rgba(255,255,255,0.35)',
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'center',
        }}
      >
        {rank}
      </div>

      {/* Avatar */}
      <div style={{ flexShrink: 0 }}>
        <SquircleAvatar
          size={24}
          src={row.holder_avatar}
          alt={holder}
          fallback={initials(holder)}
          hairlineRing
          ringColor={isFirst ? GOLD : 'rgba(255,255,255,0.2)'}
        />
      </div>

      {/* Middle: course + holder line */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 800,
            color: '#FFFFFF',
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
            marginTop: 2,
            fontSize: 10,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {holder}
          {when ? ` · ${relativeTime(when)}` : ''}
        </div>
      </div>

      {/* Right: to-par + gross */}
      <div
        style={{
          width: 62,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        <div
          className="tabular-nums"
          style={{
            fontSize: 16,
            fontWeight: 900,
            letterSpacing: '-0.02em',
            color: toParColor,
            lineHeight: 1,
          }}
        >
          {toParDisplay}
        </div>
        {grossText ? (
          <div
            className="tabular-nums"
            style={{
              marginTop: 3,
              fontSize: 9.5,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.4)',
              lineHeight: 1,
            }}
          >
            {grossText}
          </div>
        ) : null}
      </div>
    </button>
  );
}

// ---- Conquests sub-section ------------------------------------------------
function ConquestsStrip({ userId }: { userId: string | undefined }) {
  const { user } = useSupabaseSession();
  const effectiveUserId = userId ?? user?.id;
  const { data: connection } = useWhsConnection(effectiveUserId);
  const { data } = useTitlesInReach(effectiveUserId);

  const seedRef = useRef(Math.random());
  const picks = useMemo(() => {
    if (!data || data.length === 0) return [];
    const seen = new Set<string>();
    const unique: TitleInReach[] = [];
    for (const row of data) {
      if (seen.has(row.course_id)) continue;
      seen.add(row.course_id);
      unique.push(row);
    }
    let s = Math.floor(seedRef.current * 2 ** 32) || 1;
    const rand = () => {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const arr = unique.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, CONQUEST_CAP);
  }, [data]);

  if (!effectiveUserId || !connection) return null;
  if (picks.length === 0) return null;

  return (
    <div
      style={{
        marginTop: 14,
        paddingTop: 12,
        borderTop: `1px solid ${CONQUEST_HAIRLINE}`,
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: GOLD,
          lineHeight: 1,
          padding: '0 4px 10px',
        }}
      >
        Your next conquests
      </div>
      <div
        className="flex overflow-x-auto scrollbar-hide"
        style={{ gap: 8, margin: '0 -16px', padding: '0 16px' }}
      >
        {picks.map((row) => (
          <ConquestChip key={`${row.course_id}-${row.category}`} row={row} />
        ))}
      </div>
    </div>
  );
}

function ConquestChip({ row }: { row: TitleInReach }) {
  const navigate = useNavigate();
  const pct = progressPct(row.category, row.gap);
  const gap = gapCopy(row.category, row.gap);
  return (
    <button
      type="button"
      onClick={() => navigate(`/courses/${row.course_id}?tab=legends`)}
      className="text-left active:opacity-80 transition-opacity"
      style={{
        flexShrink: 0,
        width: 172,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.09)',
        padding: '10px 11px',
        cursor: 'pointer',
        fontFamily: FONT,
        color: '#FFFFFF',
      }}
    >
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 800,
          color: '#FFFFFF',
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
          marginTop: 3,
          fontSize: 8.5,
          fontWeight: 800,
          letterSpacing: '0.1em',
          color: AMBER,
          textTransform: 'uppercase',
          lineHeight: 1.2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {categoryLabel(row.category)}
      </div>
      <div
        style={{
          marginTop: 8,
          height: 4,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.12)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.max(8, pct)}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${AMBER}, ${GOLD})`,
            borderRadius: 999,
          }}
        />
      </div>
      <div
        style={{
          marginTop: 7,
          fontSize: 10,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.25,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ color: GOLD, fontWeight: 800 }}>{gap}</span>
        {' '}to take it ({row.leader_value})
      </div>
    </button>
  );
}

export default TheRecordBook;
