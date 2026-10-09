import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SANS } from '@/components/explore-tab-new/courseled/tokens';
import {
  BOARD_LABELS,
  OFFERED_RANKING_BOARD_KEYS,
  type BoardKey,
} from '@/components/explore-tab-new/courseled/boardFilters';

/**
 * THE BOARD PICKER — opened by the board title's chevron. Lists the offered
 * ranking boards only (OFFERED_RANKING_BOARD_KEYS, the same list the filter
 * panel offers). Tapping one picks it and closes; feats and every other axis
 * live in the full filter panel behind the Filters pill.
 */
export function BoardPicker({
  open,
  onClose,
  board,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  board: BoardKey;
  onPick: (next: BoardKey) => void;
}) {
  const { t } = useTranslation();
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div role="listbox" aria-label={t('amateur.board.openPicker', 'Choose a board')} style={{ fontFamily: SANS, padding: '4px 16px 24px' }}>
        {OFFERED_RANKING_BOARD_KEYS.map((key, i) => {
          const selected = key === board;
          return (
            <button
              key={key}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => {
                onPick(key);
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '14px 0',
                border: 0,
                borderTop: i === 0 ? 'none' : `0.5px solid ${A.HAIRLINE}`,
                background: 'transparent',
                textAlign: 'left',
                fontFamily: SANS,
                fontSize: 15,
                fontWeight: selected ? 700 : 500,
                color: selected ? A.INK : A.MUTE,
                cursor: 'pointer',
              }}
            >
              <span style={{ flex: 1 }}>{t(BOARD_LABELS[key].i18n, BOARD_LABELS[key].label)}</span>
              {selected ? <Check size={16} color={A.INK} /> : null}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
