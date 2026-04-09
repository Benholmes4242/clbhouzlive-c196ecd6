/**
 * TEMPORARY DEBUG PAGE — Remove before shipping
 * Preview the ReviewWizard SuccessScreen without submitting a review
 */
import { SuccessScreen } from '@/components/courses/review-wizard/SuccessScreen';
import { useState } from 'react';

const MOCK_COURSE = {
  id: 'debug-123',
  name: 'Royal County Down',
  thumbnail_image: null,
  country: 'Northern Ireland',
  sub_country: null,
  region: 'Down',
};

export default function ReviewSuccessDebug() {
  const [variant, setVariant] = useState<'standard' | 'shared'>('standard');
  const [isEdit, setIsEdit] = useState(false);

  return (
    <div className="relative w-full h-screen">
      {/* Toggle controls */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[99999] flex gap-2 bg-black/80 rounded-full px-4 py-2">
        <button
          onClick={() => { setVariant('standard'); setIsEdit(false); }}
          className={`text-xs px-3 py-1 rounded-full ${variant === 'standard' && !isEdit ? 'bg-white text-black' : 'text-white/60'}`}
        >
          New Review
        </button>
        <button
          onClick={() => { setVariant('standard'); setIsEdit(true); }}
          className={`text-xs px-3 py-1 rounded-full ${isEdit ? 'bg-white text-black' : 'text-white/60'}`}
        >
          Edit Review
        </button>
        <button
          onClick={() => { setVariant('shared'); setIsEdit(false); }}
          className={`text-xs px-3 py-1 rounded-full ${variant === 'shared' ? 'bg-white text-black' : 'text-white/60'}`}
        >
          Shared
        </button>
      </div>

      <SuccessScreen
        variant={variant}
        course={MOCK_COURSE}
        ratingId="debug-rating-123"
        rating={8.2}
        isEditMode={isEdit}
        previousRating={isEdit ? 7.1 : null}
        postId={variant === 'shared' ? 'debug-post-123' : undefined}
        isAutoSharing={false}
        autoShareComplete={variant === 'shared'}
        onViewReview={() => alert('View review')}
        onViewPost={() => alert('View post')}
        onGoToClubhouse={() => alert('Go to clubhouse')}
        onDone={() => alert('Done')}
        onOptOutShare={() => alert('Opt out')}
        onShareToClubhouse={() => alert('Share to clubhouse')}
        isSharing={false}
      />
    </div>
  );
}
