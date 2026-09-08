import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { TOUR_CONFIG, type TourId } from '@/features/tourhub/hooks/useOverviewData';
import { FONT } from '@/features/tourhub/_shared/tokens';

const TOUR_ORDER: TourId[] = ['pga', 'euro', 'lpga', 'liv', 'pgad', 'champ'];

export function TourFilterControl({
  value,
  onChange,
}: {
  value: TourId | null;
  onChange: (tour: TourId | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const options: Array<{ id: TourId | null; label: string }> = [
    { id: null, label: 'All tours' },
    ...TOUR_ORDER.map((id) => ({ id, label: TOUR_CONFIG[id].name })),
  ];
  const label = value ? TOUR_CONFIG[value].name : 'All tours';

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0 20px', fontFamily: FONT }}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          style={{
            height: 'auto',
            padding: '6px 12px',
            borderRadius: 999,
            border: `1px solid ${A.BORDER}`,
            background: A.PANEL,
            color: A.MUTE,
            fontFamily: FONT,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {label}
          <ChevronDown size={13} strokeWidth={2.2} aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          style={{
            height: 'auto',
            marginLeft: 'auto',
            padding: '6px 0 6px 8px',
            color: A.DIM,
            fontFamily: FONT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.11em',
          }}
        >
          EDIT
        </Button>
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} variant="dark" surfaceColor={A.PANEL} ariaLabelledBy="tour-filter-title">
        <div style={{ padding: '12px 20px 20px', fontFamily: FONT }}>
          <h2 id="tour-filter-title" style={{ margin: '0 0 12px', color: A.INK, fontSize: 20, fontWeight: 700, letterSpacing: '-0.034em' }}>
            Choose a tour
          </h2>
          {options.map((option) => {
            const selected = option.id === value;
            return (
              <Button
                key={option.id ?? 'all'}
                type="button"
                variant="ghost"
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  width: '100%',
                  height: 48,
                  justifyContent: 'space-between',
                  padding: 0,
                  borderRadius: 0,
                  borderBottom: `1px solid ${A.BORDER}`,
                  color: selected ? A.INK : A.MUTE,
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: selected ? 700 : 600,
                }}
              >
                {option.label}
                {selected && <Check size={18} strokeWidth={2.2} aria-hidden />}
              </Button>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
}

export default TourFilterControl;