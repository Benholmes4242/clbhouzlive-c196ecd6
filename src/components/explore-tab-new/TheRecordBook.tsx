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
import { formatRelativeMonths as relativeTime } from '@/i18n/format';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const INK = '#0F172A';
const AMBER = '#F7931E';
const UNDER_PAR = '#D2222D';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const BAND_BG = 'rgba(15,23,42,0.035)';
const MUTED = 'rgba(15,23,42,0.45)';
const FADED = 'rgba(15,23,42,0.35)';
const GHOST = 'rgba(15,23,42,0.45)';
const CHIP_BG = 'rgba(15,23,42,0.04)';
const TRACK_BG = 'rgba(15,23,42,0.08)';
const AVATAR_RING_MUTED = 'rgba(15,23,42,0.2)';
const CHEVRON_COLOR = 'rgba(15,23,42,0.3)';
const PAGE_PAD = 14;


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
  return CATEGORY_META[base]?.label ?? base.replace(/_/g, ' ');
}
// Render the record's headline value with the right unit. Mirrors the old
// caption unit derivation (CATEGORY_META), except Score (best_score_diff)
// reads as a differential rather than strokes.
function recordCopy(category: string, value: number): string {
  const base = stripWindow(category);
  if (base === 'best_score_diff') {
    const n = Math.round(value * 10) / 10;
    return `${n} differential`;
  }
  const meta = CATEGORY_META[base];
  const n = Math.round(value);
  if (!meta) return String(n);
  const unit = n === 1 ? meta.unitSingular : meta.unit;
  return `${n} ${unit}`;
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
    <section
      style={{
        marginTop: SPACE.sectionSection,
        fontFamily: FONT,
        color: INK,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          padding: `0 ${PAGE_PAD}px`,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: MUTED,
              lineHeight: 1,
            }}
          >
            {mode === 'alltime' ? 'All-time course records' : 'Latest course records'}
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: INK,
              lineHeight: 1.15,
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
            fontSize: 12,
            fontWeight: 600,
            fontFamily: FONT,
            whiteSpace: 'nowrap',
          }}
        >
          View all ›
        </button>
      </div>

      {/* Column caption row — 14px side padding; course caption offset to line up
          with the row's course text edge (rank 12 + gap 8 + avatar 24 + gap 8 = 52). */}
      <div
        style={{
          marginTop: 12,
          padding: `0 ${PAGE_PAD}px 0 ${PAGE_PAD + 52}px`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'rgba(15,23,42,0.35)',
          lineHeight: 1,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>Course</div>
        <div style={{ width: 40, textAlign: 'center' }}>To par</div>
        <div style={{ width: 30, textAlign: 'right' }}>Gross</div>
        <div style={{ width: 10 }} aria-hidden />
      </div>

      {/* Ledger — full-bleed banded table */}
      <div style={{ marginTop: 8 }}>
        {ledgerRows.map((row, i) => (
          <LedgerRow
            key={`${row.course_id ?? i}-${i}`}
            row={row}
            rank={i + 1}
            banded={i === 1 || i === 3}
            isLast={i === ledgerRows.length - 1}
            onTap={() => handleRowTap(row)}
            crown={i === 0 && mode === 'alltime'}
          />
        ))}
      </div>

      {/* Conquests sub-section (personal, does not follow Lens scope) */}
      <ConquestsStrip userId={userId} />

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
  banded,
  isLast,
  onTap,
  crown = false,
}: {
  row: FeatRow;
  rank: number;
  banded: boolean;
  isLast: boolean;
  onTap: () => void;
  crown?: boolean;
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
  const toParColor = showToPar && par! < 0 ? UNDER_PAR : INK;

  return (
    <button
      type="button"
      onClick={onTap}
      className="text-left active:opacity-80 transition-opacity"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: `10px ${PAGE_PAD}px`,
        width: '100%',
        background: banded ? BAND_BG : 'transparent',
        border: 'none',
        borderTop: `0.5px solid ${HAIRLINE}`,
        borderBottom: isLast ? `0.5px solid ${HAIRLINE}` : 'none',
        cursor: 'pointer',
        fontFamily: FONT,
        color: INK,
      }}
    >
      {/* Rank */}
      <div
        style={{
          width: 12,
          flexShrink: 0,
          fontSize: crown ? 13 : 11,
          fontWeight: 600,
          color: FADED,
          ...(crown ? {} : { fontVariantNumeric: 'tabular-nums' as const }),
          textAlign: 'center',
        }}
      >
        {crown ? '\u{1F3C6}' : rank}
      </div>



      {/* Avatar */}
      <div style={{ flexShrink: 0 }}>
        <SquircleAvatar
          size={24}
          src={row.holder_avatar}
          alt={holder}
          fallback={initials(holder)}
          hairlineRing
          ringColor={AVATAR_RING_MUTED}
        />
      </div>

      {/* Middle: course + holder line */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: INK,
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
            fontSize: 11,
            fontWeight: 500,
            color: MUTED,
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

      {/* To par column */}
      <div
        className="tabular-nums"
        style={{
          width: 36,
          flexShrink: 0,
          textAlign: 'center',
          fontSize: 14,
          fontWeight: 700,
          color: toParColor,
          lineHeight: 1,
        }}
      >
        {toParDisplay}
      </div>

      {/* Gross column */}
      <div
        className="tabular-nums"
        style={{
          width: 26,
          flexShrink: 0,
          textAlign: 'right',
          fontSize: 11,
          fontWeight: 500,
          color: GHOST,
          lineHeight: 1,
        }}
      >
        {grossText || '—'}
      </div>

      {/* Chevron */}
      <span style={{ width: 12, textAlign: 'right', fontSize: 12, fontWeight: 600, color: CHEVRON_COLOR, lineHeight: 1, flexShrink: 0 }}>›</span>
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
        paddingLeft: PAGE_PAD,
        paddingRight: PAGE_PAD,
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: MUTED,
          lineHeight: 1,
          padding: '0 0 10px',
        }}
      >
        Your next conquests
      </div>
      <div
        className="flex overflow-x-auto scrollbar-hide"
        style={{
          gap: 8,
          margin: `0 -${PAGE_PAD}px`,
          paddingLeft: PAGE_PAD,
          paddingRight: PAGE_PAD,
        }}
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
  const category = categoryLabel(row.category);
  const record = recordCopy(row.category, row.leader_value);
  return (
    <button
      type="button"
      onClick={() => navigate(`/courses/${row.course_id}?tab=legends`)}
      className="text-left active:opacity-80 transition-opacity"
      style={{
        flexShrink: 0,
        width: 196,
        borderRadius: 10,
        background: CHIP_BG,
        border: 'none',
        padding: '10px 11px',
        cursor: 'pointer',
        fontFamily: FONT,
        color: INK,
      }}
    >
      {/* Line 1: course name */}
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          color: INK,
          lineHeight: 1.2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {row.course_name}
      </div>
      {/* Line 2: {Category} · record {value-with-unit} */}
      <div
        style={{
          marginTop: 3,
          fontSize: 10.5,
          fontWeight: 500,
          color: 'rgba(15,23,42,0.5)',
          lineHeight: 1.2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {`${category} · record ${record}`}
      </div>
      {/* Bar */}
      <div
        style={{
          marginTop: 8,
          height: 3,
          borderRadius: 999,
          background: TRACK_BG,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.max(8, pct)}%`,
            height: '100%',
            background: AMBER,
            borderRadius: 999,
          }}
        />
      </div>
      {/* Line 3: {gap} to take it */}
      <div
        style={{
          marginTop: 7,
          fontSize: 11,
          fontWeight: 500,
          color: 'rgba(15,23,42,0.55)',
          lineHeight: 1.25,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ color: INK, fontWeight: 700 }}>{gap}</span>
        {' '}to take it
      </div>
    </button>
  );
}


export default TheRecordBook;
