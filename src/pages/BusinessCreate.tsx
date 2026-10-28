/**
 * BC5 — canonical Create-a-business flow at /business/create.
 * Step state rides browser history (location.state.bizStep), so the iOS edge
 * swipe and Back return to the previous step. Saved finish replaces history
 * and collapses the completed step run so Back cannot reopen a live draft.
 */
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { fetchGolfClub, clubRowToSelected } from '@/features/business/claimClub';
import { CREATE_CATEGORY_GROUPS, CREATE_STEPS, initialDraft, type BusinessCreateDraft } from '@/features/business-create/createRules';
import { BusinessCreateStep2 } from '@/features/business-create/BusinessCreateStep2';
import { BusinessCreateStep3 } from '@/features/business-create/BusinessCreateStep3';
import { BusinessCreateStep4 } from '@/features/business-create/BusinessCreateStep4';
import type { BusinessCategoryValue } from '@/constants/businessCategories';
import { createBusiness, type CreateBusinessResult } from '@/features/business-create/createBusiness';
import { BusinessCreateFinish } from '@/features/business-create/BusinessCreateFinish';
import { BusinessOwnerlessNotice, BusinessDiscardNotice, type OwnerlessNotice } from '@/features/business-create/BusinessCreationNotices';
import { SaveStepError, errorText, isAuthError, logSaveFailure } from '@/features/business-create/creationErrors';
import { useCreateDeparture } from '@/features/business-create/useCreateDeparture';
import '@/features/business-create/business-create.css';

const SESSION_ENDED_MSG = 'Your session has ended. Please sign in again; nothing has been saved yet.';

