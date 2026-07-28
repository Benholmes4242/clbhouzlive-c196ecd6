import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
import { TOPAR_UNDER_LIGHT } from '@/features/tourhub/_shared/tokens';
import { StatRow } from './StatRow';
import { RoundFeatChips, useRoundFeatLabel } from './RoundFeatChips';
import { SectionHead } from './SectionHead';
import { CinematicLeadCard } from './CinematicLeadCard';
import { deriveRoundFeats } from '@/lib/gam/roundFeats';
import { LedgerSubline } from './PinIcon';

import { regionScopePhrase } from './regionScope';
import { EmptyScopeCard } from './EmptyScopeCard';
import { DiscoverBand } from './DiscoverBand';
import { isHideableScope, useReportRailEmpty, type OnRailEmpty } from './railEmptiness';
import { DiscoverYouStripMount } from './DiscoverYouStripMount';
import { slugToCacheRegion } from './regionScope';


const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const INK = '#0F172A';
const AMBER = '#F7931E';
const MUTED = 'rgba(15,23,42,0.45)';
const CHIP_BG = 'rgba(15,23,42,0.04)';
const TRACK_BG = 'rgba(15,23,42,0.08)';
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
  /** Rendered inside the canonical Discover containment card. */
  inCard?: boolean;
  /** Reports resolved-emptiness upward (see railEmptiness.ts). */
  onEmpty?: OnRailEmpty;
}

const LEDGER_ROWS = 5;
const CONQUEST_CAP = 6;

export function TheRecordBook({ region, mode, opener, userId, inCard = false, onEmpty }: Props) {
  const sectionMarginTop = inCard ? 0 : SPACE.sectionSection;
  const headerPaddingTop = inCard ? 12 : 0;
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data, isLoading } = useRegionFeats(region, 'records', mode);

  const allRows = useMemo(() => {
    const raw = data ?? [];
    return mode === 'alltime' ? sortRecordsAllTime(raw) : raw;
  }, [data, mode]);

  const ledgerRows = useMemo(() => allRows.slice(0, LEDGER_ROWS), [allRows]);

  const resolvedEmpty = !isLoading && ledgerRows.length === 0;
  useReportRailEmpty(onEmpty, resolvedEmpty && isHideableScope(region));

  // The containment card lives inside the component so a hidden rail takes
  // its card with it — no empty band left behind.
  const wrap = (node: React.ReactNode) =>
    inCard ? <DiscoverBand>{node}</DiscoverBand> : <>{node}</>;

  if (ledgerRows.length === 0) {
    if (region == null || isHideableScope(region)) return null;
    return wrap(
      <section style={{ marginTop: sectionMarginTop, fontFamily: FONT, color: INK }}>
        <SectionHead
          overline={mode === 'alltime' ? 'All-time course records' : 'Latest course records'}
          title="The record book"
          paddingX={PAGE_PAD}
          paddingTop={headerPaddingTop}
          paddingBottom={10}
        />
        <EmptyScopeCard
          title={`No records set ${regionScopePhrase(region)} yet — the book is open.`}
        />
      </section>,
    );
  }


  const handleRowTap = (row: FeatRow) => {
    if (row.score_id) opener?.openByScore(row.score_id, null, row.user_id);
    else if (row.user_id) opener?.openProfile(row.user_id);
  };

  // Lead entry goes cinematic only when the course actually has imagery;
  // otherwise it degrades to a normal row (never an empty gradient block).
  const lead = ledgerRows[0];
  const leadImage = lead?.thumbnail_image ?? lead?.course_image ?? null;
  const cinematic = !!leadImage;
  const restRows = cinematic ? ledgerRows.slice(1) : ledgerRows;

  return wrap(
    <section
      style={{
        marginTop: sectionMarginTop,
        fontFamily: FONT,
        color: INK,
      }}
    >
      <SectionHead
        overline={mode === 'alltime' ? 'All-time course records' : 'Latest course records'}
        title="The record book"
        meta="View all"
        onMeta={() => setSheetOpen(true)}
        paddingX={PAGE_PAD}
        paddingTop={headerPaddingTop}
        paddingBottom={10}
      />

      {cinematic ? (
        <RecordLeadCard row={lead} imageUrl={leadImage!} onTap={() => handleRowTap(lead)} />
      ) : null}

      {/* Ledger — unified flat StatRow list */}
      <div style={{ marginTop: cinematic ? 0 : 8 }}>
        {restRows.map((row, i) => (
          <RecordStatRow
            key={`${row.course_id ?? i}-${i}`}
            row={row}
            isLast={i === restRows.length - 1}
            onTap={() => handleRowTap(row)}
          />
        ))}
      </div>


      {/* G2 wiring — YouStrip under The Record Book only.
          Flag DISCOVER_YOU_STRIP OFF → renders nothing. */}
      <DiscoverYouStripMount
        railKey={mode === 'alltime'
          ? `records_alltime:${slugToCacheRegion(region)}`
          : `records:${slugToCacheRegion(region)}`}
        emptyMessage="Post a round to appear on the record book"
      />

      {/* NOTE: "Your next conquests" strip has moved into <AttackDefendBand />
          (the Attack tab). It used to render here as <ConquestsStrip />. */}


      <TierSeeAllSheet

        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tier="records"
        region={region}
        rows={allRows}
        onRowTap={handleRowTap}
        initialMode={mode}
      />
    </section>,
  );
}

