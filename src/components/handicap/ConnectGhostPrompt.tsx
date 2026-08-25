/**
 * ConnectGhostPrompt — the persuasive connect-your-WHS-handicap prompt.
 *
 * THE RULE (BRIEF_CONNECT_GATE_HONOURS_BOARD, overturning the original blurred
 * "ghost" design documented here before):
 *
 *  - THE PREVIEW IS REAL CONTENT, NEVER BLURRED. A tint or a blur is not a quiet
 *    version of content, it is content made unreadable, and a blur cannot make a
 *    reward concrete because nothing in it can be read.
 *  - A SURFACE WITH NOTHING SHORT AND TRUE TO SHOW RENDERS NO PREVIEW AT ALL —
 *    the promise block alone is a complete card. No placeholder, no decoration.
 *  - THE AMBER IS GONE. Amber means the viewing member app-wide, and this card is
 *    shown to somebody who is not on the board. The CTA is INK, matching the You
 *    tab where the same action already renders in ink.
 *
 * Dismissal is per-surface via versioned localStorage keys (matching the
 * ChampionsInfoCarousel pattern, wrapped in try/catch). Once dismissed the
 * full card is replaced by a slim neutral re-entry row.
 *
 * Connected users must never see this — the parent decides render/no-render
 * based on useWhsConnection. This component assumes it should render.
 */
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const INK = '#0F172A';
const INK_60 = '#64748B';
const INK_45 = '#94A3B8';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const NEUTRAL_BG = 'rgba(15,23,42,0.04)';
const NEUTRAL_BORDER = 'rgba(15,23,42,0.10)';
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export type ConnectGhostSurface = 'holes' | 'about' | 'profile' | 'champions';

interface Props {
  surface: ConnectGhostSurface;
  /**
   * A REAL, unblurred slice of the section being unlocked. When omitted the card
   * renders the promise block alone — never a placeholder.
   */
  preview?: React.ReactNode;
  onConnect: () => void;
  /** Optional copy overrides. When omitted the surface i18n copy is used. */
  eyebrowOverride?: string;
  headlineOverride?: string;
  bodyOverride?: string;
  ctaOverride?: string;
  /** Pass null to suppress the footnote entirely. */
  footnoteOverride?: string | null;
  /** When false the dismiss affordance and slim re-entry row are skipped. */
  dismissible?: boolean;
}

const readDismissed = (key: string) => {
  try { return localStorage.getItem(key) === '1'; } catch { return false; }
};
const writeDismissed = (key: string) => {
  try { localStorage.setItem(key, '1'); } catch { /* silent */ }
};

export const ConnectGhostPrompt: React.FC<Props> = ({
  surface,
  preview,
  onConnect,
  eyebrowOverride,
  headlineOverride,
  bodyOverride,
  ctaOverride,
  footnoteOverride,
  dismissible = true,
}) => {
  const { t } = useTranslation('common');
  const key = `connect_ghost_dismissed_${surface}_v1`;
  const [dismissed, setDismissed] = useState(() => readDismissed(key));

  const eyebrow = eyebrowOverride ?? t('connectGhost.eyebrow');
  const headline = headlineOverride ?? t(`connectGhost.${surface}.headline`);
  const sub = bodyOverride ?? t(`connectGhost.${surface}.sub`);
  const cta = ctaOverride ?? t('connectGhost.cta');
  const footnote = footnoteOverride === undefined ? t('connectGhost.footnote') : footnoteOverride;
  const dismissLabel = t('connectGhost.dismissA11y');
  const slimBenefit = t(`connectGhost.${surface}.slim`);

  if (dismissible && dismissed) {
    return (
      <div style={{ padding: '12px 16px 0', fontFamily: FONT }}>
        <button
          type="button"
          onClick={onConnect}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: NEUTRAL_BG,
            border: `1px solid ${NEUTRAL_BORDER}`,
            borderRadius: 14,
            padding: '12px 14px',
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: FONT,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: INK, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {slimBenefit}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: INK, whiteSpace: 'nowrap' }}>
            {t('connectGhost.slimCta')}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 16px 0', fontFamily: FONT }}>
      <div
        style={{
          position: 'relative',
          background: '#FFFFFF',
          borderRadius: 18,
          border: `1px solid ${HAIRLINE}`,
          boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
          overflow: 'hidden',
        }}
      >
        {dismissible && (
        <button
          type="button"
          aria-label={dismissLabel}
          onClick={() => { setDismissed(true); writeDismissed(key); }}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 26,
            height: 26,
            borderRadius: 8,
            border: 'none',
            background: 'rgba(15,23,42,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 2,
            color: INK_45,
          }}
        >
          <X size={15} strokeWidth={2.4} />
        </button>
        )}

        {preview ? (
          <div style={{ borderBottom: `1px solid ${HAIRLINE}` }}>{preview}</div>
        ) : null}

        {/* Promise block */}
        <div
          style={{
            padding: '14px 16px 16px',
            background: '#FFFFFF',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase', color: INK_60, marginBottom: 6 }}>
            {eyebrow}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.03em', color: INK, lineHeight: 1.2 }}>
            {headline}
          </div>
          <div style={{ marginTop: 6, fontSize: 13.5, fontWeight: 500, color: INK_60, lineHeight: 1.5 }}>
            {sub}
          </div>
          <button
            type="button"
            onClick={onConnect}
            style={{
              marginTop: 14,
              width: '100%',
              padding: '13px 0',
              background: INK,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 13,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: FONT,
            }}
          >
            {cta}
          </button>
          {footnote ? (
            <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: INK_60, textAlign: 'center' }}>
              {footnote}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ConnectGhostPrompt;
