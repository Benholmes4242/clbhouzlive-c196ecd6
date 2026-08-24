import { useMemo, useState } from 'react';
import { TITLE, FIGURE } from '@/lib/tokens/type';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Star, X, Edit3, Trash2, MapPin, Sparkles } from 'lucide-react';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { formatRelativeMonths as relativeTime } from '@/i18n/format';
import { toast } from '@/lib/toast';
import {
  useBusinessReviews,
  usePostReviewReply,
  useUpdateReviewReply,
  useDeleteReviewReply,
  type BusinessReview,
  type BusinessReviewFilter,
  type BusinessReviewSort,
} from '@/hooks/useBusinessReviews';

/* NO PRIVATE PALETTE. This page declared its own INK/HAIR/CARD_BG/GREEN/RED
   and imported nothing, which is why two import-tracing sweeps could not see
   it. Colours come from the shared manage vocabulary (itself derived from the
   analytical `A` ramp) and from BIZ for the amber wash. Add a colour here and
   the next audit is blind again. */
import { INK, INK_45, HAIR, CARD_BG, PAGE_BG, GREEN, DANGER as RED } from '@/components/manage/ui';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { BIZ } from '@/components/business/businessTokens';

const AMBER = A.AMBER;
const AMBER_SOFT = BIZ.amberTint;

type ChipKey = 'all' | 'unreplied' | 'recent' | 'lowest';

const CHIPS: Array<{ key: ChipKey; label: string; filter: BusinessReviewFilter; sort: BusinessReviewSort }> = [
  { key: 'all', label: 'All', filter: 'all', sort: 'recent' },
  { key: 'unreplied', label: 'Awaiting reply', filter: 'unreplied', sort: 'recent' },
  { key: 'recent', label: 'Most recent', filter: 'all', sort: 'recent' },
  { key: 'lowest', label: 'Lowest rated', filter: 'all', sort: 'lowest' },
];

function ratingTone(rating: number): { bg: string; fg: string } {
  if (rating >= 8) return { bg: 'rgba(52,215,127,0.16)', fg: GREEN };
  if (rating >= 6) return { bg: AMBER_SOFT, fg: AMBER };
  return { bg: 'rgba(255,90,90,0.16)', fg: RED };
}

function fmtRating(v: number | null): string {
  if (v == null || Number.isNaN(v)) return '-';
  return (Math.round(v * 10) / 10).toFixed(1);
}

/* ─────────────── Reply sheet ─────────────── */

