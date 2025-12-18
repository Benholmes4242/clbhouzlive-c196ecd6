import React from 'react';
import { Lock, Globe, Users, UserCheck } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
}

export const VisibilityDropdown: React.FC<VisibilityDropdownProps> = ({
  value,
  onChange,
  label = 'Visible to',
  disabled = false,
}) => {
  const selectedOption = VISIBILITY_OPTIONS.find(o => o.value === value) || VISIBILITY_OPTIONS[0];
  const Icon = selectedOption.icon;

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-7 w-auto gap-1.5 px-2 text-[11px] border-none bg-muted/50 hover:bg-muted transition-colors">
        <Icon className="w-3 h-3 text-muted-foreground" />
        <SelectValue>
          <span className="text-muted-foreground">{label}:</span>
          <span className="ml-1 font-medium">{selectedOption.label}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {VISIBILITY_OPTIONS.map((option) => {
          const OptionIcon = option.icon;
          return (
            <SelectItem key={option.value} value={option.value} className="text-sm">
              <div className="flex items-center gap-2">
                <OptionIcon className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{option.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};
