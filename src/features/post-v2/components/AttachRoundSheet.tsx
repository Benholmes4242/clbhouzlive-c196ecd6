// AttachRoundSheet - pick one of the viewer's logged rounds at the tagged
// course. Always optional: "None" sits at the top and clears the link.

import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BottomSheet from './BottomSheet';
import { formatWeekdayDayMonthShortGB } from '@/i18n/format';
import type { MyRoundAtCourse } from '@/hooks/feed/useMyRoundsAtCourse';
import { CT } from '@/features/_shared/composerTokens';

interface Props {
  open: boolean;
  onClose: () => void;
  rounds: MyRoundAtCourse[];
  selectedId: string | null;
  onSelect: (round: MyRoundAtCourse | null) => void;
}

export function formatToParShort(gross: number | null, par: number | null): string | null {
  if (gross == null || par == null) return null;
  const delta = gross - par;
  if (delta === 0) return 'E';
  return delta > 0 ? `+${delta}` : `\u2212${Math.abs(delta)}`;
}

export function formatRoundLabel(r: MyRoundAtCourse): string {
  const date = formatWeekdayDayMonthShortGB(new Date(`${r.playDate.slice(0, 10)}T00:00:00`));
  const parts: string[] = [date];
  if (r.grossScore != null) {
    const toPar = formatToParShort(r.grossScore, r.coursePar);
    parts.push(toPar ? `${r.grossScore} (${toPar})` : `${r.grossScore}`);
  }
  if (r.teeMarker) parts.push(r.teeMarker);
  return parts.join(' - ');
}

export default function AttachRoundSheet({ open, onClose, rounds, selectedId, onSelect }: Props) {
  const { t } = useTranslation('composer');
  return (
    <BottomSheet open={open} title={t('attachRound.title')} onClose={onClose}>
      <div style={{ paddingBottom: 8 }}>
        <RowButton
          label={t('attachRound.none')}
          selected={!selectedId}
          onClick={() => { onSelect(null); onClose(); }}
        />
        {rounds.map((r) => (
          <RowButton
            key={r.whsScoreId}
            label={formatRoundLabel(r)}
            selected={selectedId === r.whsScoreId}
            onClick={() => { onSelect(r); onClose(); }}
          />
        ))}
      </div>
    </BottomSheet>
  );
}

function RowButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        background: 'transparent',
        border: 0,
        borderTop: '1px solid rgba(0,0,0,0.07)',
        padding: '14px 16px',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: 14, fontWeight: selected ? 700 : 500, color: CT.ink, flex: 1 }}>{label}</span>
      {selected && <Check size={16} color={CT.amber} />}
    </button>
  );
}
