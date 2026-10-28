/** EP2 — the You group and its five sheets (ep2-you.html 2A–2F). Name, Bio,
 * Location and Gender save only their own columns through the parent's
 * onSave (useProfileSave profileFields partial); a false result keeps the
 * sheet open while the page's saved line shows the existing retry copy.
 * Username changes only through the change_username RPC, which owns the
 * 30-day rule; the live check mirrors setup's query. */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BizcSheet } from '@/features/business-create/BusinessCreateStep3';
import { LocationSection } from '@/components/profile/edit-v2/LocationSection';
import { BIO_MAX, DISPLAY_NAME_MAX } from '@/components/profile/profile-wizard/types';
import { USERNAME_RULE_MAX } from '@/features/onboarding/welcomeRules';
import { GENDER_OPTIONS, USERNAME_RE, fullName, genderLabel, locationValue, shownName, startsWithDifferentName, usernameTooSoon } from './youRules';

export type YouFields = 'name' | 'bio' | 'location' | 'gender';
export interface YouPatch { firstName?: string; lastName?: string; displayName?: string; bio?: string; country?: string; city?: string; gender?: string }

interface Props {
  userId: string;
  displayName: string;
  firstName: string;
  lastName: string;
  username: string;
  usernameChangedAt: string | null;
  bio: string;
  city: string;
  country: string;
  gender: string;
  onSave: (fields: YouFields, patch: YouPatch) => Promise<boolean>;
  onUsernameChanged: (username: string, changedAt: string) => void;
}

type Sheet = 'name' | 'username' | 'bio' | 'location' | 'gender' | null;

export function EditProfileYou(p: Props) {
  const { t } = useTranslation();
  const [sheet, setSheet] = useState<Sheet>(null);
  const close = () => setSheet(null);
  const save = async (fields: YouFields, patch: YouPatch) => { if (await p.onSave(fields, patch)) close(); };
  const loc = locationValue(p.city, p.country);
  const gl = genderLabel(p.gender);
  const rows: { key: Exclude<Sheet, null>; label: string; value: string; prompt?: string; two?: boolean }[] = [
    { key: 'name', label: t('editProfile.name', { defaultValue: 'Name' }), value: p.displayName },
    { key: 'username', label: t('editProfile.username', { defaultValue: 'Username' }), value: `@${p.username}` },
    { key: 'bio', label: t('editProfile.bio', { defaultValue: 'Bio' }), value: p.bio.trim(), prompt: t('editProfile.addBio', { defaultValue: 'Add a bio' }), two: true },
    { key: 'location', label: t('editProfile.location', { defaultValue: 'Location' }), value: loc, prompt: t('editProfile.addTown', { defaultValue: 'Add your town' }) },
    { key: 'gender', label: t('editProfile.gender', { defaultValue: 'Gender' }), value: gl, prompt: t('editProfile.choose', { defaultValue: 'Choose' }) },
  ];

  return (
    <>
      <div className="ep-group">{t('editProfile.you', { defaultValue: 'You' })}</div>
      <div className="ep-rows" data-testid="ep-you">
        {rows.map(r => (
          <button key={r.key} type="button" className="ep-row" data-row={r.key} onClick={() => setSheet(r.key)}>
            <span className="ep-row-label">{r.label}</span>
            <span className={`ep-row-value${r.two ? ' two' : ''}${r.value ? '' : ' ph'}`} data-testid={`ep-row-${r.key}`}>{r.value || r.prompt}</span>
            <ChevronRight size={18} className="ep-row-chev" aria-hidden="true" />
          </button>
        ))}
      </div>
      {sheet === 'name' && <NameSheet displayName={p.displayName} firstName={p.firstName} lastName={p.lastName} onClose={close} onSave={patch => save('name', patch)} />}
      {sheet === 'username' && <UsernameSheet {...p} onClose={close} />}
      {sheet === 'bio' && <BioSheet bio={p.bio} onClose={close} onSave={bio => save('bio', { bio })} />}
      {sheet === 'location' && <LocationSheet city={p.city} country={p.country} onClose={close} onSave={(country, city) => save('location', { country, city })} />}
      {sheet === 'gender' && (
        <BizcSheet testId="ep-sheet-gender" title={t('editProfile.gender', { defaultValue: 'Gender' })} onDone={close}>
          <div className="ep-opts" role="radiogroup">
            {GENDER_OPTIONS.map(o => (
              <button key={o.value} type="button" role="radio" aria-checked={p.gender === o.value} className="ep-opt" onClick={() => void save('gender', { gender: o.value })}>
                <span>{o.label}</span><i className="ep-radio" aria-hidden="true" />
              </button>
            ))}
          </div>
        </BizcSheet>
      )}
    </>
  );
}

