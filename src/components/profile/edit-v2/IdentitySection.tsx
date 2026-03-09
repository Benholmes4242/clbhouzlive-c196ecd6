import { DISPLAY_NAME_MAX, USERNAME_MAX } from '@/components/profile/profile-wizard/types';

interface Props {
  displayName: string;
  username: string;
  usernameIsLocked: boolean;
  onDisplayNameChange: (v: string) => void;
  displayNameError?: string;
}

export function IdentitySection({
  displayName, username, usernameIsLocked,
  onDisplayNameChange, displayNameError,
}: Props) {
  return (
    <div className="space-y-3">
      <div>
        <div className="flex justify-between items-baseline mb-1.5">
          <label className="text-[13px] font-medium text-muted-foreground">Display Name</label>
          <span className="text-[11px] text-muted-foreground">
            {displayName.length}/{DISPLAY_NAME_MAX}
          </span>
        </div>
        <input
          type="text"
          value={displayName}
          maxLength={DISPLAY_NAME_MAX}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          placeholder="Your full name"
          className="w-full bg-muted border-0 rounded-xl px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors"
        />
        {displayNameError && (
          <p className="text-[12px] text-destructive mt-1">{displayNameError}</p>
        )}
      </div>

      <div>
        <div className="flex justify-between items-baseline mb-1.5">
          <label className="text-[13px] font-medium text-muted-foreground">Username</label>
          {usernameIsLocked && (
            <span className="text-[11px] text-muted-foreground">Cannot be changed</span>
          )}
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-muted-foreground">@</span>
          <input
            type="text"
            value={username}
            maxLength={USERNAME_MAX}
            readOnly={usernameIsLocked}
            placeholder="username"
            className={`w-full bg-muted border-0 rounded-xl pl-8 pr-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors ${usernameIsLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>
      </div>
    </div>
  );
}
