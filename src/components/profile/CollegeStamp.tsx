import React from 'react';
import { useCollegeMediaByName } from '@/hooks/useCollegeMediaSearch';

interface CollegeStampProps {
  normalizedName: string;
  className?: string;
  /** If provided, shows a dot divider before the college stamp */
  withDivider?: boolean;
  /** 'alumni' for attended college, 'supporter' for followed-only */
  variant?: 'alumni' | 'supporter';
}

/**
 * Displays a small college badge with logo, short name, and Alumni/Supporter label.
 * Shows fallback letter if logo is missing.
 */
export const CollegeStamp: React.FC<CollegeStampProps> = ({ 
  normalizedName,
  className = '',
  withDivider = false,
  variant = 'alumni',
}) => {
  const { data: college, isLoading } = useCollegeMediaByName(normalizedName);

  if (isLoading || !college) return null;

  const displayName = college.short_name || college.college_name;
  const firstLetter = displayName?.charAt(0)?.toUpperCase() || 'C';
  const isSupporter = variant === 'supporter';

  return (
    <div 
      className={`flex items-center gap-1.5 ${className}`}
      title={isSupporter ? 'College supporter' : 'College alumni badge'}
    >
      {withDivider && (
        <span className="text-muted-foreground/40 mx-1">·</span>
      )}
      {college.logo_url ? (
        <img 
          src={college.logo_url} 
          alt={`${displayName} logo`}
          className="w-5 h-5 rounded-full object-contain bg-background"
          style={{ opacity: isSupporter ? 0.7 : 1 }}
        />
      ) : (
        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
          <span className="text-[10px] font-medium text-muted-foreground">
            {firstLetter}
          </span>
        </div>
      )}
      <span
        className="text-sm"
        style={{
          fontWeight: isSupporter ? 500 : 600,
          color: isSupporter ? 'rgba(0,0,0,0.5)' : undefined,
          fontSize: '11px',
        }}
      >
        {displayName}
      </span>
      <span
        style={{
          fontSize: '10px',
          fontWeight: isSupporter ? 500 : 600,
          color: isSupporter ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.45)',
        }}
      >
        · {isSupporter ? 'Supporter' : 'Alumni'}
      </span>
    </div>
  );
};

export default CollegeStamp;
