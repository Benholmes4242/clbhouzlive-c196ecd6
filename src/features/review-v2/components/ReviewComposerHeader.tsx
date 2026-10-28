/**
 * The review composer's fixed header (BRIEF_REVIEW_STEP_ONE §1).
 *
 * TWO FORMS, ONE ELEMENT. `photo` is the full-bleed course photograph shown
 * only while step 1 is empty; `compact` is the long-standing bar. The element
 * keeps one ref so the composer's spacer measures its bottom edge in both
 * forms and follows the 200ms fold (a snap under reduced motion). The composer
 * owns the empty rule and its stickiness; this file only draws.
 */
import React, { forwardRef } from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RV2 } from '../tokens';
import type { ReviewHeaderFacts } from '../hooks/useReviewHeaderFacts';
import { headerScore } from '../hooks/useReviewHeaderFacts';

interface Props {
  form: 'photo' | 'compact';
  name: string | null | undefined;
  region: string;
  thumbnail: string | null | undefined;
  facts: ReviewHeaderFacts;
  leadingIsClose: boolean;
  onBack: () => void;
  isEditMode: boolean;
  onDelete: () => void;
}

const MUTED = 'rgba(248,250,252,0.62)';
const COMPACT_H = 68; // 8 top pad + 6 + 44 row + 10

export const ReviewComposerHeader = forwardRef<HTMLElement, Props>(function ReviewComposerHeader(
  { form, name, region, thumbnail, facts, leadingIsClose, onBack, isEditMode, onDelete },
  ref,
) {
  const { t } = useTranslation('courses');
  const photo = form === 'photo';
  const score = headerScore(facts);
  const backLabel = leadingIsClose ? t('review.wizard.closeA11y') : t('review.wizard.backA11y');
  const glyph = leadingIsClose ? '\u00D7' : '\u2039';
  const fromMembers = score ? t('review.wizard.stepOne.fromMembers', { count: score.count }) : '';

  return (
    <header
      ref={ref}
      data-header-form={form}
      className="rv2-fold-header"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        margin: '0 auto',
        width: '100%',
        maxWidth: 480,
        zIndex: 50,
        overflow: 'hidden',
        background: RV2.canvas,
        borderBottom: photo ? 'none' : `1px solid ${RV2.hairline}`,
        height: photo
          ? 'calc(env(safe-area-inset-top, 0px) + 172px)'
          : `calc(env(safe-area-inset-top, 0px) + ${COMPACT_H}px)`,
        boxSizing: 'border-box',
        transition: 'height 200ms ease',
      }}
    >
      <style>{`@media (prefers-reduced-motion: reduce) { .rv2-fold-header, .rv2-fold-header * { transition: none !important; } }`}</style>
      {photo ? (
        <div data-photo-header style={{ position: 'absolute', inset: 0 }}>
          {thumbnail ? (
            <img src={thumbnail} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 65%' }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg,#2F5A3C,#16281D)' }} />
          )}
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,10,12,0.55) 0%, rgba(10,10,12,0.10) 35%, rgba(22,22,26,0.96) 100%)' }} />
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            style={{
              position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 6px)', left: 14,
              width: 36, height: 36, borderRadius: 999, border: 'none', background: 'rgba(14,14,16,0.6)',
              color: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 21, lineHeight: 1, cursor: 'pointer',
            }}
          >
            {glyph}
          </button>
          <div style={{ position: 'absolute', left: 20, right: 20, bottom: 12 }}>
            <div style={{ fontSize: 23, fontWeight: 700, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
            <div data-photo-meta style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: MUTED, minWidth: 0 }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{region}</span>
              {score && (
                <>
                  <span aria-hidden style={{ width: 3, height: 3, borderRadius: 999, background: 'rgba(248,250,252,0.42)', flexShrink: 0 }} />
                  <span data-header-score style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    <b style={{ fontWeight: 700, color: '#F8FAFC' }}>{score.avg}</b> {fromMembers}
                  </span>
                </>
              )}
              {facts.rank && (
                <span data-header-rank style={{ height: 18, borderRadius: 6, padding: '0 6px', background: 'rgba(255,255,255,0.08)', fontSize: 10.5, fontWeight: 700, color: '#F8FAFC', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {facts.rank}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 10px' }}>
            <span style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <button
                type="button"
                onClick={onBack}
                aria-label={backLabel}
                style={{
                  width: 36, height: 36, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  fontSize: 21, lineHeight: 1, color: RV2.ink,
                }}
              >
                {glyph}
              </button>
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.015em', color: RV2.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {name}
              </div>
              <div data-compact-meta style={{ fontSize: 12, color: RV2.secondary }}>
                {score ? `${region} \u00B7 ${score.avg} ${fromMembers}` : region}
              </div>
            </div>
            {isEditMode && (
              <button
                type="button"
                onClick={onDelete}
                aria-label={t('review.wizard.deleteA11y')}
                style={{ width: 44, height: 44, borderRadius: 10, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: RV2.danger }}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
});
