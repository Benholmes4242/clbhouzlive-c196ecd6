/**
 * Top100MoversSheet — the full "Opinion is moving" list.
 *
 * Shared BottomSheet primitive + ScopeSegment. Rows carry the rating count so
 * a big swing on two ratings is visibly thin.
 *
 * Analytics callsite: top100_movers_opened { range }
 */
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ScopeSegment } from '@/components/shared/ScopeSegment';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { MoverRow } from '../Top100MoversSection';
import type { MoverRange, Top100Mover } from '@/hooks/top100/useTop100Movers';
import { HAIRLINE_INK_8, INK, INK_MUTE } from '@/features/courses/_shared/tokens';
import { TITLE } from '@/lib/tokens/type';

interface Props {
  open: boolean;
  onClose: () => void;
  movers: Top100Mover[];
  range: MoverRange;
  onRangeChange: (next: MoverRange) => void;
}

export const Top100MoversSheet: React.FC<Props> = ({
  open,
  onClose,
  movers,
  range,
  onRangeChange,
}) => {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    analyticsEvents.track('top100_movers_opened', { range });
    // Fires on open only; range changes re-fire via the segment handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <BottomSheet open={open} onClose={onClose} maxHeight="85dvh">
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(85dvh - 30px)' }}>
        <div style={{ padding: '4px 16px 12px', borderBottom: `1px solid ${HAIRLINE_INK_8}` }}>
          <div style={{ ...TITLE, color: INK }}>
            {t('top100.movers.title')}
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: INK_MUTE, marginTop: 3 }}>
            {t('top100.movers.subtitle')}
          </div>
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
            <ScopeSegment
              value={range}
              ariaLabel={t('top100.movers.rangeA11y')}
              onChange={(next) => {
                onRangeChange(next);
                analyticsEvents.track('top100_movers_opened', { range: next });
              }}
              options={[
                { value: 'this_month', label: t('top100.movers.rangeMonth') },
                { value: 'this_year', label: t('top100.movers.rangeYear') },
              ]}
            />
          </div>
        </div>

        <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', flex: 1 }}>
          {movers.length === 0 ? (
            <div
              style={{
                padding: '32px 24px',
                textAlign: 'center',
                fontSize: 13,
                fontWeight: 500,
                color: INK_MUTE,
              }}
            >
              {t('top100.movers.empty')}
            </div>
          ) : (
            movers.map((mover, i) => (
              <MoverRow
                key={mover.course_id}
                mover={mover}
                showCount
                divider={i > 0}
                onClick={() => {
                  onClose();
                  navigate(`/courses/${mover.course_id}`);
                }}
              />
            ))
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

export default Top100MoversSheet;
