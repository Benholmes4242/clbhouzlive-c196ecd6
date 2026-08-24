import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [deleteOpen, setDeleteOpen] = useState(false);
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
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    setDeleteOpen(false);
    deleteMutation.mutate({ responseId: response.id });
  };

  const INK = 'rgba(255,255,255,0.96)';
  const INK_75 = 'rgba(255,255,255,0.75)';
  const INK_40 = 'rgba(255,255,255,0.62)';
  const HAIRLINE = 'rgba(255,255,255,0.10)';

  return (
    <div
      style={{
        marginTop: 12,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        padding: '12px 13px',
      }}
    >
      {/* Header row: avatar + two-line stack (name/verified, then chip) */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
        {response.business_logo_url ? (
          <SquircleAvatar
            src={response.business_logo_url}
            alt={response.business_name}
            size={26}
            fallback={response.business_name.slice(0, 2).toUpperCase()}
            hairlineRing
            ringColor={DARK_HAIRLINE}
          />
        ) : (
          <SquircleAvatar
            size={26}
            fallback={response.business_name.slice(0, 2).toUpperCase()}
            hairlineRing
            ringColor={DARK_HAIRLINE}
          />
        )}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: INK,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {response.business_name}
            </span>
            {response.business_is_verified && <VerifiedBadge size="sm" />}
          </div>
          <span
            style={{
              marginTop: 3,
              alignSelf: 'flex-start',
              fontSize: 8.5,
              fontWeight: 700,
              letterSpacing: '0.07em',
              color: '#FBBF24',
              background: 'rgba(232,181,48,0.16)',
              border: '1px solid rgba(232,181,48,0.35)',
              borderRadius: 999,
              padding: '3px 8px',
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
            }}
          >
            OWNER RESPONSE
          </span>
        </div>
      </div>


      {!isEditing ? (
        <>
          <p
            style={{
              margin: 0,
              marginTop: 9,
              fontSize: 12.5,
              fontWeight: 400,
              color: INK_75,
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
            }}
          >
            {response.response_text}
          </p>
          <div
            style={{
              marginTop: 10,
              paddingTop: 9,
              borderTop: `1px solid ${HAIRLINE}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 500, color: INK_40 }}>
              {formatRelativeDate(response.created_at)}
              {response.edited_at ? ' (edited)' : ''}
            </span>
            {canManage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button
                  type="button"
                  onClick={() => { setText(response.response_text); setIsEditing(true); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: INK,
                  }}
                  aria-label={t('review.response.editA11y')}
                >
                  {t('review.response.edit')}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: 'rgba(255,107,107,0.85)',
                    opacity: deleteMutation.isPending ? 0.5 : 1,
                  }}
                  aria-label={t('review.response.deleteA11y')}
                >
                  {t('review.response.delete')}
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ marginTop: 9 }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 1000))}
            className="w-full min-h-[80px] p-3 text-sm bg-card border border-border/10 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-border placeholder:text-muted-foreground"
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

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('review.response.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('review.response.deleteDescription', { defaultValue: "This can't be undone." })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t('review.response.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('review.response.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    const shortName = businessClaim.businessName;
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(true);
          }
        }}
        style={{
          marginTop: 12,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          minHeight: 44,
          background: 'rgba(255,255,255,0.04)',
          border: '0.5px solid rgba(255,255,255,0.10)',
          borderRadius: 14,
          padding: '9px 10px',
          boxShadow: 'none',
          cursor: 'pointer',
        }}
      >
        {/* Avatar + two-line stack (placeholder, then pill) — mirrors ResponseDisplay */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', minWidth: 0 }}>
          <SquircleAvatar
            size={28}
            src={businessClaim.businessLogoUrl ?? undefined}
            alt={shortName}
            fallback={shortName.slice(0, 2).toUpperCase()}
            hairlineRing
            ringColor={DARK_HAIRLINE}
          />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.62)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {`Respond publicly as ${shortName}\u2026`}
            </span>
            <span
              style={{
                marginTop: 3,
                alignSelf: 'flex-start',
                display: 'inline-block',
                fontSize: 8.5,
                fontWeight: 700,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                color: '#FBBF24',
                background: 'rgba(232,181,48,0.16)',
                border: '1px solid rgba(232,181,48,0.35)',
                borderRadius: 999,
                padding: '3px 8px',
                whiteSpace: 'nowrap',
              }}
            >
              Respond
            </span>
          </div>
        </div>
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
    <div className="ml-4 mt-3 pl-4 border-l-2 border-border/10">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 1000))}
        placeholder={t('review.response.replyPlaceholder', { business: businessClaim.businessName })}
        className="w-full min-h-[80px] p-3 text-sm bg-card border border-border/10 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-border placeholder:text-muted-foreground"
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
    <div className="ml-4 mt-2 pl-4 border-l-2 border-border/10">
      <p className="text-xs text-muted-foreground">
        <Trans
          i18nKey="review.response.verifyPrompt"
          ns="courses"
          values={{ business: businessClaim.businessName }}
          components={{
            1: <Link to={href} className="font-medium text-[#F7931E] active:opacity-70" />,
          }}
        />
      </p>
    </div>
  );
};
