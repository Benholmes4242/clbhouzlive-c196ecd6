import React from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  iconClassName?: string;
}

/**
 * SectionHeader - Consistent header component with icon, title and subtitle
 * Used across all edit profile sections for visual consistency
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  subtitle,
  iconClassName,
}) => {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
        "bg-primary/10",
        iconClassName
      )}>
        {icon}
      </div>
      <div>
        <h2 className="text-base font-semibold text-foreground">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {subtitle}
        </p>
      </div>
    </div>
  );
};
