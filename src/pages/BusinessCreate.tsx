/**
 * BC1 — new Create-a-business flow on the hidden route /business/create-v2.
 * Step state rides browser history (location.state.bizStep), so the iOS edge
 * swipe and Back return to the previous step. Nothing is saved in BC1.
 * /business/create keeps BusinessProfileEditor until BC5.
 */
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { fetchGolfClub, clubRowToSelected } from '@/features/business/claimClub';
import { CREATE_CATEGORY_GROUPS, CREATE_STEPS, categoryDisplayLabel, initialDraft, type BusinessCreateDraft } from '@/features/business-create/createRules';
import '@/features/business-create/business-create.css';

const SESSION_ENDED_MSG = 'Your session has ended. Please sign in again; nothing has been saved yet.';

export default function BusinessCreate() {
  const { t } = useTranslation('profile');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useSupabaseSession();
  useHideBottomNav();

  const [draft, setDraft] = useState<BusinessCreateDraft>(() => initialDraft(searchParams));
  const step = ((location.state as { bizStep?: number } | null)?.bizStep ?? 1);

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
    if (step > 1 || location.key !== 'default') navigate(-1);
    else navigate('/profile');
  };

  return (
    <div className="bizc-shell" data-testid="business-create">
      <div className="bizc-top">
        <button type="button" className="bizc-back" onClick={back} aria-label={t('businessCreate.back', { defaultValue: 'Back' })}><ChevronLeft size={20} /></button>
        <div className="bizc-progress" aria-hidden="true" data-testid="bizc-progress">
          {Array.from({ length: CREATE_STEPS }, (_, i) => <i key={i} data-complete={i < step} />)}
        </div>
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
                      <button key={tile.value} type="button" className="bizc-tile" data-value={tile.value} aria-pressed={draft.category === tile.value} onClick={() => setDraft(d => ({ ...d, category: tile.value }))}>
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
      ) : (
        <main className="bizc-body" data-testid="bizc-step-2">
          <div className="bizc-kicker">{t('businessCreate.kicker', { defaultValue: 'Put your business on clbhouz' })}</div>
          <p className="bizc-sub" data-testid="bizc-chosen">{categoryDisplayLabel(draft.category)}</p>
        </main>
      )}
    </div>
  );
}
