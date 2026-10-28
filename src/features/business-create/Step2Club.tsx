/**
 * BC2 step 2, Golf Club branch (panels 2A–2D of biz-c2-find.html).
 * Search uses the existing useClubSearch (250ms debounce, limit 10); the
 * duplicate guard (club_key via normalizeClubKey, deleted rows included) and
 * the pending-claim check mirror the editor's, and the address prefill on pick
 * is the editor's exact shape. Nothing is saved here — everything lands in the
 * draft. A failed courses/stats read shows the card without the facts row,
 * never an error state.
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Flag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useClubSearch, type GolfClub } from '@/hooks/useClubSearch';
import { useNearbyCourseStats } from '@/hooks/useNearbyCourseStats';
import { RequestClubModal } from '@/components/business/RequestClubModal';
import { RequestAccessModal } from '@/components/business/RequestAccessModal';
import { AppLog } from '@/lib/logger';
import { formatNumber } from '@/i18n/format';
import { getCountryCodeFromClub } from '@/utils/countryCodeMapping';
import { CLAIM_PROOF_NOTE_MAX, clubCardFacts, clubPlaceLine, normalizeClubKey, searchResultPlace } from './step2Rules';
import { Field } from './step2Bits';
import type { BusinessCreateDraft } from './createRules';

interface Props {
  draft: BusinessCreateDraft;
  setDraft: (fn: (d: BusinessCreateDraft) => BusinessCreateDraft) => void;
  userId: string;
  onContinue: () => void;
}

interface ClubCourseRow { id: string; name: string; thumbnail_image: string | null }

export function Step2Club({ draft, setDraft, userId, onContinue }: Props) {
  const { t } = useTranslation('profile');
  const club = draft.selectedClub;
  const [query, setQuery] = useState(club?.name ?? '');
  const [searching, setSearching] = useState(!club);
  const [showRequestClub, setShowRequestClub] = useState(false);
  const [showRequestAccess, setShowRequestAccess] = useState(false);
  const [existing, setExisting] = useState<{ id: string; name: string } | null>(null);
  const [claimPending, setClaimPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: results } = useClubSearch(searching ? query : '', { debounceMs: 250, limit: 10 });

  /* Club guard + pending-claim check + address prefill — the editor's logic. */
  const clubId = club?.id;
  useEffect(() => {
    if (!clubId || !club) {
      setExisting(null);
      setClaimPending(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('business_accounts')
          .select('id, name')
          .eq('club_key', normalizeClubKey(club.name))
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        setExisting(data);
        if (!data) {
          const { data: pendingClaim } = await supabase
            .from('course_claim_requests')
            .select('id')
            .eq('club_id', clubId)
            .in('status', ['pending', 'needs_more_info'])
            .limit(1)
            .maybeSingle();
          if (cancelled) return;
          setClaimPending(!!pendingClaim);
        } else {
          setClaimPending(false);
        }
        if (!data) {
          const locationLabel = [club.sub_country, club.region, club.country].filter(Boolean).join(', ');
          setDraft(d => ({
            ...d,
            address: {
              label: locationLabel,
              city: club.sub_country || club.region || '',
              region: club.region || undefined,
              country: club.sub_country || club.country || '',
              countryCode: getCountryCodeFromClub(club) || '',
              lat: club.latitude ?? undefined,
              lng: club.longitude ?? undefined,
              precision: 'city',
            },
          }));
        }
      } catch (e) {
        AppLog.error('[BusinessCreate]', 'club dup check failed', e);
      }
    })();
    return () => { cancelled = true; };
  }, [clubId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* The club's courses as the club profile reads them (created_at order). */
  const coursesQ = useQuery({
    queryKey: ['bizc-club-courses', clubId],
    enabled: !!clubId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ClubCourseRow[]> => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, thumbnail_image')
        .eq('club_id', clubId as string)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ClubCourseRow[];
    },
  });
  const courses = coursesQ.data ?? [];
  const statsQ = useNearbyCourseStats(null, courses, courses.length > 0);
  const factsFailed = coursesQ.isError || statsQ.isError;
  const facts = !factsFailed && coursesQ.data && statsQ.data ? clubCardFacts(courses.length, statsQ.data) : null;
  const bandPhoto = courses[0]?.thumbnail_image ?? null;

  const pick = (r: GolfClub) => {
    setDraft(d => ({
      ...d,
      selectedClub: {
        id: r.id, name: r.name, country: r.country, region: r.region,
        sub_country: r.sub_country, club_key: r.club_key, latitude: r.latitude, longitude: r.longitude,
      },
    }));
    setQuery(r.name);
    setSearching(false);
  };

  const clearPick = () => {
    setDraft(d => ({ ...d, selectedClub: null, claimProofNote: '', address: null }));
  };

  const notMyClub = () => {
    clearPick();
    setQuery('');
    setSearching(true);
    inputRef.current?.focus();
  };

  return (
    <>
      <main className="bizc-body" data-testid="bizc-step-2" data-branch="club">
        <div className="bizc-kicker">{t('businessCreate.clubKicker', { defaultValue: 'Your club' })}</div>
        <h1>{t('businessCreate.clubTitle', { defaultValue: 'Find your club.' })}</h1>

        <Field label={t('businessCreate.searchClubs', { defaultValue: 'Search clubs' })} testId="bizc-club-search">
          <input
            ref={inputRef}
            className="bizc-field-input"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSearching(true);
              if (club) clearPick();
            }}
            autoComplete="off"
          />
        </Field>

        {searching && query.trim().length >= 2 && results.length > 0 && (
          <div className="bizc-res" data-testid="bizc-club-results">
            {results.map(r => {
              const photo = (r as GolfClub & { thumbnail_image?: string | null }).thumbnail_image;
              return (
                <button key={r.id} type="button" className="bizc-res-row" onClick={() => pick(r)}>
                  <span className="bizc-thumb" aria-hidden="true">
                    {photo ? <img src={photo} alt="" /> : <Flag size={18} strokeWidth={1.8} />}
                  </span>
                  <span className="bizc-res-text">
                    <span className="bizc-res-name">{r.name}</span>
                    <span className="bizc-res-place">{searchResultPlace(r)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {searching && query.trim().length >= 2 && (
          <button type="button" className="bizc-link" onClick={() => setShowRequestClub(true)}>
            {t('businessCreate.cantFindClub', { defaultValue: "Can't find your club? Tell us ›" })}
          </button>
        )}

        {club && (
          <div className="bizc-clubcard" data-testid="bizc-club-card">
            <div className="bizc-clubcard-band">
              {bandPhoto && (
                <>
                  <img src={bandPhoto} alt="" />
                  <div className="bizc-clubcard-fade" />
                </>
              )}
            </div>
            <div className="bizc-clubcard-body">
              <div className="bizc-clubcard-name">{club.name}</div>
              <div className="bizc-clubcard-place">{clubPlaceLine(club, courses.length)}</div>
              {facts === 'no-rounds' ? (
                <div className="bizc-norounds">{t('businessCreate.noRounds', { defaultValue: 'No rounds tracked here yet.' })}</div>
              ) : facts ? (
                <div className="bizc-facts" data-testid="bizc-club-facts">
                  <div><b>{formatNumber(facts.rounds)}</b><i>{t('businessCreate.facts.rounds', { defaultValue: 'Rounds' })}</i></div>
                  <div><b>{facts.plays ?? '—'}</b><i>{t('businessCreate.facts.plays', { defaultValue: 'How it plays' })}</i></div>
                  <div><b>{facts.third.value}</b><i>{facts.third.label}</i></div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {club && existing && (
          <div className="bizc-note" data-testid="bizc-note-existing">
            <b>{club.name} is already on clbhouz.</b>
            <p>{t('businessCreate.alreadyOnBody', { defaultValue: "Ask its team to add you, and you'll manage it together." })}</p>
          </div>
        )}
        {club && !existing && claimPending && (
          <div className="bizc-note" data-testid="bizc-note-pending">
            <b>{t('businessCreate.claimPending', { defaultValue: 'A claim for this club is under review.' })}</b>
            <p>{t('businessCreate.claimPendingBody', { defaultValue: "You can't claim it while that's open. We'll let the club know once it's been checked." })}</p>
          </div>
        )}

        {club && !existing && (
          <>
            <Field label={t('businessCreate.proofLabel', { defaultValue: "Help us check it's you · optional" })} testId="bizc-proof">
              <textarea
                className="bizc-field-input"
                maxLength={CLAIM_PROOF_NOTE_MAX}
                value={draft.claimProofNote}
                placeholder={t('businessCreate.proofPlaceholder', { defaultValue: "e.g. I'm the general manager" })}
                onChange={e => setDraft(d => ({ ...d, claimProofNote: e.target.value }))}
              />
            </Field>
            <p className="bizc-hint">{t('businessCreate.proofHint', { defaultValue: 'Claims are reviewed by clbhouz. Your profile goes live straight away; the club link follows on approval.' })}</p>
          </>
        )}
      </main>

      <div className="bizc-foot">
        {existing ? (
          <button type="button" className="bizc-primary" data-testid="bizc-request-access" onClick={() => setShowRequestAccess(true)}>
            {t('businessCreate.requestAccess', { defaultValue: 'Request access' })}
          </button>
        ) : (
          <button type="button" className="bizc-primary" data-testid="bizc-claim" disabled={!club || claimPending} onClick={onContinue}>
            {t('businessCreate.claimClub', { defaultValue: 'Claim this club' })}
          </button>
        )}
        {club && (
          <button type="button" className="bizc-textbtn" onClick={notMyClub}>
            {t('businessCreate.notMyClub', { defaultValue: 'Not my club' })}
          </button>
        )}
      </div>

      <RequestClubModal open={showRequestClub} onOpenChange={setShowRequestClub} initialName={query} />
      {existing && (
        <RequestAccessModal
          open={showRequestAccess}
          onOpenChange={setShowRequestAccess}
          businessId={existing.id}
          businessName={existing.name}
          userId={userId}
        />
      )}
    </>
  );
}
