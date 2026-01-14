import React from 'react';
import { cn } from '@/lib/utils';


interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  iconClassName?: string;
  /** Section type for automatic gradient styling */
  sectionType?: 'photos' | 'basic' | 'golf' | 'bio' | 'privacy';
}

/**
 * Get gradient classes based on section type
 */
const getGradientClasses = (sectionType?: string): { container: string; icon: string } => {
  switch (sectionType) {
    case 'photos':
      return { container: 'bg-gradient-to-br from-blue-50 to-blue-100', icon: 'text-blue-600' };
    case 'basic':
      return { container: 'bg-gradient-to-br from-slate-50 to-slate-100', icon: 'text-slate-600' };
    case 'golf':
      return { container: 'bg-gradient-to-br from-orange-50 to-orange-100', icon: 'text-orange-600' };
    case 'bio':
      return { container: 'bg-gradient-to-br from-emerald-50 to-emerald-100', icon: 'text-emerald-600' };
    case 'privacy':
      return { container: 'bg-gradient-to-br from-violet-50 to-violet-100', icon: 'text-violet-600' };
    default:
      return { container: 'bg-primary/10', icon: 'text-primary' };
  }
};

/**
 * SectionHeader - Consistent header component with gradient icon circle, title and subtitle
 * Used across all edit profile sections for visual consistency
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  subtitle,
  iconClassName,
  sectionType,
}) => {
  const gradientClasses = getGradientClasses(sectionType);
  
  // Clone icon element to apply gradient icon color
  const styledIcon = React.isValidElement(icon) 
    ? React.cloneElement(icon as React.ReactElement<any>, {
        className: cn(
          (icon as React.ReactElement<any>).props.className,
          gradientClasses.icon
        )
      })
    : icon;
  
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
        gradientClasses.container,
        iconClassName
      )}>
        {styledIcon}
      </div>
      <div>
        <h2 className="text-base font-semibold text-[#1e293b]">
          {title}
        </h2>
        <p className="text-sm text-[#64748b]">
          {subtitle}
        </p>
      </div>
    </div>
  );
};
