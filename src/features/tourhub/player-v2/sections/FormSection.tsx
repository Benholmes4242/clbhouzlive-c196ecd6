/**
 * FormSection - last 6 results as chips.
 *
 * A horizontal rail of discrete results, so chips are the correct treatment
 * here - do not convert to rows. Wins are marked with an amber border and an
 * INK eyebrow (never amber) with an AMBER_DEEP win tone, never a fill or a gradient. MC/WD/DQ mute to INK_FAINT
 * because a missed cut is genuinely absent of a result.
 * Section self-hides when < 2 rendered chips.
 */

import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { PlayerTournamentResult } from '../../hooks/usePlayerResults';
import {
  AMBER,
  AMBER_DEEP,
  HAIRLINE_INK_8,
  INK,
  INK_FAINT,
  SLATE_50,
  SURFACE,
} from '../../_shared/tokens';

interface FormSectionProps {
  results: PlayerTournamentResult[];
}

function chipLabel(r: PlayerTournamentResult, t: TFunction): string {
  const st = r.status?.toUpperCase();
  if (st === 'CUT' || st === 'MC') return t('player.form.status.mc');
  if (st === 'WD') return t('player.form.status.wd');
  if (st === 'DQ') return t('player.form.status.dq');
  if (r.position === null) return t('player.form.status.noResult');
  if (r.position === 1) return '1';
  return `${r.position_tied ? 'T' : ''}${r.position}`;
}

export function FormSection({ results }: FormSectionProps) {
  const { t } = useTranslation('tourhub');
  const last6 = results.slice(0, 6);
  if (last6.length < 2) return null;

  return (
    <section style={{ background: SLATE_50, padding: '16px 0 14px' }}>
      <p
        style={{
          margin: '0 16px 12px',
          fontSize: 11,
          fontWeight: 700,
          color: INK,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}
      >
        {t('player.form.eyebrow')}
      </p>
      <div
        style={{
          padding: '0 16px',
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {last6.map((r) => {
          const label = chipLabel(r, t);
          const st = r.status?.toUpperCase();
          const isWin = r.position === 1 && st !== 'WD';
          const isMissed = st === 'MC' || st === 'CUT' || st === 'WD' || st === 'DQ';
          return (
            <div
              key={r.id}
              style={{
                flex: '0 0 auto',
                minWidth: 56,
                padding: '9px 12px',
                borderRadius: 10,
                border: isWin ? `1px solid ${AMBER}` : `0.5px solid ${HAIRLINE_INK_8}`,
                background: isWin ? 'transparent' : SURFACE,
                textAlign: 'center' as const,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: isWin ? AMBER_DEEP : isMissed ? INK_FAINT : INK,
                  fontVariantNumeric: 'tabular-nums lining-nums',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
