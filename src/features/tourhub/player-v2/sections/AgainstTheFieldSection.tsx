import { useTranslation } from 'react-i18next';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { HAIRLINE_INK_8, INK, INK_FAINT, SLATE_50 } from '../../_shared/tokens';
import type { PlayerSeasonSelection, PlayerSeasonStat } from '../playerSeason';
import { playerOrdinal } from '../playerOrdinal';

function StatRow({ row, strength }: { row: PlayerSeasonStat; strength: boolean }) {
  const { t } = useTranslation('tourhub');
  return (
    <div style={{ minHeight: 52, padding: '10px 16px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', alignItems: 'center', gap: 16, borderTop: `0.5px solid ${HAIRLINE_INK_8}` }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>{row.label}</div>
        <div style={{ marginTop: 3, fontSize: 11, color: INK_FAINT }}>{strength ? t('player.field.strength') : t('player.field.watch')}</div>
      </div>
      <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums lining-nums' }}>
        <div style={{ fontSize: 15, fontWeight: 750, color: strength ? A.GREEN : INK }}>{row.valueFormatted}</div>
        <div style={{ marginTop: 2, fontSize: 10, fontWeight: 700, color: INK_FAINT }}>{playerOrdinal(t, row)}</div>
      </div>
    </div>
  );
}

export function AgainstTheFieldSection({ selection }: { selection: PlayerSeasonSelection }) {
  const { t } = useTranslation('tourhub');
  if (selection.strengths.length === 0 && selection.weaknesses.length === 0) return null;
  return (
    <section style={{ background: SLATE_50, padding: '18px 0 8px' }}>
      <p style={{ margin: '0 16px 12px', fontSize: 11, fontWeight: 700, color: INK, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{t('player.field.eyebrow')}</p>
      {selection.strengths.map((row) => <StatRow key={row.key} row={row} strength />)}
      {selection.weaknesses.map((row) => <StatRow key={row.key} row={row} strength={false} />)}
    </section>
  );
}