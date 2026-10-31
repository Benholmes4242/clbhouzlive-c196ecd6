/** BE4 owns sheet drafts and field-only save requests. Parent owns protected
 * writes/invalidation/status. Shared profile rules own action priority/labels;
 * create-mode sections retain their independent default presentation. */
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BizcSheet } from '@/features/business-create/BusinessCreateStep3';
import { businessActionLabel, businessSecondPill, type SecondInput } from '@/lib/business/businessHero';
import { DAYS_ORDER, DEFAULT_OPENING_HOURS, SOCIAL_PLATFORMS, PRIMARY_ACTION_OPTIONS, getFacilitiesForCategory, type Day, type OpeningHours, type SocialFields, type PrimaryActionKey } from './editorTypes';
import { websiteDisplay } from './businessContactRules';

export type ProfileLinkSheet = 'main' | 'hours' | 'facilities' | 'socials';
export type ProfileLinkSave = { kind: 'main'; value: PrimaryActionKey } | { kind: 'hours'; value: OpeningHours; shown: boolean } | { kind: 'facilities'; value: string[] } | { kind: 'socials'; value: SocialFields };
interface Props {
  action: SecondInput; street?: string; town?: string; hours: OpeningHours; shown: boolean;
  amenities: string[]; social: SocialFields; busy: boolean;
  requested: { kind: ProfileLinkSheet; serial: number } | null;
  onSave: (save: ProfileLinkSave) => Promise<boolean>;
}
const label = (_key: string, fallback: string) => fallback;
export function BusinessEditProfileLinks(props: Props) {
  const [sheet, setSheet] = useState<ProfileLinkSheet | null>(null);
  const [hours, setHours] = useState(props.hours);
  const [shown, setShown] = useState(props.shown);
  const [amenities, setAmenities] = useState(props.amenities);
  const [social, setSocial] = useState(props.social);
  const [day, setDay] = useState<Day | null>(null);
  const [serial, setSerial] = useState<number | null>(null);
  const pill = businessSecondPill(props.action, label);
  const locked = pill?.kind === 'book' || pill?.kind === 'soon';
  const open = (kind: ProfileLinkSheet) => {
    if (props.busy || (kind === 'main' && locked)) return;
    setHours(props.hours); setShown(props.shown); setAmenities([...props.amenities]); setSocial({ ...props.social }); setDay(null); setSheet(kind);
  };
  if (props.requested && props.requested.serial !== serial) { setSerial(props.requested.serial); open(props.requested.kind); }
  const save = async () => {
    const request: ProfileLinkSave = sheet === 'hours' ? { kind: 'hours', value: hours, shown }
      : sheet === 'facilities' ? { kind: 'facilities', value: amenities } : { kind: 'socials', value: social };
    if (await props.onSave(request)) setSheet(null);
  };
  const row = (name: string, value: string, placeholder: string, kind: ProfileLinkSheet, readOnly = false, suffix?: string) => {
    const content = <><span className="ep-row-label">{name}</span><span className={`ep-row-value${value ? '' : ' ph'}`}>{value || placeholder}{suffix && <span className="be2-lock"> · {suffix}</span>}</span>{!readOnly && <ChevronRight size={18} aria-hidden />}</>;
    return readOnly ? <div className="ep-row">{content}</div> : <Button variant="ghost" className="ep-row" disabled={props.busy} onClick={() => open(kind)}>{content}</Button>;
  };
  const updateDay = (key: Day, patch: Partial<OpeningHours[string]>) => setHours(previous => ({ ...previous, [key]: { ...(previous[key] ?? DEFAULT_OPENING_HOURS[key]), ...patch } }));
  const firstOpenDay = DAYS_ORDER.find(key => !hours[key]?.closed);
  const titles = { main: 'Main button', hours: 'Hours', facilities: 'Facilities', socials: 'Socials' };
  const socialsValue = SOCIAL_PLATFORMS.filter(({ field }) => props.social[field]).map(({ field, label: name }) => field === 'twitter' ? 'X' : name).join(', ');
  return <>
    <section className="be4-groups">
      <h2 className="ep-group">On your profile</h2><div className="ep-rows">
        {row('Main button', pill?.label || '', 'None', 'main', locked, locked ? pill?.kind === 'soon' ? 'bookings coming soon' : 'your booking link' : undefined)}
        {row('Hours', props.shown && Object.values(props.hours).some(entry => !entry.closed && entry.open && entry.close) ? 'Shown' : '', 'Hidden', 'hours')}
        {row('Facilities', props.amenities.join(', '), 'None yet', 'facilities')}
      </div>
      <h2 className="ep-group">Links</h2><div className="ep-rows">{row('Socials', socialsValue, 'Add Instagram, X and more', 'socials')}</div>
    </section>
    {sheet && <BizcSheet title={titles[sheet]} testId="be4-profile-sheet" onDone={() => setSheet(null)} onAction={() => { if (sheet === 'main') setSheet(null); else void save(); }} actionDisabled={props.busy}>
      <div className="be4-sheet">
        {sheet === 'main' && <><p className="be4-sub">The one button golfers see first on your profile.</p><div className="be4-options" role="radiogroup" aria-label="Main button">
          {PRIMARY_ACTION_OPTIONS.map(({ key }) => {
            const enabled = key === 'call' ? !!props.action.phone : key === 'email' ? !!props.action.email : key === 'website' ? !!props.action.website : key === 'directions' ? !!props.action.location || (props.action.lat != null && props.action.lng != null) : false;
            const line = key === 'book' ? 'Coming with bookings in v2' : key === 'call' ? props.action.phone || 'Add a phone number first' : key === 'email' ? props.action.email || 'Add an email first' : key === 'website' ? websiteDisplay(props.action.website || '') || 'Add your website first' : enabled ? `To your pin on ${props.street || props.town || props.action.location || ''}` : 'Pin your address first';
            return <Button key={key} variant="ghost" className="ep-opt be4-option" role="radio" aria-checked={props.action.primary_action === key} disabled={!enabled || props.busy} onClick={async () => { if (await props.onSave({ kind: 'main', value: key })) setSheet(null); }}><span><b>{businessActionLabel(key, props.action.category, label)}</b><small>{line}</small></span><i className="be4-radio" aria-hidden /></Button>;
          })}
        </div></>}
        {sheet === 'hours' && <>
          <div className="be4-switch-row"><span>Show on my profile<small>Turn off if your hours vary</small></span><Button variant="ghost" className="be4-switch" role="switch" aria-label="Show on my profile" aria-checked={shown} onClick={() => setShown(!shown)}><i aria-hidden /></Button></div>
          <div className="be4-hours">{DAYS_ORDER.map(key => { const entry = hours[key] ?? DEFAULT_OPENING_HOURS[key]; return <div key={key} className="be4-day">
            <Button variant="ghost" className="be4-day-row" aria-expanded={day === key} onClick={() => setDay(day === key ? null : key)}><span>{key}</span><span className={entry.closed ? 'closed' : ''}>{entry.closed ? 'Closed' : `${entry.open} – ${entry.close}`}</span></Button>
            {day === key && <div className="be4-day-controls">{!entry.closed && <><input type="time" aria-label={`${key} opens`} value={entry.open} onChange={event => updateDay(key, { open: event.target.value })} /><span>–</span><input type="time" aria-label={`${key} closes`} value={entry.close} onChange={event => updateDay(key, { close: event.target.value })} /></>}<Button variant="ghost" onClick={() => updateDay(key, { closed: !entry.closed })}>{entry.closed ? 'Open' : 'Close'}</Button></div>}
          </div>; })}</div><p className="be4-helper">Tap a day to change it.</p>
          {day && firstOpenDay && <Button variant="ghost" className="be4-copy" onClick={() => setHours(Object.fromEntries(DAYS_ORDER.map(key => [key, { ...hours[firstOpenDay] }]))) }>+ Apply Monday to all days</Button>}
        </>}
        {sheet === 'facilities' && <><p className="be4-sub">Tap what you offer. Each one shows as a tag on your profile.</p><div className="be4-facilities" role="group" aria-label="Facilities and amenities">{getFacilitiesForCategory(props.action.category || '').map(tag => <Button key={tag} variant="ghost" aria-pressed={amenities.includes(tag)} onClick={() => setAmenities(previous => previous.includes(tag) ? previous.filter(value => value !== tag) : [...previous, tag])}>{tag}</Button>)}</div></>}
        {sheet === 'socials' && <>{SOCIAL_PLATFORMS.map(({ field, label: name, placeholder, kind }) => <label className="be2-fld" key={field}><span>{field === 'twitter' ? 'X' : name}</span><input aria-label={field === 'twitter' ? 'X' : name} placeholder={placeholder} value={social[field]} onChange={event => setSocial(previous => ({ ...previous, [field]: kind === 'handle' ? event.target.value.replace(/^@+/, '') : event.target.value }))} /></label>)}<p className="be4-helper">Leave any empty to hide it.</p></>}
      </div>
    </BizcSheet>}
  </>;
}