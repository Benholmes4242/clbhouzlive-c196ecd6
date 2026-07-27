import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHardestHoles, type HoleIndexMode, type HardestHoleRow } from '@/hooks/gam/useHardestHoles';
import { SectionHead } from './SectionHead';
import { DiscoverBand } from './DiscoverBand';
import { regionScopePhrase, matchesRegionScope } from './regionScope';
import { FONT } from './gamingLightTokens';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { AMBER, INK, INK_MUTE, SLATE_50 } from '@/features/tourhub/_shared/tokens';
import { REGION_TABS } from './AlmanacSections';

const RED = '#D2222D';
const GREEN = '#0F8F4A';
const INK_COLOR = '#0F172A';
const MUTE = 'rgba(15,23,42,0.45)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const CARD_BG = '#FFFFFF';
const CARD_SHADOW = '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)';
const MAX = 10;

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

const numFmt = (n: number | null | undefined, d = 1) =>
  n == null || Number.isNaN(Number(n)) ? '–' : Number(n).toFixed(d);

function regionLabel(slug: string | null | undefined): string {
  return REGION_TABS.find((t) => t.slug === slug)?.label ?? 'Worldwide';
}

// Vertical list row (band). Cards are for horizontal rails only.
function HardestHoleRow({
  courseId,
  courseName,
  holeNo,
  par,
  playsTo,
  rounds,
  accent,
  isLast,
}: {
  courseId: string;
  courseName: string;
  holeNo: number;
  par: number;
  playsTo: number;
  rounds: number;
  accent: string;
  isLast: boolean;
}) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(`/courses/${courseId}`, { state: { activeTab: 'holes' } })}
      className="w-full text-left active:opacity-90 transition-opacity"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        background: 'transparent',
        border: 'none',
        borderBottom: isLast ? 'none' : `1px solid ${HAIRLINE}`,
        padding: '11px 16px',
        cursor: 'pointer',
        fontFamily: FONT,
      }}
    >
      <div
        className="tabular-nums"
        style={{
          width: 46,
          flexShrink: 0,
          fontSize: 20,
          fontWeight: 800,
          color: INK_COLOR,
          letterSpacing: '-0.03em',
          lineHeight: 1,
        }}
      >
        {ordinal(holeNo)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: INK_COLOR,
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {courseName}
        </div>
        <div
          className="tabular-nums"
          style={{
            marginTop: 3,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: MUTE,
          }}
        >
          Par {par} · {rounds} rounds
        </div>
      </div>
      <div
        className="tabular-nums"
        style={{
          flexShrink: 0,
          fontSize: 16,
          fontWeight: 700,
          color: accent,
          letterSpacing: '-0.02em',
        }}
      >
        {numFmt(playsTo, 1)}
      </div>
    </button>
  );
}

export function HardestHolesRail({ region }: { region?: string | null } = {}) {
  const [mode, setMode] = useState<HoleIndexMode>('hardest');
  const { data } = useHardestHoles(mode);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(
    () => (data ?? []).filter((h) => matchesRegionScope(region, h.country, h.region)),
    [data, region],
  );
  const rows = filtered.slice(0, MAX);
  const accent = mode === 'easiest' ? GREEN : RED;
  const scope = regionScopePhrase(region);
  const title = mode === 'easiest' ? `The easiest holes ${scope}` : `The toughest holes ${scope}`;

  if (rows.length === 0) return null;

  return (
    <DiscoverBand marginTop={32}>
      <div style={{ padding: '12px 16px 0' }}>
        <SectionHead
          overline="Hole index"
          title={title}
          meta="View all"
          onMeta={() => setSheetOpen(true)}
          paddingX={0}
          paddingBottom={10}
        />
        <div
          role="tablist"
          aria-label="Hole index mode"
          style={{
            display: 'inline-flex',
            gap: 2,
            padding: 2,
            background: '#FFFFFF',
            border: '1px solid rgba(15,23,42,0.08)',
            borderRadius: 999,
            marginTop: 2,
            marginBottom: 12,
          }}
        >
          {([
            { v: 'hardest', label: 'Toughest' },
            { v: 'easiest', label: 'Scoreable' },
          ] as const).map((o) => {
            const active = mode === o.v;
            return (
              <button
                key={o.v}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMode(o.v)}
                style={{
                  padding: '5px 11px',
                  borderRadius: 999,
                  background: active ? '#15171F' : 'transparent',
                  color: active ? '#FFFFFF' : 'rgba(15,23,42,0.55)',
                  border: 'none',
                  fontFamily: FONT,
                  fontSize: 10.5,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {rows.map((h, i) => (
          <HardestHoleRow
            key={`${h.course_id}-${h.hole_no}`}
            courseId={h.course_id}
            courseName={h.course_name}
            holeNo={h.hole_no}
            par={h.par}
            playsTo={h.plays_to}
            rounds={h.rounds}
            accent={accent}
            isLast={i === rows.length - 1}
          />
        ))}
      </div>

      <HoleIndexSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        rows={filtered.slice(0, 30)}
        mode={mode}
        region={region ?? null}
        title={title}
      />
    </DiscoverBand>
  );
}

function HoleIndexSheet({
  open,
  onClose,
  rows,
  mode,
  region,
  title,
}: {
  open: boolean;
  onClose: () => void;
  rows: HardestHoleRow[];
  mode: HoleIndexMode;
  region: string | null;
  title: string;
}) {
  const navigate = useNavigate();
  const accent = mode === 'easiest' ? GREEN : RED;
  const total = rows.length;

  const handleRowTap = (courseId: string) => {
    onClose();
    setTimeout(() => {
      navigate(`/courses/${courseId}`, { state: { activeTab: 'holes' } });
    }, 60);
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="hole-index-sheet-title"
      variant="light"
      surfaceColor={SLATE_50}
      style={{
        height: '75dvh',
        maxHeight: '75dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT,
        background: SLATE_50,
      }}
    >
      <div style={{ padding: '10px 16px 12px', background: SLATE_50 }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: AMBER,
            marginBottom: 4,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {regionLabel(region)} {'\u00B7'} WHS {'\u00B7'} {total} {total === 1 ? 'HOLE' : 'HOLES'}
        </div>
        <div
          id="hole-index-sheet-title"
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: INK,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: SLATE_50,
          padding: '4px 0 24px',
        }}
      >
        {rows.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', color: INK_MUTE, fontSize: 12, fontWeight: 600 }}>
            None yet.
          </div>
        ) : (
          rows.map((h, i) => (
            <button
              key={`${h.course_id}-${h.hole_no}`}
              type="button"
              onClick={() => handleRowTap(h.course_id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: i === rows.length - 1 ? 'none' : `0.5px solid ${HAIRLINE}`,
                fontFamily: FONT,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div
                className="tabular-nums"
                style={{
                  flexShrink: 0,
                  width: 24,
                  fontSize: 13,
                  fontWeight: 700,
                  color: INK_MUTE,
                  letterSpacing: '-0.01em',
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: INK,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {ordinal(h.hole_no)} {'\u00B7'} {h.course_name}
                </div>
                <div
                  className="tabular-nums"
                  style={{
                    marginTop: 3,
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: accent,
                    letterSpacing: '0.01em',
                  }}
                >
                  Par {h.par} · plays to {numFmt(h.plays_to, 1)}
                </div>
              </div>
              <div
                className="tabular-nums"
                style={{
                  flexShrink: 0,
                  fontSize: 10,
                  fontWeight: 600,
                  color: MUTE,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {h.rounds} rds
              </div>
            </button>
          ))
        )}
      </div>
    </BottomSheet>
  );
}

export default HardestHolesRail;
