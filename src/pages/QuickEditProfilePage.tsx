/**
 * QuickEditProfilePage — single-page edit for returning users.
 * Reuses wizard step components but renders all sections stacked.
 * No wizard chrome, no slide animation, sticky save bar at the bottom.
 */
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';
import { useProfileData } from '@/hooks/useProfileData';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfileForm } from '@/hooks/useProfileForm';
import { useProfileSave } from '@/hooks/useProfileSave';
import { Button } from '@/components/ui/button';
import { PhotosIdentityStep } from '@/components/profile/profile-wizard/steps/PhotosIdentityStep';
import { GolfInfoStep } from '@/components/profile/profile-wizard/steps/GolfInfoStep';
import { AboutStep } from '@/components/profile/profile-wizard/steps/AboutStep';

export default function QuickEditProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();
  const { profile, loading } = useProfileData();

  const {
    form, setField, isDirty, errors, isValid,
    addWebsite, removeWebsite, updateWebsite,
    addClub, removeClub,
  } = useProfileForm(profile, loading);

  const { save, isSaving } = useProfileSave(user?.id ?? '');

  const usernameIsLocked = !!(profile as any)?.has_completed_onboarding;

  if (loading) return <ProfileSkeleton />;

  const handleSave = async () => {
    const ok = await save(form);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      navigate(-1);
    }
  };

  const isDisabled = !isValid || !isDirty || isSaving;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 bg-background border-b border-border"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
          height: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 56px)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(15,23,42,0.05)',
            border: '0.5px solid rgba(15,23,42,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, cursor: 'pointer',
          }}
          aria-label="Back"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>

        <div className="text-center">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              Profile
            </span>
          </div>
          <p style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
            Edit
          </p>
        </div>

        <div className="w-9 h-9 flex-shrink-0" />
      </div>

      {/* Stacked sections */}
      <div
        className="flex-1 overflow-y-auto pt-4"
        style={{ paddingBottom: 'calc(var(--sab) + 96px)' }}
      >
        <PhotosIdentityStep
          form={form}
          usernameIsLocked={usernameIsLocked}
          displayNameError={errors.displayName}
          onFieldChange={setField}
        />
        <GolfInfoStep
          form={form}
          onFieldChange={setField}
          onAddClub={addClub}
          onRemoveClub={removeClub}
        />
        <AboutStep
          form={form}
          errors={errors}
          onFieldChange={setField}
          onAddWebsite={addWebsite}
          onRemoveWebsite={removeWebsite}
          onUpdateWebsite={updateWebsite}
        />
      </div>

      {/* Sticky save bar */}
      <div
        className="fixed bottom-0 inset-x-0 px-4 pt-3 bg-background border-t border-border"
        style={{ paddingBottom: 'calc(var(--sab) + 16px)' }}
      >
        <Button
          onClick={handleSave}
          disabled={isDisabled}
          className="w-full min-h-[52px] rounded-[14px] text-[15px] font-bold border-0 active:opacity-90 transition-opacity"
          style={{
            background: isDisabled ? 'rgba(15,23,42,0.06)' : '#F7931E',
            color: isDisabled ? 'rgba(15,23,42,0.45)' : '#ffffff',
            boxShadow: isDisabled ? 'none' : '0 4px 16px rgba(247,147,30,0.28)',
          }}
        >
          {isSaving ? (
            <><Loader2 size={18} className="animate-spin mr-2" /> Saving…</>
          ) : isDirty ? (
            'Save Profile'
          ) : (
            'All Saved'
          )}
        </Button>
      </div>
    </div>
  );
}
