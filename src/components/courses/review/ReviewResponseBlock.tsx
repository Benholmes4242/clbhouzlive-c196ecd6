import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ReviewResponse } from '@/hooks/useReviewResponses';
import {
  useUpdateReviewResponse,
  useDeleteReviewResponse,
} from '@/hooks/useReviewResponses';
import type { BusinessClaimContext } from '@/hooks/useBusinessClaimForCourse';

const formatRelativeDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}mo ago`;
  return `${Math.floor(diffInDays / 365)}y ago`;
};

// ============================================================
// ResponseDisplay
// ============================================================

interface ResponseDisplayProps {
  response: ReviewResponse;
  courseId: string;
  /**
   * Viewer's claim context for this course. If it matches the response's
   * business_id, edit/delete affordances are surfaced.
   */
  viewerClaim?: BusinessClaimContext | null;
}

export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({
  response,
  courseId,
  viewerClaim,
}) => {
  const { t } = useTranslation('courses');
  const canManage =
    !!viewerClaim &&
    viewerClaim.businessId === response.business_id &&
    (viewerClaim.role === 'owner' || viewerClaim.role === 'admin');

  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(response.response_text);

  const updateMutation = useUpdateReviewResponse(courseId);
  const deleteMutation = useDeleteReviewResponse(courseId);

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed || trimmed === response.response_text) {
      setIsEditing(false);
      setText(response.response_text);
      return;
    }
    updateMutation.mutate(
      { responseId: response.id, responseText: trimmed },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  const handleDelete = () => {
    if (!window.confirm(t('review.response.deleteConfirm'))) return;
    deleteMutation.mutate({ responseId: response.id });
  };

  return (
    <div className="ml-4 mt-3 pl-4 border-l-2 border-amber-300">
      <div className="flex items-center gap-2 mb-1.5">
        {response.business_logo_url ? (
          <SquircleAvatar
            src={response.business_logo_url}
            alt={response.business_name}
            size={28}
            fallback={response.business_name.slice(0, 2).toUpperCase()}
            hairlineRing
            ringColor={LIGHT_HAIRLINE}
          />
        ) : (
          <SquircleAvatar
            size={28}
            fallback={response.business_name.slice(0, 2).toUpperCase()}
            hairlineRing
            ringColor={LIGHT_HAIRLINE}
          />
        )}

        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="text-sm font-semibold text-foreground truncate">
            {response.business_name}
          </span>
          {response.business_is_verified && <VerifiedBadge size="sm" />}
          <span className="text-xs text-muted-foreground">{t('review.response.ownerBadge')}</span>
        </div>
      </div>

      {!isEditing ? (
        <>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {response.response_text}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="text-xs text-muted-foreground">
              {formatRelativeDate(response.created_at)}
              {response.edited_at ? ' (edited)' : ''}
            </p>
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={() => { setText(response.response_text); setIsEditing(true); }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 active:opacity-70 px-1"
                  aria-label={t('review.response.editA11y')}
                >
                  <Pencil className="w-3 h-3" /> {t('review.response.edit')}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 active:opacity-70 disabled:opacity-50 px-1"
                  aria-label={t('review.response.deleteA11y')}
                >
                  <Trash2 className="w-3 h-3" /> {t('review.response.delete')}
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 1000))}
            className="w-full min-h-[80px] p-3 text-sm bg-card border border-border rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-border placeholder:text-muted-foreground"
            maxLength={1000}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">{text.length}/1000</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setIsEditing(false); setText(response.response_text); }}
                className="text-sm text-muted-foreground active:opacity-70 min-h-[40px] px-2"
              >
                {t('review.response.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!text.trim() || updateMutation.isPending}
                className="bg-[#f59e0b] text-white min-h-[40px] rounded-full px-4 text-sm font-medium active:scale-[0.97] transition-transform disabled:opacity-50"
              >
                {updateMutation.isPending ? t('review.response.saving') : t('review.response.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// ReplyForm
// ============================================================

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
  const { t } = useTranslation('courses');
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');

  if (!expanded) {
    return (
      <div className="ml-4 mt-2">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-sm text-[#d97706] font-medium active:opacity-70 transition-opacity min-h-[44px] px-1"
        >
          {t('review.response.reply')}
        </button>
      </div>
    );
  }

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(reviewId, businessClaim.businessId, trimmed);
    setText('');
    setExpanded(false);
  };

  return (
    <div className="ml-4 mt-3 pl-4 border-l-2 border-border">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 1000))}
        placeholder={t('review.response.replyPlaceholder', { business: businessClaim.businessName })}
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
            {t('review.response.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!text.trim() || isSubmitting}
            className="bg-[#f59e0b] text-white min-h-[40px] rounded-full px-4 text-sm font-medium active:scale-[0.97] transition-transform disabled:opacity-50"
          >
            {isSubmitting ? t('review.response.posting') : t('review.response.post')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// VerifyToRespondPrompt
// ============================================================

interface VerifyToRespondPromptProps {
  businessClaim: BusinessClaimContext;
}

export const VerifyToRespondPrompt: React.FC<VerifyToRespondPromptProps> = ({
  businessClaim,
}) => {
  const href = businessClaim.businessSlug
    ? `/business/${businessClaim.businessSlug}/verification`
    : `/business/${businessClaim.businessId}/verification`;

  return (
    <div className="ml-4 mt-2 pl-4 border-l-2 border-border">
      <p className="text-xs text-muted-foreground">
        <Trans
          i18nKey="review.response.verifyPrompt"
          ns="courses"
          values={{ business: businessClaim.businessName }}
          components={{
            1: <Link to={href} className="font-medium text-[#d97706] active:opacity-70" />,
          }}
        />
      </p>
    </div>
  );
};
