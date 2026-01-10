import React from 'react';
import { useCollegeMediaByName } from '@/hooks/useCollegeMediaSearch';
import { GraduationCap } from 'lucide-react';

interface CollegeStampProps {
  normalizedName: string;
  className?: string;
}

/**
 * Displays a small college badge with logo and short name.
 * Shows fallback if logo is missing.
 */
export const CollegeStamp: React.FC<CollegeStampProps> = ({ 
  normalizedName,
  className = '' 
}) => {
  const { data: college, isLoading } = useCollegeMediaByName(normalizedName);

  if (isLoading || !college) return null;

  const displayName = college.short_name || college.college_name;
  const firstLetter = displayName?.charAt(0)?.toUpperCase() || 'C';

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {college.logo_url ? (
        <img 
          src={college.logo_url} 
          alt={`${displayName} logo`}
          className="w-5 h-5 rounded-full object-contain bg-background"
        />
      ) : (
        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
          <GraduationCap className="w-3 h-3 text-muted-foreground" />
        </div>
      )}
      <span className="text-sm profile-text-secondary">{displayName}</span>
    </div>
  );
};

export default CollegeStamp;
