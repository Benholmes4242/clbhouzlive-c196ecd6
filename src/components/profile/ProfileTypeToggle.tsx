import React from 'react';
import { User, Building2 } from 'lucide-react';
import { ProfileType } from '@/types/profile';

interface ProfileTypeToggleProps {
  value: ProfileType;
  onChange: (type: ProfileType) => void;
  disabled?: boolean;
}

export const ProfileTypeToggle: React.FC<ProfileTypeToggleProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex gap-2 mb-6">
      <button
        type="button"
        onClick={() => onChange('personal')}
        disabled={disabled}
        className={`flex items-center gap-2 px-4 py-2 rounded-sq-pill transition-all duration-200 ${
          value === 'personal'
            ? 'bg-foreground text-background'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <User className="h-4 w-4" />
        Personal
      </button>

      <button
        type="button"
        onClick={() => onChange('business')}
        disabled={disabled}
        className={`flex items-center gap-2 px-4 py-2 rounded-sq-pill transition-all duration-200 ${
          value === 'business'
            ? 'bg-foreground text-background'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Building2 className="h-4 w-4" />
        Business
      </button>
    </div>
  );
};
