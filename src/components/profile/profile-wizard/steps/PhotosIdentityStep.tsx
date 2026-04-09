import { ProfileFormData } from '../types';
import { HeaderPhotoCard } from '@/components/profile/edit-v2/HeaderPhotoCard';
import { ProfilePhotoCard } from '@/components/profile/edit-v2/ProfilePhotoCard';
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';
import { DISPLAY_NAME_MAX, USERNAME_MAX } from '../types';

interface Props {
  form: ProfileFormData;
  usernameIsLocked: boolean;
  displayNameError?: string;
  onFieldChange: <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => void;
}

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const;

export function PhotosIdentityStep({
  form, usernameIsLocked, displayNameError, onFieldChange,
}: Props) {
  return (
    <div className="space-y-4 px-4 pb-4">
      <HeaderPhotoCard
        currentUrl={form.headerPhotoUrl}
        onFileChange={(file) => {
          onFieldChange('headerPhotoBlob', file);
          if (file) {
            onFieldChange('headerPhotoUrl', URL.createObjectURL(file));
          }
        }}
        onRemove={() => {
          onFieldChange('headerPhotoBlob', null);
          onFieldChange('headerPhotoUrl', null);
        }}
      />

      <div className="-mt-10 ml-4 mb-2 z-10 relative">
        <ProfilePhotoCard
          currentUrl={form.profilePhotoUrl}
          onFileChange={(file) => {
            onFieldChange('profilePhotoBlob', file);
            if (file) {
              onFieldChange('profilePhotoUrl', URL.createObjectURL(file));
            }
          }}
        />
        {!form.profilePhotoBlob && !form.profilePhotoUrl && (
          <p className="text-[12px] text-[hsl(38,92%,50%)] mt-1.5 ml-1">
            👋 Golfers with a photo get 3× more friend requests
          </p>
        )}
      </div>

      <SectionCard noPadding>
        <div>
          {/* Display Name field */}
          <div className="px-4 pt-4 pb-3 border-b border-border/50">
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Display Name
              </label>
              <span className="text-[11px] text-muted-foreground/60">
                {form.displayName.length}/{DISPLAY_NAME_MAX}
              </span>
            </div>
            <input
              type="text"
              value={form.displayName}
              maxLength={DISPLAY_NAME_MAX}
              onChange={(e) => onFieldChange('displayName', e.target.value)}
              placeholder="Your full name"
              className="w-full bg-[#F8FAFC] border border-border/60 rounded-[10px] px-3.5 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(38,92%,50%)]/40 focus:bg-background transition-colors"
            />
            {displayNameError && (
              <p className="text-[12px] text-destructive mt-1">{displayNameError}</p>
            )}
          </div>

          {/* Username field */}
          <div className="px-4 pt-3 pb-4 border-b border-border/50">
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Username
              </label>
              {usernameIsLocked && (
                <span className="text-[11px] text-muted-foreground/60">
                  Contact{' '}
                  <a
                    href="mailto:support@clbhouz.co.uk"
                    className="underline text-muted-foreground/60"
                  >
                    support@clbhouz.co.uk
                  </a>
                  {' '}to change
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted-foreground">@</span>
              <input
                type="text"
                value={form.username}
                maxLength={USERNAME_MAX}
                readOnly={usernameIsLocked}
                onChange={(e) => !usernameIsLocked && onFieldChange('username', e.target.value)}
                placeholder="username"
                className={`w-full bg-[#F8FAFC] border border-border/60 rounded-[10px] pl-8 pr-3.5 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(38,92%,50%)]/40 focus:bg-background transition-colors ${usernameIsLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>

          {/* Gender field */}
          <div className="px-4 pt-3 pb-4">
            <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground mb-2 block">
              Gender
            </label>
            <div className="flex gap-2 flex-wrap">
              {GENDER_OPTIONS.map((opt) => {
                const isActive = form.gender === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onFieldChange('gender', isActive ? '' : opt.value)}
                    className="transition-all active:scale-[0.97]"
                    style={{
                      padding: '8px 16px',
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 400,
                      borderRadius: 20,
                      background: isActive ? 'rgba(247,147,30,0.12)' : 'rgba(0,0,0,0.05)',
                      border: isActive ? '1px solid rgba(247,147,30,0.35)' : '1px solid #e2e8f0',
                      color: isActive ? '#F7931E' : '#64748b',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}