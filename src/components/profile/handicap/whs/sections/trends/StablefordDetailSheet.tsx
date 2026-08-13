import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { StablefordDistribution } from './computeStablefordDistribution';
import { POINTS_BANDS } from './stablefordBands';
import { CHART, CHART_FONT, pointsTone, toneColor } from '../../charts';

interface Props {
  open: boolean;
  onClose: () => void;
  dist: StablefordDistribution;
}

/**
 * Educational copy note: "your" in this sheet refers to the reader
 * (the person viewing the sheet), not the profile owner. These sheets
 * explain WHS mechanics; do not friend-prefix or change to third-person.
 */

// Dark literals from charts/tokens - the sheet portals outside .hcp-dark
// so var(--hcp-*) does not resolve here.
const FONT = CHART_FONT;

const LABEL: React.CSSProperties = {
  margin: 0,
  fontFamily: FONT,
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: CHART.DIM,
};

const BODY: React.CSSProperties = {
  margin: 0,
  fontFamily: FONT,
  fontSize: 13,
  lineHeight: 1.6,
  color: CHART.MUTE,
};

export const StablefordDetailSheet: React.FC<Props> = ({ open, onClose, dist }) => {
  const { t } = useTranslation('handicap');
  const [primerOpen, setPrimerOpen] = useState(false);

  const scopeLabel =
    dist.scope === '30d'
      ? t('stableford.scope30d')
      : dist.scope === '90d'
        ? t('stableford.scope90d')
        : t('stableford.scopeAll');

  const avg = dist.avg;
  const delta = dist.deltaVsPrev;
  // Fewer points is worse. pointsTone reads before-then-after and owns the
  // polarity, so there is no local `< 0` comparison here on purpose.
  const deltaTone =
    !dist.insufficientData && delta !== null && avg !== null
      ? pointsTone(avg - delta, avg)
      : null;

  const bands = [
    {
      key: 'zone',
      color: POINTS_BANDS.ZONE,
      count: dist.inZoneCount,
      pct: dist.inZonePct,
      label: t('stableford.zoneLabel'),
      range: t('stableford.zoneRange'),
      body: t('stableford.zoneBody'),
    },
    {
      key: 'solid',
      color: POINTS_BANDS.SOLID,
      count: dist.solidCount,
      pct: dist.solidPct,
      label: t('stableford.solidLabel'),
      range: t('stableford.solidRange'),
      body: t('stableford.solidBody'),
    },
    {
      key: 'off',
      color: POINTS_BANDS.OFF,
      count: dist.offDayCount,
      pct: dist.offDayPct,
      label: t('stableford.offLabel'),
      range: t('stableford.offRange'),
      body: t('stableford.offBody'),
    },
  ];

  const dominant = [...bands].sort((a, b) => b.count - a.count)[0];
  const conclusionKey =
    dominant.key === 'off'
      ? 'stableford.conclusionOff'
      : dominant.key === 'zone'
        ? 'stableford.conclusionZone'
        : 'stableford.conclusionSolid';

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="stableford-sheet-title"
      variant="dark"
      surfaceColor={CHART.CANVAS}
      style={{ minHeight: 0 }}
    >
      <div style={{ overflowY: 'auto', maxHeight: '95dvh', padding: '4px 16px 28px' }}>
        {/* Header */}
        <p style={{ ...LABEL, color: CHART.AMBER }}>{t('stableford.kicker')}</p>
        <h2
          id="stableford-sheet-title"
          style={{
            margin: '6px 0 0',
            fontFamily: FONT,
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: CHART.INK,
          }}
        >
          {t('stableford.title')}
        </h2>
        <p style={{ ...LABEL, marginTop: 6, fontVariantNumeric: 'tabular-nums lining-nums' }}>
          {t('stableford.sample', { count: dist.total, scope: scopeLabel })}
        </p>

        {/* 1. Your distribution */}
        <div
          style={{
            marginTop: 18,
            background: CHART.PANEL,
            border: `1px solid ${CHART.BORDER}`,
            borderRadius: 14,
            padding: 16,
          }}
        >
          <p style={LABEL}>{t('stableford.yourDistribution')}</p>

          <div
            style={{
              marginTop: 10,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 34,
                  fontWeight: 700,
                  color: CHART.INK,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums lining-nums',
                }}
              >
                {avg !== null ? avg.toFixed(1) : '\u2013'}
              </div>
              <p style={{ ...LABEL, marginTop: 6 }}>{t('stableford.pointsARound')}</p>
            </div>
            {deltaTone && delta !== null && (
              <span
                style={{
                  ...LABEL,
                  color: toneColor(deltaTone),
                  fontVariantNumeric: 'tabular-nums lining-nums',
                }}
              >
                {`${delta > 0 ? '+' : '\u2212'}${Math.abs(delta).toFixed(1)} ${t('stableford.deltaSuffix')}`}
              </span>
            )}
          </div>

          {/* Flat segmented bar - the ring's segments, laid out horizontally */}
          <div
            style={{
              marginTop: 14,
              display: 'flex',
              gap: 2,
              height: 6,
              borderRadius: 999,
              overflow: 'hidden',
              background: CHART.TRACK,
            }}
          >
            {bands.map((b) =>
              b.count > 0 ? (
                <span key={b.key} style={{ flex: b.count, background: b.color }} />
              ) : null,
            )}
          </div>

          {/* Three figures */}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            {bands.map((b) => (
              <div key={b.key} style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 16,
                    fontWeight: 700,
                    color: CHART.INK,
                    fontVariantNumeric: 'tabular-nums lining-nums',
                    lineHeight: 1,
                  }}
                >
                  {b.count}
                </div>
                <p style={{ ...LABEL, marginTop: 6, color: CHART.MUTE }}>{b.label}</p>
                <p style={{ ...LABEL, marginTop: 3, color: CHART.FAINT }}>{b.range}</p>
              </div>
            ))}
          </div>

          {/* Conclusion - never inferred from under three rounds */}
          {!dist.insufficientData && (
            <p style={{ ...BODY, marginTop: 14, color: CHART.MUTE }}>
              {t(conclusionKey, { count: dominant.count, total: dist.total })}
            </p>
          )}
        </div>

        {/* 2. What the bands mean */}
        <p style={{ ...LABEL, marginTop: 22 }}>{t('stableford.bandsHeading')}</p>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bands.map((b) => (
            <div key={b.key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: b.color,
                  marginTop: 5,
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: FONT,
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: CHART.INK,
                    }}
                  >
                    {b.label}
                  </p>
                  <p style={LABEL}>{b.range}</p>
                </div>
                <p style={{ ...BODY, fontSize: 12.5, marginTop: 2 }}>{b.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 3. What is stableford - collapsed by default */}
        <button
          type="button"
          onClick={() => setPrimerOpen((v) => !v)}
          aria-expanded={primerOpen}
          style={{
            marginTop: 22,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '12px 0',
            background: 'transparent',
            border: 'none',
            borderTop: `1px solid ${CHART.BORDER}`,
            cursor: 'pointer',
          }}
        >
          <span style={LABEL}>{t('stableford.primerHeader')}</span>
          <ChevronDown
            size={15}
            color={CHART.DIM}
            strokeWidth={2.2}
            style={{
              transform: primerOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 160ms ease',
            }}
          />
        </button>
        {primerOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 4 }}>
            <p style={BODY}>{t('stableford.primer1')}</p>
            <p style={BODY}>{t('stableford.primer2')}</p>
            <p style={BODY}>{t('stableford.primer3')}</p>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

export default StablefordDetailSheet;
