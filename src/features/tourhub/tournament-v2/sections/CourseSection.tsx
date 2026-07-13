/**
 * CourseSection — TD1 constants: HARDEST / EASIEST cards from hole aggs.
 * Section self-hides when no aggregate data. 'All 18 holes >' opens
 * HolesSheet (sibling below).
 */
import { useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SectionEyebrow } from './SectionEyebrow';
import { useHoleAggregates, type HoleAgg } from '../data/useHoleAggregates';
import {
  FONT, INK, INK_MUTE, INK_FAINT, SURFACE, HAIRLINE_INK_8, SLATE_50,
  TOPAR_UNDER_LIGHT, TOPAR_OVER_LIGHT,
} from '../../_shared/tokens';

interface Props { tournamentId: string }

function diffColor(diff: number | null): string {
  if (diff == null) return INK;
  if (diff > 0.05) return TOPAR_OVER_LIGHT;
  if (diff < -0.05) return TOPAR_UNDER_LIGHT;
  return INK_MUTE;
}
function fmtDiff(diff: number | null): string {
  if (diff == null) return '—';
  if (Math.abs(diff) < 0.005) return '±0.00';
  return diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
}

export function CourseSection({ tournamentId }: Props) {
  const { data: aggs = [] } = useHoleAggregates(tournamentId);
  const [open, setOpen] = useState(false);

  const played = aggs.filter((a) => a.avg != null);
  if (played.length === 0) return null;

  const sorted = [...played].sort((a, b) => (b.diff ?? 0) - (a.diff ?? 0));
  const hardest = sorted[0];
  const easiest = sorted[sorted.length - 1];

  const Card = ({ label, h }: { label: string; h: HoleAgg }) => (
    <div
      style={{
        flex: 1, background: SURFACE, borderRadius: 12,
        border: `0.5px solid ${HAIRLINE_INK_8}`, padding: '12px 14px',
        fontFamily: FONT,
      }}
    >
      <div style={{ fontSize: 8.5, fontWeight: 800, color: INK_FAINT, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
        <span style={{ fontSize: 24, fontWeight: 200, color: INK, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {h.hole}
        </span>
        {h.par != null && (
          <span style={{ fontSize: 10, fontWeight: 700, color: INK_MUTE, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Par {h.par}
          </span>
        )}
      </div>
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: INK_FAINT, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
          Avg vs par
        </span>
        <span style={{ fontSize: 14, fontWeight: 800, color: diffColor(h.diff), fontVariantNumeric: 'tabular-nums' }}>
          {fmtDiff(h.diff)}
        </span>
      </div>
    </div>
  );

  return (
    <>
      <SectionEyebrow kicker="The Course" actionLabel="All 18 holes" onAction={() => setOpen(true)} />
      <div style={{ display: 'flex', gap: 12, padding: '0 16px 4px' }}>
        <Card label="Hardest" h={hardest} />
        <Card label="Easiest" h={easiest} />
      </div>
      <HolesSheet open={open} onClose={() => setOpen(false)} aggs={aggs} />
    </>
  );
}

function HolesSheet({ open, onClose, aggs }: { open: boolean; onClose: () => void; aggs: HoleAgg[] }) {
  return (
    <BottomSheet open={open} onClose={onClose} variant="light" surfaceColor={SLATE_50}>
        <div style={{ background: SLATE_50, fontFamily: FONT, maxHeight: 'calc(90vh - 24px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '4px 16px 10px' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: INK, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              All 18 Holes
            </div>
          </div>
          <div
            style={{
              position: 'sticky', top: 0, zIndex: 2,
              display: 'flex', alignItems: 'center',
              padding: '8px 16px', background: SLATE_50,
            borderTop: `1px solid ${HAIRLINE_INK_8}`, borderBottom: `1px solid ${HAIRLINE_INK_8}`,
            fontSize: 8, fontWeight: 800, letterSpacing: '0.08em',
            color: INK_MUTE, textTransform: 'uppercase',
          }}
        >
          <div style={{ width: 32, flexShrink: 0 }}>HOLE</div>
          <div style={{ width: 40, flexShrink: 0, textAlign: 'center' }}>PAR</div>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>YDS</div>
          <div style={{ width: 62, flexShrink: 0, textAlign: 'center' }}>AVG</div>
          <div style={{ width: 62, flexShrink: 0, textAlign: 'right' }}>VS PAR</div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {aggs.map((h) => (
            <div
              key={h.hole}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '9px 16px', borderBottom: `1px solid ${HAIRLINE_INK_8}`,
                background: SLATE_50,
              }}
            >
              <div style={{ width: 32, flexShrink: 0, fontSize: 12, fontWeight: 800, color: INK, fontVariantNumeric: 'tabular-nums' }}>{h.hole}</div>
              <div style={{ width: 40, flexShrink: 0, textAlign: 'center', fontSize: 11.5, color: INK_MUTE, fontVariantNumeric: 'tabular-nums' }}>{h.par ?? '—'}</div>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: 11.5, color: INK_MUTE, fontVariantNumeric: 'tabular-nums' }}>{h.yardage ?? '—'}</div>
              <div style={{ width: 62, flexShrink: 0, textAlign: 'center', fontSize: 12, fontWeight: 700, color: INK, fontVariantNumeric: 'tabular-nums' }}>
                {h.avg != null ? h.avg.toFixed(2) : '—'}
              </div>
              <div style={{ width: 62, flexShrink: 0, textAlign: 'right', fontSize: 12, fontWeight: 800, color: diffColor(h.diff), fontVariantNumeric: 'tabular-nums' }}>
                {fmtDiff(h.diff)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}
