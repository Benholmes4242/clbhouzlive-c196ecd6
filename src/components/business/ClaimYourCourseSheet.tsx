/**
 * BRIEF_CLAIM_YOUR_COURSE_FROM_MANAGE §2 — business-first claim: given an
 * existing business, pick a club. Precedent for a real bottom sheet in this
 * folder is ClaimCourseSheet (course detail). Results render IN FLOW (not
 * ClubSearchDropdown's unportalled absolute panel) so nothing clips inside
 * the scrollBody band, and each row carries its own availability verdict.
 *
 * Never writes business_accounts.club_id/club_key: ownership is granted only
 * by approve_course_claim. This sheet only files the request.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Check, Lock, Clock } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useClubSearch, type GolfClub } from '@/hooks/useClubSearch';
import { FIELD_PAINT_CLASS, FIELD_PLACEHOLDER_CLASS } from '@/lib/tokens/field';
import { toast } from '@/lib/toast';
import { BIZ } from './businessTokens';

type Availability = 'available' | 'managed' | 'review';

interface Props {
  open: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
  /** Profile id the page keys ['my-businesses', id] on. */
  userProfileId?: string;
}

export function ClaimYourCourseSheet({ open, onClose, businessId, businessName, userProfileId }: Props) {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<GolfClub | null>(null);
  const [proofNote, setProofNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState<Record<string, Availability>>({});

  const { data, loading } = useClubSearch(query, { debounceMs: 250, limit: 10 });
  const trimmed = query.trim();

  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelected(null);
      setProofNote('');
      setAvailability({});
    }
  }, [open]);

  // Two batched queries per result page — the same two checks the server RPC enforces.
  useEffect(() => {
    const ids = data.map((c) => c.id);
    if (!ids.length) {
      setAvailability({});
      return;
    }
    let cancelled = false;
    (async () => {
      const [managed, review] = await Promise.all([
        supabase.from('business_accounts').select('club_id, name').in('club_id', ids).eq('is_deleted', false),
        supabase
          .from('course_claim_requests')
          .select('club_id')
          .in('club_id', ids)
          .in('status', ['pending', 'needs_more_info']),
      ]);
      if (cancelled) return;
      const next: Record<string, Availability> = {};
      ids.forEach((id) => (next[id] = 'available'));
      (review.data ?? []).forEach((r: { club_id: string | null }) => {
        if (r.club_id) next[r.club_id] = 'review';
      });
      (managed.data ?? []).forEach((r: { club_id: string | null }) => {
        if (r.club_id) next[r.club_id] = 'managed';
      });
      setAvailability(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [data]);

  const submit = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    const { error } = await supabase.functions.invoke('request-course-claim', {
      body: {
        business_id: businessId,
        club_id: selected.id,
        club_key: selected.club_key || null,
        source_course_id: null,
        proof_note: proofNote.trim() || null,
      },
    });
    setSubmitting(false);
    if (error) {
      let raw = '';
      if (error instanceof FunctionsHttpError) {
        try {
          const body = await error.context.json();
          raw = body?.error ?? body?.message ?? '';
        } catch {
          /* keep fallback */
        }
      } else if (error.message) {
        raw = error.message;
      }
      const m = String(raw).toLowerCase();
      if (m.includes('already claimed')) toast.error(t('business.claimSheet.errors.alreadyClaimed'));
      else if (m.includes('already under review')) toast.error(t('business.claimSheet.errors.underReview'));
      else if (m.includes('not authorized')) toast.error(t('business.claimSheet.errors.notAuthorized'));
      else toast.error(t('business.claimSheet.errors.generic'));
      return;
    }
    toast.success(t('business.claimSheet.success'));
    queryClient.invalidateQueries({ queryKey: ['business-course-claim', businessId] });
    queryClient.invalidateQueries({ queryKey: ['my-businesses', userProfileId] });
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} scrollBody ariaLabelledBy="claim-your-course-title">
      <div style={{ padding: '20px 20px 28px' }}>
        <h2 id="claim-your-course-title" style={{ color: BIZ.ink, fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
          {t('business.claimSheet.title')}
        </h2>
        <p style={{ color: BIZ.inkMute, fontSize: 13, lineHeight: 1.45, marginBottom: 16 }}>
          {t('business.claimSheet.intro', { name: businessName })}
        </p>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('business.claimSheet.searchPlaceholder')}
          aria-label={t('business.claimSheet.searchPlaceholder')}
          className={`${FIELD_PAINT_CLASS} ${FIELD_PLACEHOLDER_CLASS} w-full px-4 py-3 text-[15px] focus:outline-none`}
          style={{ color: BIZ.ink }}
        />

        <div style={{ marginTop: 8, marginBottom: 16 }}>
          {trimmed.length >= 2 && loading && (
            <p style={{ color: BIZ.inkFaint, fontSize: 13, padding: '12px 0' }}>{t('business.claimSheet.searching')}</p>
          )}
          {trimmed.length >= 2 && !loading && data.length === 0 && (
            <p style={{ color: BIZ.inkFaint, fontSize: 13, padding: '12px 0' }}>{t('business.claimSheet.noResults')}</p>
          )}
          {trimmed.length >= 2 &&
            !loading &&
            data.map((club) => {
              const state = availability[club.id];
              const tappable = state === 'available';
              const isSelected = selected?.id === club.id;
              const place = [club.sub_country || club.region, club.country].filter(Boolean).join(', ');
              return (
                <button
                  key={club.id}
                  type="button"
                  disabled={!tappable}
                  aria-pressed={isSelected}
                  onClick={() => setSelected(club)}
                  className="w-full flex items-center gap-3 text-left"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `0.5px solid ${BIZ.hair}`,
                    padding: '12px 0',
                    minHeight: 48,
                    opacity: tappable || state === undefined ? 1 : 0.55,
                    cursor: tappable ? 'pointer' : 'default',
                  }}
                >
                  <span className="flex-1 min-w-0">
                    <span className="block truncate" style={{ color: BIZ.ink, fontSize: 14, fontWeight: 600 }}>
                      {club.name}
                    </span>
                    {state === 'managed' ? (
                      <span className="block" style={{ color: BIZ.inkFaint, fontSize: 12 }}>
                        {t('business.claimSheet.managed')}
                      </span>
                    ) : state === 'review' ? (
                      <span className="block" style={{ color: BIZ.inkFaint, fontSize: 12 }}>
                        {t('business.claimSheet.underReview')}
                      </span>
                    ) : place ? (
                      <span className="block truncate" style={{ color: BIZ.inkFaint, fontSize: 12 }}>
                        {place}
                      </span>
                    ) : null}
                  </span>
                  {state === 'managed' && <Lock style={{ width: 15, height: 15, color: BIZ.inkFaint }} />}
                  {state === 'review' && <Clock style={{ width: 15, height: 15, color: BIZ.inkFaint }} />}
                  {isSelected && <Check style={{ width: 16, height: 16, color: BIZ.ink }} />}
                </button>
              );
            })}
        </div>

        <label
          htmlFor="claim-your-course-note"
          style={{ display: 'block', fontSize: 13, fontWeight: 600, color: BIZ.ink, marginBottom: 6 }}
        >
          {t('business.claimSheet.noteLabel')}{' '}
          <span style={{ color: BIZ.inkFaint, fontWeight: 400 }}>{t('business.claimSheet.optional')}</span>
        </label>
        <textarea
          id="claim-your-course-note"
          value={proofNote}
          onChange={(e) => setProofNote(e.target.value.slice(0, 500))}
          placeholder={t('business.claimSheet.notePlaceholder')}
          rows={3}
          maxLength={500}
          className={`${FIELD_PAINT_CLASS} ${FIELD_PLACEHOLDER_CLASS} w-full px-3 py-2.5 text-[14px] focus:outline-none`}
          style={{ color: BIZ.ink, fontFamily: 'inherit', resize: 'vertical' }}
        />
        <p style={{ marginTop: 6, fontSize: 11, color: BIZ.inkFaint, lineHeight: 1.4 }}>
          {t('business.claimSheet.noteHint')}
        </p>

        <Button className="w-full mt-5" disabled={!selected || submitting} onClick={submit}>
          {t('business.claimSheet.submit', { name: businessName })}
        </Button>
        <p className="text-center" style={{ marginTop: 12, fontSize: 12, color: BIZ.inkFaint }}>
          {t('business.claimSheet.footer')}
        </p>
      </div>
    </BottomSheet>
  );
}

export default ClaimYourCourseSheet;
