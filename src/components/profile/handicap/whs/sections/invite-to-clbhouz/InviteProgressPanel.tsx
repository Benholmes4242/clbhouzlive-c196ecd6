/**
 * InviteProgressPanel - the invite state as a figure and a bar.
 *
 * Replaces the InviteQuestCard: the amber gradient tile, the Trophy glyph
 * bleed, the party emoji, the milestone dot ladder and the "Your circle is
 * thriving" copy are all gone. What is left is the only thing that was ever
 * information: how many invites have been sent, what the next mark is, and how
 * far along the bar sits.
 *
 * The bar is AMBER on TRACK. It is the one place amber earns a fill here.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CHART, CHART_FONT, LABEL_STYLE } from '../../charts';
import { tierForSent } from './inviteTiers';

interface Props {
  sentCount: number;
  onClick?: () => void;
}

export const InviteProgressPanel: React.FC<Props> = ({ sentCount, onClick }) => {
  const { t } = useTranslation('common');
  const tier = tierForSent(sentCount);

  // Past the fixed ladder the mark rolls in fives.
  const floor = tier ? tier.floor : Math.ceil((sentCount + 1) / 5) * 5 - 5;
  const goal = tier ? tier.goal : floor + 5;
  const span = Math.max(1, goal - floor);
  const pct = Math.max(0, Math.min(100, Math.round(((sentCount - floor) / span) * 100)));

  const tappable = typeof onClick === 'function';

  return (
    <div
      {...(tappable
        ? {
            role: 'button' as const,
            tabIndex: 0,
            onClick,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick!();
              }
            },
          }
        : {})}
      style={{
        margin: '0 0 4px',
        padding: 16,
        background: CHART.PANEL,
        border: `1px solid ${CHART.BORDER}`,
        borderRadius: 16,
        fontFamily: CHART_FONT,
        cursor: tappable ? 'pointer' : 'default',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <span style={{ ...LABEL_STYLE, color: CHART.MUTE }}>{t('handicap.circle.invite.invitesSent')}</span>
        {tappable && (
          <span style={{ ...LABEL_STYLE, color: CHART.AMBER }}>
            {t('handicap.circle.invite.sentInvites')}
          </span>
        )}
      </div>

      <div style={{ marginTop: 14 }}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            color: CHART.INK,
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          {sentCount}
        </div>
        <div style={{ ...LABEL_STYLE, marginTop: 6, color: CHART.MUTE }}>
          {t('handicap.circle.invite.invitedCount', { count: sentCount })}
        </div>
        <div style={{ ...LABEL_STYLE, marginTop: 3 }}>
          {t('handicap.circle.invite.nextAt', { count: goal })}
        </div>
      </div>

      {/* Progress: amber on track. */}
      <div
        aria-hidden
        style={{
          marginTop: 14,
          height: 4,
          background: CHART.TRACK,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: CHART.AMBER,
            borderRadius: 2,
          }}
        />
      </div>

      {tier && (
        <div style={{ fontSize: 12, color: CHART.MUTE, marginTop: 10, lineHeight: 1.35 }}>
          {tier.sub}
        </div>
      )}
    </div>
  );
};

export default InviteProgressPanel;
