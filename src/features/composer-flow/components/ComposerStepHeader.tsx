/**
 * ComposerStepHeader — THE ONE HEADER for every step of the unified composer.
 *
 * The entry sheet is unnumbered. Post displays one step with no counter;
 * review displays two steps while its internal wizard numbering stays intact.
 * Leading-control ownership stays with each host; numbering is display-only.
 *
 * LEFT SLOT: × on step 1 (closes the flow), ← on every later step (returns to
 * the previous step with state intact). `left="none"` is for a host that
 * already owns its own leading control — the review composer's fixed header
 * carries the course name, the delete action and the one back/close glyph, and
 * two back buttons on one screen would be a worse answer than a counter that
 * sits under it.
 */
import { ArrowLeft, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CT } from '@/features/_shared/composerTokens';

export const COMPOSER_HEADER_HEIGHT = 52;

interface Props {
  /** 1-based. */
  step: number;
  /** Displayed total; entry sheet is unnumbered. One hides the counter. */
  total: number;
  /** Step 1 shows ×; later steps show ←. Ignored when left is 'none'. */
  onLeft?: () => void;
  /**
   * Which leading control to draw. Defaults to the step-derived one: 'close'
   * on step 1, 'back' after it. 'none' draws no button at all.
   */
  left?: 'close' | 'back' | 'none';
}

export default function ComposerStepHeader({ step, total, onLeft, left }: Props) {
  const { t } = useTranslation('composerFlow');
  const resolved = left ?? (step <= 1 ? 'close' : 'back');
  const isFirst = resolved === 'close';

  return (
    <div>
      <div
        style={{
          height: COMPOSER_HEADER_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 12px',
        }}
      >
        {resolved !== 'none' && (
        <button
          type="button"
          onClick={onLeft}
          aria-label={isFirst ? t('close') : t('back')}
          style={{
            width: 34,
            height: 34,
            display: 'grid',
            placeItems: 'center',
            background: 'transparent',
            border: 'none',
            padding: 0,
            color: CT.ink,
            cursor: 'pointer',
          }}
        >
          {isFirst ? <X size={20} strokeWidth={2.2} /> : <ArrowLeft size={20} strokeWidth={2.2} />}
        </button>
        )}
        {total > 1 && <span style={{ fontSize: 12, fontWeight: 700, color: CT.muted }}>
          {t('step', { n: step, m: total })}
        </span>}
      </div>

      {total > 1 && <div
        aria-hidden
        style={{ display: 'flex', gap: 4, padding: '0 16px 12px' }}
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            style={{
              flex: '1 1 0',
              height: 3,
              borderRadius: 2,
              background: i < step ? CT.ink : CT.track,
            }}
          />
        ))}
      </div>}
    </div>
  );
}