function NameSheet({ displayName, firstName, lastName, onClose, onSave }: { displayName: string; firstName: string; lastName: string; onClose: () => void; onSave: (patch: YouPatch) => Promise<void> }) {
  const { t } = useTranslation();
  const [first, setFirst] = useState(firstName);
  const [last, setLast] = useState(lastName);
  const [different, setDifferent] = useState(() => startsWithDifferentName(displayName, firstName, lastName));
  const [display, setDisplay] = useState(displayName);
  const shown = shownName(first, last, different, display);
  const valid = !!first.trim() && (!different || (!!display.trim() && display.length <= DISPLAY_NAME_MAX));
  return (
    <BizcSheet testId="ep-sheet-name" title={t('editProfile.name', { defaultValue: 'Name' })} actionLabel={t('editProfile.save', { defaultValue: 'Save' })} actionDisabled={!valid} onDone={onClose}
      onAction={() => { if (valid) void onSave({ firstName: first.trim(), lastName: last.trim(), displayName: different ? display.trim() : fullName(first, last) }); }}>
      <div className="ep-two">
        <label className="bizc-field"><span className="bizc-field-label">{t('editProfile.first', { defaultValue: 'First' })}</span><input className="bizc-field-input" aria-label="First" value={first} autoCapitalize="words" onChange={e => setFirst(e.target.value)} /></label>
        <label className="bizc-field"><span className="bizc-field-label">{t('editProfile.last', { defaultValue: 'Last' })}</span><input className="bizc-field-input" aria-label="Last" value={last} autoCapitalize="words" onChange={e => setLast(e.target.value)} /></label>
      </div>
      <p className="ep-shown" data-testid="ep-shown">{t('editProfile.golfersSee', { defaultValue: 'Golfers see' })} <b>{shown}</b></p>
      <div className="ep-toggle">
        <div><b>{t('editProfile.differentName', { defaultValue: 'Use a different name' })}</b><span>{t('editProfile.differentNameSub', { defaultValue: 'For a nickname or your full name' })}</span></div>
        <button type="button" role="switch" aria-checked={different} aria-label="Use a different name" className="bizc-switch" onClick={() => { const next = !different; setDifferent(next); if (next && !display.trim()) setDisplay(fullName(first, last)); }}><i aria-hidden="true" /></button>
      </div>
      {different && (
        <label className="bizc-field">
          <span className="bizc-field-label">{t('editProfile.displayName', { defaultValue: 'Display name' })}<span className="ep-count" data-testid="ep-display-count">{display.length}/{DISPLAY_NAME_MAX}</span></span>
          <input className="bizc-field-input" aria-label="Display name" value={display} maxLength={DISPLAY_NAME_MAX} onChange={e => setDisplay(e.target.value)} />
        </label>
      )}
    </BizcSheet>
  );
}

type Avail = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error';

