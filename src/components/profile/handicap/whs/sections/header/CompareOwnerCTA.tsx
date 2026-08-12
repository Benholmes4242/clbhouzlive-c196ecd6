/**
 * CompareOwnerCTA - the friend-view control.
 *
 * Replaces RivalryCTA, which routed into the deleted rivalry page. Same
 * position, same job in one respect - it answers "how do I stack up against
 * this person" - but it opens the compare sheet pre-selected on the profile
 * owner instead of navigating away.
 *
 * Panel, not gradient plaque: this surface is analytical dark.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { CHART, CHART_FONT, LABEL_STYLE } from '../../charts';
import { openCompare } from '../compare/events';

interface Props {
  /** The profile owner - the person the viewer is compared against. */
  ownerUserId: string;
  ownerFirstName: string | null;
}

export const CompareOwnerCTA: React.FC<Props> = ({
  ownerUserId,
  ownerFirstName,
}) => {
  const { t } = useTranslation('common');
  const name = ownerFirstName ?? t('handicap.compare.title');

  return (
    <div style={{ padding: '0 16px 12px' }}>
      <button
        type="button"
        onClick={() => openCompare('friend_cta', ownerUserId)}
        style={{
          width: '100%',
          background: CHART.PANEL,
          border: `1px solid ${CHART.BORDER}`,
          borderRadius: 14,
          padding: '13px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          textAlign: 'left',
          cursor: 'pointer',
          fontFamily: CHART_FONT,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ ...LABEL_STYLE, color: CHART.MUTE }}>
            {t('handicap.compare.kicker')}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 13,
              fontWeight: 700,
              color: CHART.INK,
              letterSpacing: '-0.005em',
              lineHeight: 1.25,
            }}
          >
            {t('handicap.compare.youAnd', { name })}
          </div>
        </div>
        <ChevronRight
          size={16}
          strokeWidth={2.4}
          color={CHART.AMBER}
          style={{ flexShrink: 0 }}
        />
      </button>
    </div>
  );
};

export default CompareOwnerCTA;
