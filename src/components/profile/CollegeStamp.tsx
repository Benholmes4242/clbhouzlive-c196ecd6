import React from 'react';
import { useCollegeMediaByName } from '@/hooks/useCollegeMediaSearch';

interface CollegeStampProps {
  normalizedName: string;
  className?: string;
  /** If provided, shows a dot divider before the college stamp */
  withDivider?: boolean;
}

/**
 * Displays a small college badge with logo and short name.
 * Shows fallback letter if logo is missing.
 * No "College:" label — keep it premium.
 */
export const CollegeStamp: React.FC<CollegeStampProps> = ({ 
  normalizedName,
  className = '',
  withDivider = false,
}) => {
  const { data: college, isLoading } = useCollegeMediaByName(normalizedName);

  if (isLoading || !college) return null;

  const displayName = college.short_name || college.college_name;
  const firstLetter = displayName?.charAt(0)?.toUpperCase() || 'C';

  return (
    <div 
      className={`flex items-center gap-1.5 ${className}`}
      title="College alumni badge"
    >
      {withDivider && (
        <span className="text-muted-foreground/40 mx-1">·</span>
      )}
      {college.logo_url ? (
        <img 
          src={college.logo_url} 
          alt={`${displayName} logo`}
          className="w-5 h-5 rounded-full object-contain bg-background"
        />
      ) : (
        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
          <span className="text-[10px] font-medium text-muted-foreground">
            {firstLetter}
          </span>
        </div>
      )}
      <span className="text-sm profile-text-secondary">{displayName}</span>
    </div>
  );
};

export default CollegeStamp;
