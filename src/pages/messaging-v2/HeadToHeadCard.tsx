/**
 * MS1 §3 — THE HEAD-TO-HEAD CARD (mock: ms1-head-to-head.html, signed off).
 *
 * Sits above the shared round cards, only when there are shared rounds. The
 * points record is the big figure on the left, gross on the right, one
 * sentence, then the last five as 22px tiles (W filled ink, L and H outlined),
 * newest first. NO AMBER (§9): the member's record is ink like everything
 * else on this surface.
 *
 * The record comes from headToHead() on the DEDUPED rounds, so it can disagree
 * with the server count until MS2 — the brief accepts that.
 *
 * TAPPABLE: the thread already has a route to the compare sheet
 * (ConversationSettingsSheet → compareRouteFor), so the card opens it.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { MSG } from '@/features/messaging-dark/tokens';
import type { HeadToHeadRecord } from '@/hooks/messaging/useSharedGround';

const CARD_BG = '#17171B';
const CARD_EDGE = 'rgba(255,255,255,0.08)';
const DIM = 'rgba(248,250,252,0.42)';
const MUTE = 'rgba(248,250,252,0.62)';

const LABEL: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: DIM,
};

interface Props {
  record: HeadToHeadRecord;
  rivalFirstName: string;
  onOpen?: () => void;
}

export const HeadToHeadCard: React.FC<Props> = ({ record, rivalFirstName, onOpen }) => {
  const { t } = useTranslation('messaging');
  const { points, gross, lastFive } = record;

  const lead =
    points.w > points.l
      ? t('h2h.youLead', { defaultValue: 'You lead on points' })
      : points.l > points.w
        ? t('h2h.rivalLeads', {
            name: rivalFirstName,
            defaultValue: `${rivalFirstName} leads on points`,
          })
        : t('h2h.allSquare', { defaultValue: 'All square on points' });

  const formLabel =
    lastFive.length >= 5
      ? t('h2h.lastFive', { defaultValue: 'Your last five together:' })
      : t('h2h.lastK', { count: lastFive.length, defaultValue: `Your last ${lastFive.length} together:` });

  const body = (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={LABEL}>{t('h2h.labelPoints', { defaultValue: 'Head to head · points' })}</div>
          <div
            data-testid="h2h-points"
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
              color: MSG.INK,
            }}
          >
            {points.w}
            <span style={{ color: DIM, fontWeight: 600, margin: '0 4px' }}>–</span>
            {points.l}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={LABEL}>{t('h2h.labelGross', { defaultValue: 'Gross' })}</div>
          <div
            data-testid="h2h-gross"
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
              color: MSG.INK,
            }}
          >
            {gross.w}
            <span style={{ color: DIM, fontWeight: 600, margin: '0 4px' }}>–</span>
            {gross.l}
          </div>
        </div>
      </div>

      <p style={{ fontSize: 13.5, color: MUTE, margin: '6px 0 0', lineHeight: 1.45 }}>
        {lead}
        {points.h > 0 ? (
          <>
            ,{' '}
            <b style={{ color: MSG.INK, fontWeight: 600 }}>
              {t('h2h.halved', { count: points.h, defaultValue: `${points.h} halved` })}
            </b>
          </>
        ) : null}
        . {formLabel}
      </p>

      <div style={{ display: 'flex', gap: 4, marginTop: 10, alignItems: 'center' }}>
        {lastFive.map((r, i) => (
          <span
            key={i}
            data-testid={`h2h-form-${i}`}
            style={{
              width: 22,
              height: 22,
              borderRadius: 7,
              fontSize: 11,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: r === 'W' ? 'none' : '1px solid rgba(255,255,255,0.14)',
              background: r === 'W' ? MSG.INK : 'transparent',
              color: r === 'W' ? MSG.BLACK : MUTE,
            }}
          >
            {r}
          </span>
        ))}
        <span style={{ fontSize: 11.5, color: DIM, marginLeft: 6 }}>
          {t('h2h.newestFirst', { defaultValue: 'newest first' })}
        </span>
      </div>
    </>
  );

  const style: React.CSSProperties = {
    margin: '14px 16px 0',
    background: CARD_BG,
    border: `1px solid ${CARD_EDGE}`,
    borderRadius: 18,
    padding: '14px 16px',
    textAlign: 'left',
    width: 'auto',
    display: 'block',
  };

  if (!onOpen) return <div style={style}>{body}</div>;
  return (
    <button type="button" onClick={onOpen} className="active:opacity-60" style={style}>
      {body}
    </button>
  );
};

export default HeadToHeadCard;