function ReplySheet({
  open,
  onClose,
  review,
  businessId,
  mode,
  existingId,
  existingText,
}: {
  open: boolean;
  onClose: () => void;
  review: BusinessReview | null;
  businessId: string;
  mode: 'create' | 'edit';
  existingId?: string;
  existingText?: string;
}) {
  const [text, setText] = useState(existingText || '');
  const post = usePostReviewReply(businessId);
  const update = useUpdateReviewReply(businessId);

  // Reset when review changes
  useMemo(() => {
    setText(mode === 'edit' ? (existingText || '') : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [review?.id, mode, existingText]);

  if (!review) return null;
  const busy = post.isPending || update.isPending;
  const count = text.length;
  const disabled = busy || count === 0 || count > 1000;

  const handleSubmit = async () => {
    try {
      if (mode === 'edit' && existingId) {
        await update.mutateAsync({ responseId: existingId, responseText: text });
        toast.success('Reply updated');
      } else {
        await post.mutateAsync({ reviewId: review.id, responseText: text });
        toast.success('Reply posted');
      }
      onClose();
    } catch {
      /* handled in hook */
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent
        side="bottom"
        className="p-0 border-0 rounded-t-2xl max-h-[85dvh] overflow-hidden"
        style={{ background: PAGE_BG }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ borderBottom: `1px solid ${HAIR}` }}>
          <div>
            <div className="text-[16px] font-semibold" style={{ color: INK }}>
              {mode === 'edit' ? 'Edit reply' : 'Reply to review'}
            </div>
            <div className="text-[12px]" style={{ color: INK_45 }}>
              Posted publicly as the business
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: CARD_BG, border: `1px solid ${HAIR}` }}
            aria-label="Close"
          >
            <X size={16} style={{ color: INK }} />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4 overflow-y-auto" style={{ maxHeight: '65vh' }}>
          {/* Original review preview */}
          <div style={{ background: CARD_BG, border: `1px solid ${HAIR}`, borderRadius: 12, padding: 12 }}>
            <div className="flex items-center gap-2 mb-1.5">
              <SquircleAvatar
                src={review.reviewer.profile_photo_url || undefined}
                alt={review.reviewer.display_name || 'Reviewer'}
                size={28}
                hairlineRing
                ringColor={DARK_HAIRLINE}
              />
              <div className="text-[13px] font-semibold" style={{ color: INK }}>
                {review.reviewer.display_name || review.reviewer.username || 'Golfer'}
              </div>
              <RatingChip rating={review.rating} />
            </div>
            {review.review && (
              <p className="text-[13px] leading-relaxed" style={{ color: A.BODY }}>
                {review.review}
              </p>
            )}
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 1000))}
            placeholder="Thank the golfer, address specifics, invite them back..."
            rows={6}
            className="w-full resize-none outline-none"
            style={{
              background: CARD_BG,
              border: `1px solid ${HAIR}`,
              borderRadius: 12,
              padding: '12px 14px',
              fontSize: 15,
              color: INK,
              fontFamily: 'inherit',
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-[12px]" style={{ color: INK_45 }}>
              Posted publicly as the business
            </span>
            <span className="text-[12px] tabular-nums" style={{ color: count > 900 ? RED : INK_45 }}>
              {count}/1000
            </span>
          </div>
        </div>

        <div className="px-4 pt-3 pb-0" style={{ borderTop: `1px solid ${HAIR}`, paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
          <button
            onClick={handleSubmit}
            disabled={disabled}
            className="w-full flex items-center justify-center gap-2 active:opacity-90"
            style={{
              minHeight: 50,
              borderRadius: 14,
              background: disabled ? 'rgba(255,255,255,0.08)' : INK,
              color: disabled ? 'rgba(248,250,252,0.38)' : A.CANVAS,
              fontSize: 15,
              fontWeight: 700,
              border: 'none',
            }}
          >
            {busy ? 'Posting...' : mode === 'edit' ? 'Save changes' : 'Post reply'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─────────────── Small parts ─────────────── */

function RatingChip({ rating }: { rating: number }) {
  const t = ratingTone(rating);
  return (
    <span
      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11.5px] font-bold tabular-nums"
      style={{ background: t.bg, color: t.fg }}
    >
      <Star size={10} strokeWidth={2.5} style={{ fill: t.fg, color: t.fg }} />
      {fmtRating(rating)}
    </span>
  );
}

function CourseTag({ name }: { name: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold truncate max-w-[180px]"
      style={{ background: 'rgba(255,255,255,0.06)', color: INK_45, border: `1px solid ${HAIR}` }}
    >
      <MapPin size={10} strokeWidth={2.5} />
      <span className="truncate">{name}</span>
    </span>
  );
}

function Distribution({ dist }: { dist: Array<{ bucket: number; count: number }> }) {
  const max = Math.max(...dist.map((d) => d.count), 1);
  const labels: Record<number, string> = { 5: '9-10', 4: '7-8', 3: '5-6', 2: '3-4', 1: '0-2' };
  return (
    <div className="space-y-1.5">
      {[5, 4, 3, 2, 1].map((b) => {
        const item = dist.find((d) => d.bucket === b) || { bucket: b, count: 0 };
        const pct = (item.count / max) * 100;
        return (
          <div key={b} className="flex items-center gap-2">
            <div className="w-8 text-[11px] tabular-nums font-semibold" style={{ color: INK_45 }}>
              {labels[b]}
            </div>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: b >= 4 ? GREEN : b === 3 ? AMBER : RED,
                  transition: 'width 300ms ease',
                }}
              />
            </div>
            <div className="w-8 text-right text-[11px] tabular-nums" style={{ color: INK_45 }}>
              {item.count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatCell({ label, value, tone = 'ink' }: { label: string; value: string; tone?: 'ink' | 'amber' }) {
  return (
    <div className="flex-1 text-center py-2">
      <div
        className="tabular-nums"
        style={{
          color: tone === 'amber' ? AMBER : INK,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </div>
      <div className="text-[11px] font-semibold" style={{ color: INK_45 }}>
        {label}
      </div>
    </div>
  );
}

/* ─────────────── Review card ─────────────── */

function ReviewCard({
  r,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
}: {
  r: BusinessReview;
  currentUserId: string | undefined;
  onReply: (r: BusinessReview) => void;
  onEdit: (r: BusinessReview) => void;
  onDelete: (r: BusinessReview) => void;
}) {
  const name = r.reviewer.display_name || r.reviewer.username || 'Golfer';
  const hasReply = !!r.response;
  const isOwnReply = hasReply && r.response?.responded_by === currentUserId;

  return (
    <div style={{ background: CARD_BG, border: `1px solid ${HAIR}`, borderRadius: 14, padding: 14 }}>
      <div className="flex items-start gap-3">
        <SquircleAvatar
          src={r.reviewer.profile_photo_url || undefined}
          alt={name}
          size={40}
          hairlineRing
          ringColor={DARK_HAIRLINE}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[14.5px] truncate" style={{ color: INK }}>
              {name}
            </span>
            {r.reviewer.handicap != null && (
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-bold tabular-nums"
                style={{ background: 'rgba(255,255,255,0.06)', color: INK_45 }}
              >
                Hcp {r.reviewer.handicap.toFixed(1)}
              </span>
            )}
            <RatingChip rating={r.rating} />
          </div>
          <div className="mt-0.5 flex items-center gap-2 flex-wrap">
            <CourseTag name={r.course_name} />
            <span className="text-[11.5px]" style={{ color: INK_45 }}>
              {relativeTime(r.review_date)}
            </span>
          </div>
        </div>
      </div>

      {r.title && (
        <div className="mt-3 text-[14px] font-semibold" style={{ color: INK }}>
          {r.title}
        </div>
      )}
      {r.review && (
        <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: A.BODY }}>
          {r.review}
        </p>
      )}

      {/* sub scores */}
      {(r.design_score != null || r.condition_score != null || r.facilities_score != null) && (
        <div className="mt-3 flex gap-3 text-[11.5px]" style={{ color: INK_45 }}>
          {r.design_score != null && <span>Design <b className="tabular-nums" style={{ color: INK }}>{fmtRating(r.design_score)}</b></span>}
          {r.condition_score != null && <span>Condition <b className="tabular-nums" style={{ color: INK }}>{fmtRating(r.condition_score)}</b></span>}
          {r.facilities_score != null && <span>Facilities <b className="tabular-nums" style={{ color: INK }}>{fmtRating(r.facilities_score)}</b></span>}
        </div>
      )}

      {/* Reply block */}
      {hasReply ? (
        <div
          className="mt-3 p-3"
          style={{
            background: BIZ.amberTint,
            border: `1px solid ${BIZ.amberHair}`,
            borderRadius: 12,
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="text-[11.5px] font-bold uppercase tracking-[0.06em]" style={{ color: A.MUTE }}>
              Your reply
            </div>
            <div className="text-[11px]" style={{ color: INK_45 }}>
              {r.response!.updated_at ? `edited ${relativeTime(r.response!.updated_at)}` : relativeTime(r.response!.created_at)}
            </div>
          </div>
          <p className="text-[13.5px] leading-relaxed" style={{ color: INK }}>
            {r.response!.response_text}
          </p>
          {isOwnReply && (
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => onEdit(r)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-semibold active:opacity-70"
                style={{ background: CARD_BG, border: `1px solid ${HAIR}`, color: INK }}
              >
                <Edit3 size={11} strokeWidth={2.5} /> Edit
              </button>
              <button
                onClick={() => onDelete(r)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-semibold active:opacity-70"
                style={{ background: 'rgba(255,90,90,0.14)', border: '1px solid rgba(255,90,90,0.28)', color: RED }}
              >
                <Trash2 size={11} strokeWidth={2.5} /> Delete
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onReply(r)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-bold active:opacity-90"
            style={{ background: INK, color: A.CANVAS, border: 'none' }}
          >
            <MessageSquare size={12} strokeWidth={2.5} /> Reply
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────── Page ─────────────── */

export default function BusinessReviewsPage() {
  const { id: businessId } = useParams<{ id: string }>();
  useHideBottomNav();

  const { session } = useSupabaseSession();
  const currentUserId = session?.user?.id;

  const { data: membership } = useBusinessMembership(businessId);
  const canManage = !!membership?.canManage;
  const { data: businessProfile, isLoading: profileLoading } = useBusinessProfile(businessId);

  const [chip, setChip] = useState<ChipKey>('all');
  const active = CHIPS.find((c) => c.key === chip)!;

  const { data, isLoading, isError, refetch } = useBusinessReviews(businessId, {
    filter: active.filter,
    sort: active.sort,
  });

  const summary = data?.summary;
  const reviews = data?.reviews || [];

  const [replyTarget, setReplyTarget] = useState<{ review: BusinessReview; mode: 'create' | 'edit' } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BusinessReview | null>(null);
  const del = useDeleteReviewReply(businessId);

  if (!businessId) return null;

  // Guard: Reviews are only available for course-linked businesses.
  // Brands / coaches / retailers without a claimed club have no course_ratings to show.
  // eslint-disable-next-line settled/no-not-loading-empty-check -- the branch requires businessProfile to be present.
  if (!profileLoading && businessProfile && !businessProfile.club_id) {
    return (
      <ManagePageShell title="Reviews">
        <main className="px-4 pt-16 pb-22 max-w-lg mx-auto text-center">
          <div
            className="mx-auto mb-4 flex items-center justify-center"
            style={{ width: 56, height: 56, borderRadius: 16, background: AMBER_SOFT }}
          >
            <Star size={24} strokeWidth={2} style={{ color: AMBER }} />
          </div>
          <h2 style={{ ...TITLE, color: INK }}>
            Reviews are for golf course profiles
          </h2>
          <p className="mt-2" style={{ color: INK_45, fontSize: 14, lineHeight: 1.45 }}>
            Only businesses linked to a claimed golf course can receive and reply to reviews.
          </p>
        </main>
      </ManagePageShell>
    );
  }

  const showEmpty = !isLoading && !isError && (summary?.count ?? 0) === 0;

  return (
    <ManagePageShell title="Reviews">
      <main className="px-4 pt-4 pb-22 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {/* SUMMARY */}
          <section
            className="mb-4 p-4"
            style={{ background: CARD_BG, border: `1px solid ${HAIR}`, borderRadius: 16 }}
          >
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <div>
                    <div
                      style={{ ...FIGURE, color: INK, fontSize: 40, letterSpacing: '-0.02em', lineHeight: 1 }}
                    >
                      {fmtRating(summary?.avg ?? null)}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[11px]" style={{ color: INK_45 }}>
                      <Star size={11} strokeWidth={2.5} style={{ color: AMBER, fill: AMBER }} />
                      out of 10 - {summary?.count ?? 0} review{(summary?.count ?? 0) === 1 ? '' : 's'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <Distribution dist={summary?.distribution || []} />
                  </div>
                </div>

                {/* stat strip */}
                <div
                  className="mt-4 flex items-center"
                  style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12 }}
                >
                  <StatCell
                    label="Awaiting"
                    value={String(summary?.awaiting_reply ?? 0)}
                    tone={(summary?.awaiting_reply ?? 0) > 0 ? 'amber' : 'ink'}
                  />
                  <div style={{ width: 1, height: 24, background: HAIR }} />
                  <StatCell label="Reply rate" value={`${Math.round(summary?.reply_rate ?? 0)}%`} />
                  <div style={{ width: 1, height: 24, background: HAIR }} />
                  <StatCell label="This month" value={String(summary?.this_period ?? 0)} />
                </div>
              </>
            )}
          </section>

          {/* CHIPS */}
          <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
            {CHIPS.map((c) => {
              const isActive = chip === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setChip(c.key)}
                  className="shrink-0 px-3 py-1.5 rounded-full text-[12.5px] font-semibold active:opacity-80"
                  style={{
                    background: isActive ? INK : CARD_BG,
                    color: isActive ? A.CANVAS : INK,
                    border: `1px solid ${isActive ? INK : HAIR}`,
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* LIST */}
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ background: CARD_BG, border: `1px solid ${HAIR}`, borderRadius: 14, padding: 14 }}>
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                  <Skeleton className="h-12 w-full mt-3" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div
              className="text-center py-10 px-6"
              style={{ background: CARD_BG, border: `1px solid ${HAIR}`, borderRadius: 16 }}
            >
              <div className="text-[15px] font-bold" style={{ color: INK }}>
                Couldn't load your reviews
              </div>
              <p className="text-[13px] leading-relaxed mt-1.5" style={{ color: INK_45 }}>
                Check your connection and try again.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12.5px] font-bold text-white active:opacity-90"
                style={{ background: AMBER, border: 'none' }}
              >
                Retry
              </button>
            </div>
          ) : showEmpty ? (
            <div
              className="text-center py-10 px-6"
              style={{ background: CARD_BG, border: `1px solid ${HAIR}`, borderRadius: 16 }}
            >
              <div
                className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3"
                style={{ background: AMBER_SOFT }}
              >
                <Sparkles size={22} style={{ color: AMBER }} />
              </div>
              <div className="text-[16px] font-bold" style={{ color: INK }}>
                No reviews yet
              </div>
              <p className="text-[13px] leading-relaxed mt-1.5" style={{ color: INK_45 }}>
                Once golfers rate your courses on clbhouz, their reviews will land here. Reply publicly to build trust and win return visits.
              </p>
            </div>
          ) : reviews.length === 0 ? (
            <div
              className="text-center py-8 px-6 text-[13px]"
              style={{ background: CARD_BG, border: `1px solid ${HAIR}`, borderRadius: 14, color: INK_45 }}
            >
              No reviews match this filter.
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <ReviewCard
                  key={r.id}
                  r={r}
                  currentUserId={currentUserId}
                  onReply={(rv) => setReplyTarget({ review: rv, mode: 'create' })}
                  onEdit={(rv) => setReplyTarget({ review: rv, mode: 'edit' })}
                  onDelete={(rv) => setDeleteTarget(rv)}
                />
              ))}
            </div>
          )}

          {/* eslint-disable-next-line settled/no-not-loading-empty-check -- canManage is a permission boolean, not query data. */}
          {!canManage && !isLoading && (
            <p className="mt-4 text-[11.5px] text-center" style={{ color: INK_45 }}>
              Only team members can reply to reviews.
            </p>
          )}
        </motion.div>
      </main>

      {replyTarget && (
        <ReplySheet
          open={!!replyTarget}
          onClose={() => setReplyTarget(null)}
          review={replyTarget.review}
          businessId={businessId}
          mode={replyTarget.mode}
          existingId={replyTarget.mode === 'edit' ? replyTarget.review.response?.id : undefined}
          existingText={replyTarget.mode === 'edit' ? replyTarget.review.response?.response_text : undefined}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget?.response) return;
          try {
            await del.mutateAsync({ responseId: deleteTarget.response.id });
            toast.success('Reply deleted');
          } catch { /* toast fired inside mutation */ }
          setDeleteTarget(null);
        }}
        title="Delete reply"
        message="Delete this reply? Golfers will no longer see it."
        confirmText="Delete"
        confirmVariant="destructive"
      />
    </ManagePageShell>
  );
}
