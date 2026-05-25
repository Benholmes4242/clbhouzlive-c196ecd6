import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface LearnEmptyStateProps {
  className?: string;
}

/**
 * LearnEmptyState - Shown when Learn has limited content
 * Calm, non-pushy messaging
 */
export const LearnEmptyState: React.FC<LearnEmptyStateProps> = ({ className }) => {
  const navigate = useNavigate();

  return (
    <div className={cn("px-5 py-16 text-center", className)}>
      <p className="text-secondary text-body-md leading-relaxed max-w-sm mx-auto mb-6">
        We're building learning paths tailored to your game. More coming soon.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/watch')}
        className="text-slate-600 border-slate-300 hover:bg-slate-50"
      >
        Explore Watch
      </Button>
    </div>
  );
};

export default LearnEmptyState;
