/**
 * BC2 step 2, University / College branch (panel 2E of biz-c2-find.html).
 * Same field and results pattern as the club branch, over college_media read
 * exactly as CollegeSearchDropdown reads it (ilike college_name, limit 10).
 * The duplicate guard is the editor's college guard: name match on non-deleted
 * University / College businesses only (a courtesy check — no unique index on
 * this path). Nothing is saved; the pick lands in the draft.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import type { SelectedCollege } from '@/components/business/CollegeSearchDropdown';
import { RequestAccessModal } from '@/components/business/RequestAccessModal';
import { AppLog } from '@/lib/logger';
import { nameInitials } from './step2Rules';
import { Field } from './step2Bits';
import type { BusinessCreateDraft } from './createRules';

interface Props {
  draft: BusinessCreateDraft;
  setDraft: (fn: (d: BusinessCreateDraft) => BusinessCreateDraft) => void;
  userId: string;
  onContinue: () => void;
}

export function Step2College({ draft, setDraft, userId, onContinue }: Props) {
  const { t } = useTranslation('profile');
  const college = draft.selectedCollege;
  const [query, setQuery] = useState(college?.college_name ?? '');
  const [searching, setSearching] = useState(!college);
  const [results, setResults] = useState<SelectedCollege[]>([]);
  const [existing, setExisting] = useState<{ id: string; name: string } | null>(null);
  const [showRequestAccess, setShowRequestAccess] = useState(false);

  /* College search — the same read CollegeSearchDropdown makes. */
  useEffect(() => {
    if (!searching || query.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const { data, error } = await supabase
        .from('college_media')
        .select('id, college_name, normalized_name, logo_url, country')
        .ilike('college_name', `%${query}%`)
        .limit(10);
      if (cancelled) return;
      if (error) {
        AppLog.error('[BusinessCreate]', 'college search failed', error);
        setResults([]);
        return;
      }
      setResults((data ?? []) as SelectedCollege[]);
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, searching]);

  /* Duplicate guard — the editor's college check (non-deleted name match). */
  const collegeId = college?.id;
  useEffect(() => {
    if (!collegeId || !college) {
      setExisting(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('business_accounts')
        .select('id, name')
        .eq('category', 'University / College')
        .eq('name', college.college_name)
        .eq('is_deleted', false)
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (error) AppLog.error('[BusinessCreate]', 'college dup check failed', error);
      setExisting(data ?? null);
    })();
    return () => { cancelled = true; };
  }, [collegeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (c: SelectedCollege) => {
    setDraft(d => ({ ...d, selectedCollege: c }));
    setQuery(c.college_name);
    setSearching(false);
  };

  return (
    <>
      <main className="bizc-body" data-testid="bizc-step-2" data-branch="college">
        <div className="bizc-kicker">{t('businessCreate.collegeKicker', { defaultValue: 'Your college' })}</div>
        <h1>{t('businessCreate.collegeTitle', { defaultValue: 'Find your college.' })}</h1>

        <Field label={t('businessCreate.searchColleges', { defaultValue: 'Search colleges' })} testId="bizc-college-search">
          <input
            className="bizc-field-input"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSearching(true);
              if (college) setDraft(d => ({ ...d, selectedCollege: null }));
            }}
            autoComplete="off"
          />
        </Field>

        {searching && query.trim().length >= 2 && results.length > 0 && (
          <div className="bizc-res" data-testid="bizc-college-results">
            {results.map(c => (
              <button key={c.id} type="button" className="bizc-res-row" onClick={() => pick(c)}>
                <span className="bizc-crest" aria-hidden="true">
                  {c.logo_url ? <img src={c.logo_url} alt="" /> : nameInitials(c.college_name)}
                </span>
                <span className="bizc-res-text">
                  <span className="bizc-res-name">{c.college_name}</span>
                  <span className="bizc-res-place">{c.country ?? ''}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {college && (
          <div className="bizc-card" data-testid="bizc-college-card">
            <div className="bizc-idrow">
              <span className="bizc-crest" aria-hidden="true">
                {college.logo_url ? <img src={college.logo_url} alt="" /> : nameInitials(college.college_name)}
              </span>
              <span className="bizc-res-text">
                <span className="bizc-res-name" style={{ fontSize: 16 }}>{college.college_name}</span>
                <span className="bizc-res-place" style={{ fontSize: 13 }}>{college.country ?? ''}</span>
              </span>
            </div>
          </div>
        )}

        {college && existing && (
          <div className="bizc-note" data-testid="bizc-note-existing">
            <b>{college.college_name} is already on clbhouz.</b>
            <p>{t('businessCreate.alreadyOnBody', { defaultValue: "Ask its team to add you, and you'll manage it together." })}</p>
          </div>
        )}
      </main>

      <div className="bizc-foot">
        {existing ? (
          <button type="button" className="bizc-primary" data-testid="bizc-request-access" onClick={() => setShowRequestAccess(true)}>
            {t('businessCreate.requestAccess', { defaultValue: 'Request access' })}
          </button>
        ) : (
          <button type="button" className="bizc-primary" data-testid="bizc-continue-2" disabled={!college} onClick={onContinue}>
            {t('businessCreate.continue', { defaultValue: 'Continue' })}
          </button>
        )}
      </div>

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
