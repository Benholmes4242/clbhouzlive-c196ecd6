import React, { useState } from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import type { ReviewResponse } from '@/hooks/useReviewResponses';
import type { BusinessClaimContext } from '@/hooks/useBusinessClaimForCourse';

const formatRelativeDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;
  const weeks = Math.floor(diffInDays / 7);
  if (diffInDays < 30) return `${weeks}w ago`;
  const months = Math.floor(diffInDays / 30);
  if (diffInDays < 365) return `${months}mo ago`;
  return `${Math.floor(diffInDays / 365)}y ago`;
};

// --- Existing response display ---

interface ResponseDisplayProps {
  response: ReviewResponse;
}

export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ response }) => {
  return (
    <div className="ml-4 mt-3 pl-4 border-l-2 border-[#334E3D]">
      <div className="flex items-center gap-2 mb-1.5">
        {response.business_logo_url ? (
          <SquircleAvatar
            src={response.business_logo_url}
            alt={response.business_name}
            size={28}
            fallback={response.business_name.slice(0, 2).toUpperCase()}
          />
        ) : (
          <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-xs font-semibold text-foreground">
            {response.business_name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{response.business_name}</span>
          {response.business_is_verified && <VerifiedBadge size="sm" />}
          <span className="text-xs text-muted-foreground">· Owner response</span>
        </div>
      </div>
      <p className="text-sm text-foreground leading-relaxed">{response.response_text}</p>
      <p className="text-xs text-muted-foreground mt-1">{formatRelativeDate(response.created_at)}</p>
    </div>
  );
};

// --- Reply form for business owners ---

interface ReplyFormProps {
  businessClaim: BusinessClaimContext;
  reviewId: string;
  onSubmit: (reviewId: string, businessId: string, text: string) => void;
  isSubmitting: boolean;
}

export const ReplyForm: React.FC<ReplyFormProps> = ({
  businessClaim,
  reviewId,
  onSubmit,
  isSubmitting,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');

  if (!expanded) {
    return (
      <div className="ml-4 mt-2">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-sm text-[#334E3D] font-medium active:opacity-70 transition-opacity min-h-[44px] px-1"
        >
          Reply
        </button>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(reviewId, businessClaim.businessId, text.trim());
    setText('');
    setExpanded(false);
  };

  return (
    <div className="ml-4 mt-3 pl-4 border-l-2 border-border">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 1000))}
        placeholder={`Respond as ${businessClaim.businessName}…`}
        className="w-full min-h-[80px] p-3 text-sm bg-card border border-border rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-border placeholder:text-muted-foreground"
        maxLength={1000}
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground">{text.length}/1000</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setExpanded(false); setText(''); }}
            className="text-sm text-muted-foreground active:opacity-70 min-h-[40px] px-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!text.trim() || isSubmitting}
            className="bg-[#334E3D] text-white min-h-[40px] rounded-full px-4 text-sm font-medium active:scale-[0.97] transition-transform disabled:opacity-50"
          >
            {isSubmitting ? 'Posting…' : 'Post response'}
          </button>
        </div>
      </div>
    </div>
  );
};
