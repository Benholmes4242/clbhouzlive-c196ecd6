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
      </div>

      <SectionCard>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-[13px] font-medium text-muted-foreground">Display Name</label>
              <span className="text-[11px] text-muted-foreground">
                {form.displayName.length}/{DISPLAY_NAME_MAX}
              </span>
            </div>
            <input
              type="text"
              value={form.displayName}
              maxLength={DISPLAY_NAME_MAX}
              onChange={(e) => onFieldChange('displayName', e.target.value)}
              placeholder="Your full name"
              className="w-full bg-muted border-0 rounded-xl px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(38,92%,50%)]/40 focus:bg-background transition-colors"
            />
            {displayNameError && (
              <p className="text-[12px] text-destructive mt-1">{displayNameError}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-[13px] font-medium text-muted-foreground">Username</label>
              {usernameIsLocked && (
                <span className="text-[11px] text-muted-foreground">
                  Contact{' '}
                  <a
                    href="mailto:support@clbhouz.co.uk"
                    className="underline text-muted-foreground"
                  >
                    support@clbhouz.co.uk
                  </a>
                  {' '}to change
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-muted-foreground">@</span>
              <input
                type="text"
                value={form.username}
                maxLength={USERNAME_MAX}
                readOnly={usernameIsLocked}
                onChange={(e) => !usernameIsLocked && onFieldChange('username', e.target.value)}
                placeholder="username"
                className={`w-full bg-muted border-0 rounded-xl pl-8 pr-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(38,92%,50%)]/40 focus:bg-background transition-colors ${usernameIsLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
