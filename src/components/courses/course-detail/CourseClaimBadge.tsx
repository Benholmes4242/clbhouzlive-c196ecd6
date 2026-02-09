import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourseClaim } from '@/hooks/useCourseClaim';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

interface CourseClaimBadgeProps {
  courseId: string;
}

const CourseClaimBadge: React.FC<CourseClaimBadgeProps> = ({ courseId }) => {
  const navigate = useNavigate();
  const { data: claimingBusiness } = useCourseClaim(courseId);

  if (!claimingBusiness) return null;

  const handleTap = () => {
    if (claimingBusiness.slug) {
      navigate(`/business/${claimingBusiness.slug}`);
    } else {
      navigate(`/business/${claimingBusiness.id}`);
    }
  };

  if (claimingBusiness.is_verified) {
    return (
      <button
        type="button"
        onClick={handleTap}
        className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full active:scale-[0.97] transition-transform min-h-[44px]"
      >
        <VerifiedBadge size="sm" />
        <span>Official · {claimingBusiness.name}</span>
      </button>
    );
  }

  // Claimed but not verified
  return (
    <p className="text-xs text-muted-foreground">
      Managed by{' '}
      <button
        type="button"
        onClick={handleTap}
        className="text-foreground font-medium underline active:opacity-70 transition-opacity"
      >
        {claimingBusiness.name}
      </button>
    </p>
  );
};

export default CourseClaimBadge;
