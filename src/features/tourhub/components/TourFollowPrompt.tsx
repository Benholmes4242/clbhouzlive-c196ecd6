/**
 * TourFollowPrompt - first-visit tour preference sheet.
 *
 * Trigger (all must hold):
 *   - localStorage 'tour-follow-prompt-seen' absent
 *   - readStoredTour() returns null (no existing preference)
 *   - profile has loaded (auth resolved)
 *   - no other radix dialog already open at the trigger tick
 *
 * NOTE: This prompt asks tour preference directly. It MUST NOT read or
 * infer profile.gender in any way.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfileData } from '@/hooks/useProfileData';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { readStoredTour, type CanonicalTourSlug } from '../hooks/useTourSelection';
import { useTourSelection } from '../context/TourSelectionContext';

const STORAGE_KEY = 'tour-follow-prompt-seen';

const GEIST = 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const INK = '#0F172A';
const INK_55 = '#64748B';
const INK_10 = 'rgba(15,23,42,0.08)';
const INK_BORDER = 'rgba(15,23,42,0.12)';
const AMBER = '#F7931E';

// Canonical slugs from useTourSelection.ts.
const TOUR_ORDER: CanonicalTourSlug[] = ['pga', 'lpga', 'euro', 'liv', 'champ', 'pgad'];

export const TourFollowPrompt: React.FC = () => {
  const { t } = useTranslation('tourhub');
  const { user } = useSupabaseSession();
  const { profile, loading: profileLoading } = useProfileData();
  const { selectTour } = useTourSelection();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CanonicalTourSlug | ''>('');
  const shownFiredRef = useRef(false);
  const skipFiredRef = useRef(false);

  const eligible = useMemo(() => {
    if (!user) return false;
    if (profileLoading) return false;
    if (!profile) return false;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return false;
    } catch { /* private mode - treat as unseen */ }
    if (readStoredTour() !== null) return false;
    return true;
  }, [user, profile, profileLoading]);

  useEffect(() => {
    if (!eligible || open) return;
    const t = setTimeout(() => {
      try {
        const anyOpen = document.querySelector('[role="dialog"][data-state="open"]');
        if (anyOpen) return;
      } catch { /* noop */ }
      setOpen(true);
    }, 800);
    return () => clearTimeout(t);
  }, [eligible, open]);

  useEffect(() => {
    if (open && !shownFiredRef.current) {
      shownFiredRef.current = true;
      // Callsite: TourFollowPrompt open effect.
      analyticsEvents.track('tour_follow_prompt_shown');
    }
  }, [open]);

  const markSeen = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* noop */ }
  };

  const fireSkip = () => {
    if (skipFiredRef.current) return;
    skipFiredRef.current = true;
    // Callsite: skip button / backdrop dismiss.
    analyticsEvents.track('tour_follow_prompt_skipped');
  };

  const handleSkip = () => {
    fireSkip();
    markSeen();
    setOpen(false);
  };

  const handleSave = () => {
    if (!selected) return;
    // Callsite: save button.
    analyticsEvents.track('tour_follow_prompt_answered', { tour: selected });
    markSeen();
    // Routes through TourSelectionContext -> writeStoredTour under the hood.
    selectTour(selected);
    setOpen(false);
  };

  const canSave = !!selected;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next && open) {
          fireSkip();
          markSeen();
        }
        setOpen(next);
      }}
    >
      <SheetContent
        side="bottom"
        hideCloseButton
        className="p-0 max-h-[75dvh] rounded-t-2xl"
        style={{
          background: '#FFFFFF',
          color: INK,
          fontFamily: GEIST,
          paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: INK_10 }} />
        </div>

        <div style={{ padding: '18px 20px 4px' }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: AMBER,
            }}
          >
            {t('followPrompt.eyebrow')}
          </div>
          <h2
            style={{
              margin: '8px 0 0',
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 1.2,
              color: INK,
              letterSpacing: '-0.01em',
            }}
          >
            {t('followPrompt.title')}
          </h2>
          <p
            style={{
              margin: '10px 0 0',
              fontSize: 13,
              lineHeight: 1.5,
              color: INK_55,
            }}
          >
            {t('followPrompt.body')}
          </p>
        </div>

        <div
          style={{
            padding: '16px 20px 8px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          {TOUR_ORDER.map((slug) => {
            const active = selected === slug;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => setSelected(slug)}
                style={{
                  minHeight: 40,
                  padding: '0 14px',
                  borderRadius: 10,
                  fontFamily: GEIST,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: active ? INK : 'transparent',
                  color: active ? '#FFFFFF' : INK,
                  border: `1px solid ${active ? INK : INK_BORDER}`,
                  transition: 'background 140ms ease, color 140ms ease',
                }}
              >
                {t(`followPrompt.tours.${slug}`)}
              </button>
            );
          })}
        </div>

        <div style={{ padding: '12px 20px 8px' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            style={{
              width: '100%',
              minHeight: 48,
              borderRadius: 12,
              border: 'none',
              cursor: canSave ? 'pointer' : 'default',
              fontFamily: GEIST,
              fontSize: 15,
              fontWeight: 700,
              color: '#FFFFFF',
              background: canSave ? INK : 'rgba(15,23,42,0.35)',
              transition: 'background 160ms ease',
            }}
          >
            {t('followPrompt.save')}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            style={{
              width: '100%',
              marginTop: 6,
              minHeight: 44,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: GEIST,
              fontSize: 14,
              fontWeight: 600,
              color: INK_55,
            }}
          >
            {t('followPrompt.skip')}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TourFollowPrompt;
