import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TITLE } from '@/lib/tokens/type';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SegToggle } from '@/components/profile/edit-v2/SegToggle';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfileData } from '@/hooks/useProfileData';
import { supabase } from '@/integrations/supabase/client';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { whsKeys } from '@/lib/whs/hooks';
import { toast } from '@/lib/toast';

// Daylight tokens - kept in-file so this component never depends on a
// section-scoped stylesheet.
const SF_STACK = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const INK = '#0F172A';
const INK_55 = '#64748B';
const INK_10 = 'rgba(15,23,42,0.08)';
const AMBER = '#F7931E';

const STORAGE_KEY = 'gender_prompt_seen';

// Female first in this sheet (per brief). Values match the exact enum
// used by ManageProfile / useProfileSave so the write shape is identical.
const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

/**
 * One-time, one-per-device gender capture. Renders inside the authed
 * app shell; skips when:
 *   - unauthenticated
 *   - profile not resolved
 *   - profile.gender already set
 *   - localStorage 'gender_prompt_seen' is set
 *   - on an /auth route
 *   - any radix dialog is already open at the trigger tick
 *
 * The write path mirrors useProfileSave (src/hooks/useProfileSave.ts:79):
 * `supabase.from('user_profiles').update({ gender }).eq('id', userId)`.
 * Column, enum values, and update shape are identical - no new mutation.
 */
export const GenderPromptSheet: React.FC = () => {
  const { user } = useSupabaseSession();
  const { profile, loading: profileLoading } = useProfileData();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const shownFiredRef = useRef(false);

  const currentGender = (profile as any)?.gender as
    | 'male' | 'female' | 'prefer_not_to_say' | null | undefined;

  const eligible = useMemo(() => {
    if (!user) return false;
    if (profileLoading) return false;
    if (!profile) return false;
    if (currentGender) return false;
    if (location.pathname.startsWith('/auth')) return false;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return false;
    } catch { /* private mode - treat as unseen */ }
    return true;
  }, [user, profile, profileLoading, currentGender, location.pathname]);

  useEffect(() => {
    if (!eligible) return;
    if (open) return;

    const t = setTimeout(() => {
      // Skip this session if any other dialog / modal is already mounted.
      // Radix marks open dialogs with data-state="open" role="dialog".
      try {
        const anyOpenDialog = document.querySelector('[role="dialog"][data-state="open"]');
        if (anyOpenDialog) return;
      } catch { /* noop */ }
      setOpen(true);
    }, 1500);

    return () => clearTimeout(t);
  }, [eligible, open]);

  useEffect(() => {
    if (open && !shownFiredRef.current) {
      shownFiredRef.current = true;
      analyticsEvents.track('gender_prompt_shown');
    }
  }, [open]);

  const markSeen = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* noop */ }
  };

  const handleSkip = () => {
    analyticsEvents.track('gender_prompt_skipped');
    markSeen();
    setOpen(false);
  };

  const handleSave = async () => {
    if (!user || !selected || saving) return;
    setSaving(true);
    try {
      // Same write shape as useProfileSave (line 79). Enum values match
      // the column CHECK constraint via GENDER_OPTIONS above.
      const { error } = await supabase
        .from('user_profiles')
        .update({ gender: selected } as any)
        .eq('id', user.id);
      if (error) throw error;

      analyticsEvents.track('gender_prompt_answered', { value: selected });
      markSeen();

      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      queryClient.invalidateQueries({ queryKey: whsKeys.percentile(user.id) });

      setOpen(false);
    } catch (err) {
      toast.error('Could not save that. Try again.');
      // Non-fatal - sheet stays open so the user can retry.
    } finally {
      setSaving(false);
    }
  };

  const canSave = !!selected && !saving;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        // Swipe-down / backdrop dismiss is treated as a skip (same rule
        // as the explicit button - write nothing, mark seen, do not
        // re-prompt on this device).
        if (!next && open) {
          analyticsEvents.track('gender_prompt_skipped');
          markSeen();
        }
        setOpen(next);
      }}
    >
      <SheetContent
        side="bottom"
        hideCloseButton
        className="p-0 max-h-[90dvh] rounded-t-2xl"
        style={{
          background: '#FFFFFF',
          color: INK,
          fontFamily: SF_STACK,
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
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: AMBER,
            }}
          >
            Personalise clbhouz
          </div>
          <h2
            style={{
              margin: '8px 0 0',
              ...TITLE,
              color: INK,
            }}
          >
            See the right comparisons for you
          </h2>
          <p
            style={{
              margin: '10px 0 0',
              fontSize: 13,
              lineHeight: 1.5,
              color: INK_55,
            }}
          >
            We use this to compare your game with the right golfers and show you relevant tours and tees. It is never shown on your profile.
          </p>
        </div>

        <div style={{ padding: '18px 20px 8px' }}>
          <SegToggle
            options={GENDER_OPTIONS}
            value={selected}
            onChange={setSelected}
          />
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
              fontFamily: SF_STACK,
              fontSize: 15,
              fontWeight: 700,
              color: '#FFFFFF',
              background: canSave ? INK : 'rgba(15,23,42,0.35)',
              transition: 'background 160ms ease',
            }}
          >
            {saving ? 'Saving...' : 'Save'}
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
              fontFamily: SF_STACK,
              fontSize: 14,
              fontWeight: 600,
              color: INK_55,
            }}
          >
            Skip for now
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default GenderPromptSheet;
