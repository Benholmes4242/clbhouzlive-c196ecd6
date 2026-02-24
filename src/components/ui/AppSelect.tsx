/**
 * AppSelect – The canonical select component for Clbhouz.
 * 
 * NOTE: Do not use native <select> for in-app filters – always use <AppSelect>.
 * This ensures consistent styling across the app (slate-on-white dropdowns,
 * same animation, and "opens above when needed" behaviour via Radix).
 */

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type AppSelectOption<T extends string = string> = {
  value: T;
  label: string;
};

interface AppSelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly AppSelectOption<T>[] | AppSelectOption<T>[];
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  triggerClassName?: string;
  /** Optional icon to show before the value */
  icon?: React.ReactNode;
}

export function AppSelect<T extends string = string>({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  className,
  triggerClassName,
  icon,
}: AppSelectProps<T>) {
  return (
    <div className={cn('relative', className)}>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger
          aria-label={ariaLabel}
          className={cn(
            'h-9 rounded-sq-sm border border-border bg-card px-3 text-sm text-[hsl(210,13%,18%)]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-border/60 focus-visible:border-border',
            '',
            icon && 'pl-2',
            triggerClassName
          )}
        >
          {icon && <span className="mr-1.5 text-muted-foreground">{icon}</span>}
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-card border-border z-50 rounded-sq-sm shadow-lg">
          {options.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className="text-sm cursor-pointer"
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
