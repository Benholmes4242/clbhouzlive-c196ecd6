/** EP4 link sheets use the existing partial saver; handicap visibility has no
 * local writer: usePrivacySettings and profile-cache refresh remain authoritative
 * across this group and unchanged SettingsTabContent. Legacy editor stays separate. */
import { useState } from 'react';
import { ChevronRight, Instagram, Youtube, X } from 'lucide-react';
import { nanoid } from 'nanoid';
import { Button } from '@/components/ui/button';
import { BizcSheet } from '@/features/business-create/BusinessCreateStep3';
import { XIcon, TikTokIcon } from '@/components/profile/edit-v2/SocialLinksSection';
import { usePrivacySettings, type VisibilityLevel } from '@/hooks/usePrivacySettings';
import type { ProfileFormData } from '@/components/profile/profile-wizard/types';
import { PERSONAL_WEBSITE_LIMIT, PERSONAL_WEBSITE_ERROR, personalWebsiteValid } from '@/lib/profile/websiteValidation';
import { HANDICAP_VISIBILITY_OPTIONS, PERSONAL_SOCIALS, PROFILE_VISIBILITY_OPTIONS, handicapVisibilityLabel, profileVisibilityLabel, socialsDisplay, websiteDisplay } from './linkPrivacyRules';

export type LinksPrivacyFields = 'websites' | 'socials' | 'homeClubVisibility' | 'additionalClubsVisibility' | 'topTenVisibility';
export type LinksPrivacyPatch = Partial<Pick<ProfileFormData, 'websites' | 'instagramHandle' | 'twitterHandle' | 'tiktokHandle' | 'youtubeHandle' | 'homeClubVisibility' | 'additionalClubsVisibility' | 'topTenVisibility'>>;
interface Props {
  userId: string; form: ProfileFormData; handicapVisibility: VisibilityLevel;
  onSave: (fields: LinksPrivacyFields, patch: LinksPrivacyPatch) => Promise<boolean>;
}
const VISIBILITY_ROWS = [
  { key: 'homeClubVisibility', label: 'Home club', title: 'Who sees your home club' },
  { key: 'additionalClubsVisibility', label: 'Other clubs', title: 'Who sees your other clubs' },
  { key: 'topTenVisibility', label: 'Top 10', title: 'Who sees your Top 10' },
] as const;
type Sheet = LinksPrivacyFields | 'handicap' | null;
export function EditProfileLinksPrivacy(p: Props) {
  const privacy = usePrivacySettings(p.userId || undefined, p.form.isPublic, p.handicapVisibility);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [busy, setBusy] = useState(false);
  const close = () => { if (!busy) setSheet(null); };
  const save = async (fields: LinksPrivacyFields, patch: LinksPrivacyPatch) => {
    if (busy) return;
    setBusy(true);
    try { if (await p.onSave(fields, patch)) setSheet(null); } finally { setBusy(false); }
  };
  const sites = p.form.websites.filter(w => w.url);
  const socials = socialsDisplay(p.form);
  const row = (key: Exclude<Sheet, null>, label: string, value: React.ReactNode, prompt = false) => <Button variant="ghost" className="ep-row" data-row={key} onClick={() => setSheet(key)}>
    <span className="ep-row-label">{label}</span><span className={`ep-row-value${prompt ? ' ph' : ''}`} data-testid={`ep-links-${key}`}>{value}</span><ChevronRight size={18} className="ep-row-chev" aria-hidden />
  </Button>;
  const visibility = VISIBILITY_ROWS.find(r => r.key === sheet);
  return <>
    <div className="ep-group">Links</div>
    <div className="ep-rows" data-testid="ep-links">
      {row('websites', 'Website', sites.length ? <>{websiteDisplay(sites[0]?.url ?? '')}{sites.length > 1 && <span className="ep-golf-mute"> +{sites.length - 1}</span>}</> : 'Add a website', sites.length === 0)}
      {row('socials', 'Socials', socials || 'Add Instagram, X and more', !socials)}
    </div>
    <div className="ep-group">Who sees what</div>
    <div className="ep-rows" data-testid="ep-visibility">
      {row('handicap', 'Handicap', handicapVisibilityLabel(privacy.handicapVisibility))}
      {VISIBILITY_ROWS.map(r => <span className="ep-visibility-row" key={r.key}>{row(r.key, r.label, profileVisibilityLabel(p.form[r.key]))}</span>)}
    </div>
    <p className="ep-links-hint ep-privacy-hint">More privacy choices are in Settings.</p>
    {sheet === 'websites' && <WebsitesSheet websites={p.form.websites} busy={busy} onClose={close} onSave={websites => save('websites', { websites })} />}
    {sheet === 'socials' && <SocialsSheet form={p.form} busy={busy} onClose={close} onSave={patch => save('socials', patch)} />}
    {visibility && <BizcSheet title={visibility.title} testId="ep-sheet-visibility" onDone={close} actionDisabled={busy}>
      <div className="ep-rows ep-links-options" role="radiogroup" aria-label={visibility.title}>{PROFILE_VISIBILITY_OPTIONS.map(o => <Button key={o.value} variant="ghost" role="radio" aria-checked={p.form[visibility.key] === o.value} disabled={busy} className="ep-opt" onClick={() => void save(visibility.key, { [visibility.key]: o.value })}><span>{o.label}</span><i className="ep-radio" aria-hidden /></Button>)}</div>
    </BizcSheet>}
    {sheet === 'handicap' && <BizcSheet title="Who sees your handicap" testId="ep-sheet-handicap-visibility" onDone={close} actionDisabled={busy || privacy.isUpdatingHandicapVisibility}>
      <div className="ep-rows ep-links-options" role="radiogroup" aria-label="Who sees your handicap">{HANDICAP_VISIBILITY_OPTIONS.map(o => <Button key={o.value} variant="ghost" role="radio" aria-checked={privacy.handicapVisibility === o.value} disabled={busy || privacy.isUpdatingHandicapVisibility} className="ep-opt" onClick={() => {
        if (busy) return;
        setBusy(true);
        void privacy.setHandicapVisibilityLevel(o.value).finally(() => { setBusy(false); setSheet(null); });
      }}><span>{o.label}</span><i className="ep-radio" aria-hidden /></Button>)}</div>
    </BizcSheet>}
  </>;
}
function WebsitesSheet(p: { websites: ProfileFormData['websites']; busy: boolean; onClose: () => void; onSave: (websites: ProfileFormData['websites']) => Promise<void> }) {
  const [sites, setSites] = useState(p.websites.filter(w => w.url));
  const [error, setError] = useState(false);
  const save = () => {
    if (sites.some(w => !personalWebsiteValid(w.url))) { setError(true); return; }
    void p.onSave(sites.filter(w => w.url));
  };
  return <BizcSheet title="Websites" testId="ep-sheet-websites" onDone={p.onClose} onAction={save} actionDisabled={p.busy}>
    <div className="ep-rows ep-links-options">
      {sites.map((w, index) => <div className="ep-link-input-row" key={w.id}>
        <input className="ep-link-input" aria-label={`Website ${index + 1}`} inputMode="url" autoCapitalize="none" autoCorrect="off" value={w.url} disabled={p.busy} onChange={e => { setSites(old => old.map(s => s.id === w.id ? { ...s, url: e.target.value } : s)); setError(false); }} />
        <Button variant="ghost" size="icon" className="ep-link-remove" aria-label={`Remove website ${index + 1}`} disabled={p.busy} onClick={() => setSites(old => old.filter(s => s.id !== w.id))}><X size={16} /></Button>
      </div>)}
      {sites.length < PERSONAL_WEBSITE_LIMIT && <div className="ep-link-input-row"><input className="ep-link-input" aria-label="Add another website" placeholder="Add another website" inputMode="url" autoCapitalize="none" autoCorrect="off" value="" disabled={p.busy} onChange={e => { if (e.target.value) { setSites(old => [...old, { id: nanoid(), url: e.target.value }]); setError(false); } }} /></div>}
    </div>
    {error && <p className="ep-err" role="alert">{PERSONAL_WEBSITE_ERROR}</p>}
    <p className="ep-links-hint">Up to three.</p>
  </BizcSheet>;
}
function SocialsSheet(p: { form: ProfileFormData; busy: boolean; onClose: () => void; onSave: (patch: LinksPrivacyPatch) => Promise<void> }) {
  const [values, setValues] = useState({ instagramHandle: p.form.instagramHandle, twitterHandle: p.form.twitterHandle, tiktokHandle: p.form.tiktokHandle, youtubeHandle: p.form.youtubeHandle });
  return <BizcSheet title="Socials" sub="So golfers can follow you off the course." testId="ep-sheet-socials" onDone={p.onClose} onAction={() => void p.onSave(values)} actionDisabled={p.busy}>
    <div className="ep-rows ep-links-options">{PERSONAL_SOCIALS.map(s => <div className="ep-link-input-row ep-social-input-row" key={s.key}>
      <span className="ep-social-icon" aria-hidden>{s.icon === 'instagram' ? <Instagram size={16} /> : s.icon === 'youtube' ? <Youtube size={16} /> : s.icon === 'twitter' ? <XIcon /> : <TikTokIcon />}</span>
      <input className="ep-link-input" aria-label={s.placeholder} placeholder={s.placeholder} autoCapitalize="none" autoCorrect="off" spellCheck={false} value={values[s.key]} disabled={p.busy} onChange={e => setValues(old => ({ ...old, [s.key]: e.target.value.replace('@', '') }))} />
    </div>)}</div>
  </BizcSheet>;
}