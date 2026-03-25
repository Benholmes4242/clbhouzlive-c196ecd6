import React from 'react';
import { Lock, Globe, Users, UserCheck } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type VisibilityValue = 'public' | 'followers' | 'friends' | 'private';

interface VisibilityOption {
  value: VisibilityValue;
  label: string;
  icon: React.ElementType;
}

const VISIBILITY_OPTIONS: VisibilityOption[] = [
  { value: 'public', label: 'Everyone', icon: Globe },
  { value: 'followers', label: 'Followers & Friends', icon: Users },
  { value: 'friends', label: 'Friends only', icon: UserCheck },
  { value: 'private', label: 'Only me', icon: Lock },
];

interface VisibilityDropdownProps {
  value: VisibilityValue;
  onChange: (value: VisibilityValue) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const VisibilityDropdown: React.FC<VisibilityDropdownProps> = ({
  value,
  onChange,
  label = 'Visible to',
  disabled = false,
  size = 'sm',
  className,
}) => {
  const selectedOption = VISIBILITY_OPTIONS.find(o => o.value === value) || VISIBILITY_OPTIONS[0];
  const Icon = selectedOption.icon;
  const isPrivate = value === 'private';

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {isPrivate && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
      <Select value={value} onValueChange={onChange} disabled={disabled} modal={false}>
        <SelectTrigger 
          className={cn(
            "gap-1.5 border border-border/60 bg-muted/60 hover:bg-muted transition-colors rounded-full",
            size === 'sm' ? "h-7 px-2.5 text-[11px]" : "h-9 px-4 text-sm"
          )}
        >
          <Icon className="w-3 h-3 text-muted-foreground" />
          <SelectValue>
            <span className="text-foreground/60">{label}:</span>
            <span className="ml-1 font-semibold text-foreground">{selectedOption.label}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end" className="min-w-[200px] bg-white border-slate-200 z-50 rounded-sq-sm shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          {VISIBILITY_OPTIONS.map((option) => {
            const OptionIcon = option.icon;
            const isSelected = option.value === value;
            return (
              <SelectItem 
                key={option.value} 
                value={option.value} 
                className={cn(
                  "text-sm",
                  isSelected && "bg-[#e2e8f0]"
                )}
              >
                <div className="flex items-center gap-2">
                  <OptionIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

export const visibilityLabel = (v: VisibilityValue) => 
  VISIBILITY_OPTIONS.find(o => o.value === v)?.label || 'Everyone';