function UsernameSheet({ userId, username, usernameChangedAt, onClose, onUsernameChanged }: Props & { onClose: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [value, setValue] = useState(username);
  const [status, setStatus] = useState<Avail>('idle');
  const [changedAt, setChangedAt] = useState(usernameChangedAt);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const soon = usernameTooSoon(changedAt);

  useEffect(() => {
    clearTimeout(timer.current);
    const candidate = value.trim().toLowerCase();
    if (soon || !candidate || candidate === username) { setStatus('idle'); return; }
    if (!USERNAME_RE.test(candidate)) { setStatus('invalid'); return; }
    setStatus('checking');
    timer.current = setTimeout(async () => {
      try {
        const { count, error } = await supabase.from('user_profiles').select('id', { count: 'exact', head: true })
          .ilike('username', candidate.replace(/[\\%_]/g, '\\$&')).neq('id', userId);
        if (error) { setStatus('error'); return; }
        setStatus((count ?? 0) > 0 ? 'taken' : 'available');
      } catch { setStatus('error'); }
    }, 400);
    return () => clearTimeout(timer.current);
  }, [value, username, userId, soon]);

  const submit = async () => {
    if (busy || status !== 'available') return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc('change_username', { p_username: value.trim().toLowerCase() });
      if (error) { setStatus('error'); return; }
      const r = (data ?? {}) as { ok?: boolean; username?: string; reason?: string; next_change_at?: string };
      if (r.ok) {
        const next = r.username ?? value.trim().toLowerCase();
        const at = new Date().toISOString();
        onUsernameChanged(next, at);
        await Promise.all(['profile', 'user-profile', 'profile-id-by-username', 'public-profile'].map(k => qc.invalidateQueries({ queryKey: [k], refetchType: 'all' })));
        onClose();
        return;
      }
      if (r.reason === 'taken') setStatus('taken');
      else if (r.reason === 'invalid') setStatus('invalid');
      else if (r.reason === 'too_soon') setChangedAt(r.next_change_at ? new Date(new Date(r.next_change_at).getTime() - 30 * 86_400_000).toISOString() : new Date().toISOString());
      else setStatus('error');
    } catch { setStatus('error'); } finally { setBusy(false); }
  };

  const sub = soon
    ? t('editProfile.usernameTooSoon', { defaultValue: `You changed it on ${soon.changed}. You can change it again on ${soon.next}.`, changed: soon.changed, next: soon.next })
    : t('editProfile.usernameSub', { defaultValue: 'Your profile link changes with it. You can change it once every 30 days.' });
  return (
    <BizcSheet testId="ep-sheet-username" title={t('editProfile.username', { defaultValue: 'Username' })} sub={sub} onDone={onClose}
      hideAction={!!soon} actionLabel={t('editProfile.save', { defaultValue: 'Save' })} actionDisabled={busy || status !== 'available'} onAction={() => void submit()}>
      <label className="bizc-field ep-username" data-soon={!!soon}>
        <span className="bizc-field-label">{t('editProfile.username', { defaultValue: 'Username' })}</span>
        <span className="ep-loc-value">
          <span className="ep-at">@</span>
          <input className="bizc-field-input ep-loc-input" aria-label="Username" value={value} readOnly={!!soon} autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username" maxLength={USERNAME_RULE_MAX}
            onChange={e => setValue(e.target.value.toLowerCase())} />
          {status === 'available' && <span className="ep-available" data-testid="ep-available"><Check size={12} />{t('welcome.available', { defaultValue: 'Available' })}</span>}
        </span>
      </label>
      {status === 'taken' && <p className="ep-err" role="alert" data-testid="ep-username-error" data-reason="taken">{t('welcome.taken', { defaultValue: 'That username is taken - please choose another.' })}</p>}
      {status === 'invalid' && <p className="ep-err" role="alert" data-testid="ep-username-error" data-reason="invalid">{t('welcome.invalidUsername', { defaultValue: 'Username must be 3-20 lowercase letters, numbers, _ or .' })}</p>}
      {status === 'error' && <p className="ep-err" role="alert" data-testid="ep-username-error" data-reason="error">{t('editProfile.saveError', { defaultValue: "Couldn't save. Try again." })}</p>}
    </BizcSheet>
  );
}

function BioSheet({ bio, onClose, onSave }: { bio: string; onClose: () => void; onSave: (bio: string) => Promise<void> }) {
  const { t } = useTranslation();
  const [value, setValue] = useState(bio);
  return (
    <BizcSheet testId="ep-sheet-bio" title={t('editProfile.bio', { defaultValue: 'Bio' })} onDone={onClose} onAction={() => void onSave(value)}>
      <textarea className="ep-bigta" aria-label="Bio" value={value} maxLength={BIO_MAX} onChange={e => setValue(e.target.value.slice(0, BIO_MAX))} />
      <div className="ep-bio-count" data-testid="ep-bio-count">{value.length} / {BIO_MAX}</div>
    </BizcSheet>
  );
}

function LocationSheet({ city, country, onClose, onSave }: { city: string; country: string; onClose: () => void; onSave: (country: string, city: string) => Promise<void> }) {
  const { t } = useTranslation();
  const [c, setC] = useState(country);
  const [town, setTown] = useState(city);
  return (
    <BizcSheet testId="ep-sheet-location" title={t('editProfile.location', { defaultValue: 'Location' })} onDone={onClose} onAction={() => void onSave(c, town)}>
      <LocationSection appearance="card" country={c} city={town} onCountryChange={setC} onCityChange={setTown} />
    </BizcSheet>
  );
}
