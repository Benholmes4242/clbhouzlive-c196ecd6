/**
 * DUPLICATE OF src/features/tourhub/overview/sections/SectionShell.tsx. Both
 * are Tour Hub section headings, both render the same KICKER token, and they
 * live in sibling directories (tournament-v2/sections and overview/sections).
 * They do the same job. THE MERGE IS PENDING and is a treatment decision, not
 * a mechanical one — do not fold them together here. Note this component is
 * also consumed OUTSIDE Tour Hub, by features/search-v2 (SearchEmptyState).
 *
 * SectionEyebrow - TD1 section header: kicker + optional right action.
 *
 * Analytical grammar (BRIEF_TOUR_TOURNAMENT_PAGE): the kicker is the canonical
 * KICKER token (A.INK, 0.16em) and the action is the canonical quiet
 * Action - never a filled pill, never a raw chevron glyph.
 */
import { A, KICKER, LABEL, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { useTranslation } from 'react-i18next';

interface Props {
  kicker: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionEyebrow({ kicker, actionLabel, onAction }: Props) {
  const { i18n } = useTranslation();
  const cjk = /^(ja|ko)/.test(i18n.language);
  return (
    <div
      style={{
        display: 'flex', alignItems: 'baseline', gap: 12,
        padding: '16px 16px 12px', fontFamily: SANS,
      }}
    >
      <span style={{ ...KICKER, letterSpacing: cjk ? 0 : KICKER.letterSpacing, textTransform: cjk ? 'none' : KICKER.textTransform }}>{kicker}</span>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            marginLeft: 'auto',
            minHeight: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontFamily: SANS,
          }}
          className="active:opacity-70 transition-opacity"
        >
          {/* CAPS BUTTON: two points below the READ floor, 0.10em, height unchanged. */}
          <span style={{ ...LABEL, fontSize: 9, letterSpacing: cjk ? 0 : '0.10em', textTransform: cjk ? 'none' : LABEL.textTransform, color: A.INK }}>{actionLabel}</span>
          <span style={{ fontSize: 12, color: A.INK, fontWeight: 700 }} aria-hidden="true">
            {'\u203A'}
          </span>
        </button>
      )}
    </div>
  );
}