export default function BusinessCreate() {
  const { t } = useTranslation('profile');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useSupabaseSession();
  const queryClient = useQueryClient();
  useHideBottomNav();

  const [draft, setDraft] = useState<BusinessCreateDraft>(() => initialDraft(searchParams));
  const [creating, setCreating] = useState(false);
  const creatingRef = useRef(false);
  const [result, setResult] = useState<CreateBusinessResult | null>(null);
  const [ownerless, setOwnerless] = useState<OwnerlessNotice | null>(null);
  const step = result ? 5 : ((location.state as { bizStep?: number } | null)?.bizStep ?? (searchParams.get('clubId') && location.pathname === '/business/create' ? 2 : 1));
  const initial = useRef(JSON.stringify(initialDraft(searchParams)));
  const dirty = JSON.stringify(draft) !== initial.current;
  const departure = useCreateDeparture(dirty, creating || !!ownerless, !!result, step);
  const firstHistoryIndex = useRef<number | null>(typeof window.history.state?.idx === 'number' ? window.history.state.idx : null);
  // When completion collapses earlier flow entries, replace the entry reached
  // by that POP with the saved finish; the draft never becomes editable again.
  useEffect(() => {
    if (result && (location.state as { bizStep?: number } | null)?.bizStep !== 5) navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: { bizStep: 5 } });
  }, [result, location.key, location.state, location.pathname, location.search, navigate]);
  // The flow, not the individual step, owns committed object URLs so Back
  // preserves photographs. Replaced URLs and flow departure release them.
  useEffect(() => { const url = draft.cover.localPreview; return () => { if (url) URL.revokeObjectURL(url); }; }, [draft.cover.localPreview]);
  useEffect(() => { const url = draft.logo.localPreview; return () => { if (url) URL.revokeObjectURL(url); }; }, [draft.logo.localPreview]);

  const clubId = searchParams.get('clubId');
  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;
    fetchGolfClub(clubId)
      .then(row => { if (!cancelled && row) setDraft(d => ({ ...d, selectedClub: clubRowToSelected(row) })); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [clubId]);

  const sessionSeenRef = useRef(false);
  useEffect(() => {
    // eslint-disable-next-line settled/no-not-loading-empty-check -- authLoading is the session flag, not a React Query.
    if (!authLoading && !user) {
      if (sessionSeenRef.current) toast.error(SESSION_ENDED_MSG);
      navigate('/auth');
    } else if (user) sessionSeenRef.current = true;
  }, [authLoading, user, navigate]);

  if (authLoading || !user) return null;

  const goStep = (n: number) => navigate({ pathname: location.pathname, search: location.search }, { state: { bizStep: n } });
  const back = () => {
    if (step > 1) navigate(-1);
    else departure.requestExit(() => { if (location.key !== 'default') navigate(-1); else navigate('/profile'); });
  };
  const finish = async () => {
    if (creatingRef.current || result || ownerless) return;
    creatingRef.current = true; setCreating(true);
    try {
      const saved = await createBusiness(draft, { userId: user.id, sourceCourseId: searchParams.get('sourceCourseId'), queryClient });
      if (saved.ownerless) { setOwnerless(saved.ownerless); return; }
      departure.allowExit(); setResult(saved);
      const current = window.history.state?.idx;
      const start = firstHistoryIndex.current;
      if (typeof current === 'number' && start != null && current > start) navigate(start - current);
      else navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: { bizStep: 5 } });
    } catch (error) {
      const cause = error instanceof SaveStepError ? error.cause : error;
      logSaveFailure(error instanceof SaveStepError ? error.step : 'create', cause, { category: draft.category, mode: 'create' });
      const text = errorText(cause);
      toast.error(isAuthError(cause) ? `${SESSION_ENDED_MSG} (${text})` : text ? `Couldn't create the business: ${text}` : "Couldn't create the business");
    } finally { creatingRef.current = false; setCreating(false); }
  };

  /* BC2: changing the category clears the step 2 fields that belong to the
   * branch being left, so a stale club, college, name or address never
   * follows the member into a different branch. */
  const setCategory = (value: BusinessCategoryValue) => setDraft(d => {
    if (d.category === value) return d;
    const next = { ...d, category: value };
    if (d.category === 'Golf Club') {
      next.selectedClub = null;
      next.claimProofNote = '';
      next.address = null;
    } else if (d.category === 'University / College') {
      next.selectedCollege = null;
    } else if (d.category) {
      next.businessName = '';
      next.address = null;
      next.countrySelection = null;
    }
    return next;
  });

  return (
    <div className="bizc-shell" data-testid="business-create">
      <div className="bizc-top">
        {!result && <Button variant="ghost" type="button" className="bizc-back" disabled={creating || !!ownerless} onClick={back} aria-label={t('businessCreate.back', { defaultValue: 'Back' })}><ChevronLeft size={20} /></Button>}
        <div className="bizc-progress" aria-hidden="true" data-testid="bizc-progress">
          {Array.from({ length: CREATE_STEPS }, (_, i) => <i key={i} data-complete={i < step} />)}
        </div>
        {/* BC3: step 3 is skippable — everything on it is optional and Skip
            keeps whatever is filled, exactly like Continue. */}
        {(step === 3 || step === 4) && (
          <Button variant="ghost" type="button" className="bizc-skip" data-testid="bizc-skip" disabled={creating || !!ownerless} onClick={() => step === 4 ? void finish() : goStep(step + 1)}>
            {t('businessCreate.skip', { defaultValue: 'Skip' })}
          </Button>
        )}
      </div>
      {step === 1 ? (
        <>
          <main className="bizc-body">
            <div className="bizc-kicker">{t('businessCreate.kicker', { defaultValue: 'Put your business on clbhouz' })}</div>
            <h1>{t('businessCreate.categoryTitle', { defaultValue: 'What do you do?' })}</h1>
            <p className="bizc-sub">{t('businessCreate.categorySub', { defaultValue: "This sets up your profile. It can't be changed later." })}</p>
            {CREATE_CATEGORY_GROUPS.map(g => (
              <section key={g.key} data-group={g.key}>
                <div className="bizc-group">{t(`businessCreate.group.${g.key}`, { defaultValue: g.label })}</div>
                <div className="bizc-tiles">
                  {g.tiles.map(tile => {
                    const Icon = tile.icon;
                    return (
                      <button key={tile.value} type="button" className="bizc-tile" data-value={tile.value} aria-pressed={draft.category === tile.value} onClick={() => setCategory(tile.value)}>
                        <Icon strokeWidth={1.8} aria-hidden="true" />{tile.label}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </main>
          <div className="bizc-foot">
            <button type="button" className="bizc-primary" data-testid="bizc-continue" disabled={!draft.category} onClick={() => goStep(2)}>{t('businessCreate.continue', { defaultValue: 'Continue' })}</button>
          </div>
        </>
      ) : step === 2 ? (
        <BusinessCreateStep2 draft={draft} setDraft={setDraft} userId={user.id} onContinue={() => goStep(3)} />
      ) : step === 3 ? (
        <BusinessCreateStep3 draft={draft} setDraft={setDraft} onContinue={() => goStep(4)} />
      ) : step === 4 ? (
        <BusinessCreateStep4 draft={draft} setDraft={setDraft} onFinish={() => void finish()} creating={creating} />
      ) : (
        result && <BusinessCreateFinish draft={draft} result={result} userId={user.id} />
      )}
      <BusinessOwnerlessNotice notice={ownerless} onDismiss={() => { const target = ownerless?.target; departure.allowExit(); setOwnerless(null); if (target) navigate(target, { replace: true }); }} />
      <BusinessDiscardNotice open={departure.confirmOpen} onOpenChange={departure.setConfirmOpen} onDiscard={departure.discard} />
    </div>
  );
}
