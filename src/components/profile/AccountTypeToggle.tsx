import React from 'react';
import { User, Building2 } from 'lucide-react';

export type AccountType = 'personal' | 'business';

interface AccountTypeToggleProps {
  value: AccountType;
  onChange: (type: AccountType) => void;
  disabled?: boolean;
  variant?: 'default' | 'compact';
}

export const AccountTypeToggle: React.FC<AccountTypeToggleProps> = ({
  value,
  onChange,
  disabled = false,
  variant = 'default',
}) => {
  if (variant === 'compact') {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange('personal')}
          disabled={disabled}
          className={`flex items-center gap-2 px-3 py-2 rounded-sq-pill text-sm transition-all duration-200 ${
            value === 'personal'
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <User className="h-4 w-4" />
          Golfer
        </button>

        <button
          type="button"
          onClick={() => onChange('business')}
          disabled={disabled}
          className={`flex items-center gap-2 px-3 py-2 rounded-sq-pill text-sm transition-all duration-200 ${
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
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => onChange('personal')}
        disabled={disabled}
        className={`w-full flex items-center gap-4 p-4 rounded-sq-md border transition-all duration-200 ${
          value === 'personal'
            ? 'bg-foreground/5 border-foreground/40'
            : 'bg-background border-border hover:border-foreground/20'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className={`p-2 rounded-full ${value === 'personal' ? 'bg-foreground text-background' : 'bg-muted'}`}>
          <User className="h-5 w-5" />
        </div>
        <div className="text-left">
          <div className="font-medium">Golfer</div>
          <div className="text-sm text-muted-foreground">I'm signing up for myself</div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onChange('business')}
        disabled={disabled}
        className={`w-full flex items-center gap-4 p-4 rounded-sq-md border transition-all duration-200 ${
          value === 'business'
            ? 'bg-foreground/5 border-foreground/40'
            : 'bg-background border-border hover:border-foreground/20'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className={`p-2 rounded-full ${value === 'business' ? 'bg-foreground text-background' : 'bg-muted'}`}>
          <Building2 className="h-5 w-5" />
        </div>
        <div className="text-left">
          <div className="font-medium">Business</div>
          <div className="text-sm text-muted-foreground">Golf club, academy, shop, brand, etc.</div>
        </div>
      </button>
    </div>
  );
};
