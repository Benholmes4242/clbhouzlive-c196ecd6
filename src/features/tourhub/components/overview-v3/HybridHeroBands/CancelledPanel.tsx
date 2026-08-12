/**
 * CancelledPanel — replaces the 4 rows for Results · cancelled.
 * §6.4 of HYBRID_HERO_IMPLEMENTATION_BRIEF.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { INK_15, INK_60, SLATE_500 } from '../HybridHero.constants';

export function CancelledPanel({ reason }: { reason?: string }) {
  const { t } = useTranslation('tourhub');
  return (
    <div
      style={{
        padding: '32px 20px',
        textAlign: 'center',
        borderTop: `0.5px solid ${INK_15}`,
        borderBottom: `0.5px solid ${INK_15}`,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.18em',
          color: SLATE_500,
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {t('overview.cancelled.eyebrow')}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: INK_60, lineHeight: 1.4 }}>
        {reason || t('overview.cancelled.reasonDefault')}
      </div>
    </div>
  );
}