// ---- Cinematic lead (most recent record) ----------------------------------
// Only rendered when the course has imagery; the caller falls back to a row.
function RecordLeadCard({
  row,
  imageUrl,
  onTap,
}: {
  row: FeatRow;
  imageUrl: string;
  onTap: () => void;
}) {
  const featLabel = useRoundFeatLabel();
  const holder = formatHolderName(row.holder_name) || row.holder_username || 'A member';
  const par = rowToPar(row);
  const isStableford = row.category === 'best_stableford_all_time';
  const showToPar = par != null && !isStableford;
  const numericValue =
    typeof row.value === 'number'
      ? row.value
      : typeof row.value === 'string' && row.value.trim() !== '' && !isNaN(Number(row.value))
        ? Number(row.value)
        : null;
  const grossText = numericValue != null ? String(numericValue) : row.feat_value ?? '';
  const chips = deriveRoundFeats(row).map((f) => ({ label: featLabel(f), tone: 'glass' as const }));

  return (
    <CinematicLeadCard
      imageUrl={imageUrl}
      alt={row.course_name}
      chips={chips}
      title={row.course_name}
      subtitle={holder}
      figure={showToPar ? toParText(par!) : grossText || '—'}
      figureLabel={grossText ? `${grossText} gross` : undefined}
      onTap={onTap}
    />
  );
}

// ---- Record Book row (flat StatRow) ---------------------------------------
// Recency list — no rank number (the "· 3w" timestamp is the ordering cue).
function RecordStatRow({
  row,
  isLast,
  onTap,
}: {
  row: FeatRow;
  isLast: boolean;
  onTap: () => void;
}) {
  const holder = formatHolderName(row.holder_name) || row.holder_username || 'A member';
  const par = rowToPar(row);
  const isStableford = row.category === 'best_stableford_all_time';
  const numericValue =
    typeof row.value === 'number'
      ? row.value
      : typeof row.value === 'string' && row.value.trim() !== '' && !isNaN(Number(row.value))
        ? Number(row.value)
        : null;
  const grossText = numericValue != null ? String(numericValue) : row.feat_value ?? '';
  const when = row.play_date ?? row.attained_at ?? null;
  const showToPar = par != null && !isStableford;
  const toParDisplay = showToPar ? toParText(par!) : '—';
  // Canonical to-par colour: red under par on the light Discover surface.
  const statColor = showToPar && par! < 0 ? TOPAR_UNDER_LIGHT : INK;
  const sub = <LedgerSubline courseName={row.course_name} />;
  const age = when ? relativeTime(when) : null;
  // Feat chips from stats joined into the cached payload; absent stats = no chips.
  const feats = deriveRoundFeats(row);
  return (
    <StatRow
      avatarUrl={row.holder_avatar}
      avatarUserId={row.user_id}
      name={holder}
      nameMeta={age ?? undefined}
      subline={sub}
      featChips={feats.length > 0 ? <RoundFeatChips feats={feats} /> : undefined}
      statValue={toParDisplay}
      statColor={statColor}
      statSubLabel={grossText ? `${grossText} GROSS` : undefined}
      isLast={isLast}
      onPress={onTap}
      density="compact"
    />
  );
}


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
