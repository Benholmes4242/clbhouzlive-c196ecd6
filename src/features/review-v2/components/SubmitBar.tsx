/**
 * SubmitBar - the single pinned action for the wizard.
 * The gate string IS the disabled label; there is no helper text.
 *
 * TWO OPTIONAL COMPANIONS, both owned by the footer so nothing in the scrolling
 * body has to reserve room for them:
 *   summary   one quiet line naming what is about to be sent (omitted when
 *             there is nothing to name — never a placeholder).
 *   skip      a text link directly under the button, shown only when the step
 *             can be passed with nothing. It says what the member GETS, not
 *             what they lose.
 */

import React from 'react';
import { RV2 } from '../tokens';
import { PAGE_CANVAS, surfaceWithAlpha } from '@/lib/tokens/surfaces';
import { Button } from '@/components/ui/button';

interface Props {
  label: string;
  enabled: boolean;
  onPress: () => void;
  summary?: string | null;
  skipLabel?: string | null;
  onSkip?: () => void;
  /** 'step1' = BRIEF_REVIEW_STEP_ONE §5 restyle; default unchanged. */
  appearance?: 'default' | 'step1' | 'score';
  quiet?: boolean;
}

export function SubmitBar({ label, enabled, onPress, summary, skipLabel, onSkip, appearance = 'default', quiet }: Props) {
  if (appearance === 'score') return (
    <div className="review-score-footer" data-submit-appearance="score">
      {summary && <div className="review-score-footer-line">{summary}</div>}
      <Button variant="ghost" disabled={!enabled} onClick={onPress} className="review-score-action" data-quiet={quiet}>{label}</Button>
    </div>
  );
  if (appearance === 'step1') {
    return (
      <div
        data-submit-appearance="step1"
        style={{
          position: 'sticky',
          bottom: 0,
          background: 'linear-gradient(180deg, rgba(22,22,26,0) 0%, #16161A 22%)',
          padding: '24px 20px calc(env(safe-area-inset-bottom, 0px) + 18px)',
        }}
      >
        {summary ? (
          <div style={{ fontSize: 12, lineHeight: 1.4, color: 'rgba(248,250,252,0.62)', textAlign: 'center', marginBottom: 10 }}>
            {summary}
          </div>
        ) : null}
        <button
          type="button"
          disabled={!enabled}
          onClick={onPress}
          style={{
            width: '100%', height: 54, borderRadius: 16, border: 'none',
            background: '#F3F5F7', color: '#0A0A0C', fontSize: 16.5, fontWeight: 700,
            cursor: enabled ? 'pointer' : 'not-allowed', opacity: enabled ? 1 : 0.6,
          }}
        >
          {label}
        </button>
        {skipLabel && onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            data-step1-skip
            style={{
              display: 'block', width: '100%', marginTop: 12, background: 'transparent', border: 'none',
              padding: 0, fontSize: 13, fontWeight: 650, color: 'rgba(248,250,252,0.62)', textAlign: 'center', cursor: 'pointer',
            }}
          >
            {skipLabel}
          </button>
        ) : null}
      </div>
    );
  }
  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        background: RV2.canvas,
        borderTop: `1px solid ${RV2.hairline}`,
        padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 18px)',
      }}
    >
      {summary ? (
        <div
          style={{
            fontSize: 12.5,
            lineHeight: 1.4,
            color: RV2.secondary,
            marginBottom: 10,
          }}
        >
          {summary}
        </div>
      ) : null}
      <button
        type="button"
        disabled={!enabled}
        onClick={onPress}
        style={{
          width: '100%',
          padding: 16,
          borderRadius: 14,
          border: 'none',
          // Enabled = ink fill, canvas label (RV2.onDark is itself near-white
          // now, so it cannot label an ink fill). Disabled keeps a visible fill
          // and a 0.60 label so the gate reads as disabled but PRESENT (§5.2).
          background: enabled ? RV2.ink : RV2.disabledFill,
          color: enabled ? RV2.canvas : RV2.secondary,
          /* CAPS ACTION (§5) — two points down, height unchanged. */
          fontSize: 12.5,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.10em',
          cursor: enabled ? 'pointer' : 'not-allowed',
          boxShadow: enabled ? `0 6px 16px ${surfaceWithAlpha(PAGE_CANVAS, 0.22)}` : 'none',
          transition: 'background 160ms, color 160ms',
        }}
      >
        {label}
      </button>
      {skipLabel && onSkip ? (
        <button
          type="button"
          onClick={onSkip}
          style={{
            width: '100%',
            marginTop: 12,
            background: 'transparent',
            border: 'none',
            padding: 0,
            fontSize: 14,
            fontWeight: 600,
            color: RV2.secondary,
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          {skipLabel}
        </button>
      ) : null}
    </div>
  );
}
