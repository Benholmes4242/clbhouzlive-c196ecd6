/**
 * ComposerStepHeader — THE ONE HEADER for every step of the unified composer.
 *
 * Step 1 lives in a sheet and steps 2 and 3 live in the composers, so a member
 * crosses a container boundary mid-flow. They must not be able to tell: same
 * height, same segment geometry, same type sizes, one implementation. A second
 * header would drift and the handoff would read as two different apps.
 *
 * LEFT SLOT: × on step 1 (closes the flow), ← on every later step (returns to
 * the previous step with state intact).
 */
import { ArrowLeft, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CT } from '@/features/_shared/composerTokens';

export const COMPOSER_HEADER_HEIGHT = 52;

interface Props {
  /** 1-based. */
  step: number;
  /** 3 on the review path, 2 on the post path. */
  total: number;
  /** Step 1 shows ×; later steps show ←. */
  onLeft: () => void;
}

export default function ComposerStepHeader({ step, total, onLeft }: Props) {
  const { t } = useTranslation('composerFlow');
  const isFirst = step <= 1;

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
        <span style={{ fontSize: 12, fontWeight: 700, color: CT.muted }}>
          {t('step', { n: step, m: total })}
        </span>
      </div>

      <div
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
      </div>
    </div>
  );
}
