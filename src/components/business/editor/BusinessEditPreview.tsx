/** BE2 owns edit-only preview, completion and sheet drafts. Parent alone saves
 * fields/media and advances the dirty baseline; creation keeps its old shell.
 * Edit identity prints stored categories, never creation-picker display labels. */
import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { BizcSheet } from '@/features/business-create/BusinessCreateStep3';
import { WelcomeCropper } from '@/features/onboarding/WelcomeCropper';
import { ABOUT_LIMIT, foundedYearError } from '@/features/business-create/step4Rules';
import { BUSINESS_COVER_ASPECT } from '@/lib/tokens/coverAspect';
import { type PrimaryActionKey } from './editorTypes';
import { businessSecondPill, type SecondInput } from '@/lib/business/businessHero';
import { businessCompletion, type BusinessCompletionInput, type BusinessCompletionKey } from './businessCompletion';
import { toast } from '@/lib/toast';

export type BusinessIdentityField = 'name' | 'description' | 'founded_year';
export type BusinessPhotoKind = 'logo' | 'cover';
interface Props {
  name: string; category: string; city: string; primaryAction: PrimaryActionKey | null;
  actionData?: SecondInput;
  completion: BusinessCompletionInput; clubLinked: boolean; editor: boolean; busy: boolean;
  onSave: (key: BusinessIdentityField, value: string | number | null) => Promise<boolean>;
  onPhoto: (kind: BusinessPhotoKind, file: File | null) => Promise<boolean>;
  onFocusLegacy: (key: BusinessCompletionKey) => void;
}
export function BusinessEditPreview(props: Props) {
  const { completion, name, category, city, primaryAction, clubLinked, editor, busy } = props;
  const [sheet, setSheet] = useState<BusinessCompletionKey | 'name' | null>(null);
  const [draft, setDraft] = useState('');
  const [crop, setCrop] = useState<{ kind: BusinessPhotoKind; url: string } | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  useEffect(() => { const url = crop?.url; return () => { if (url) URL.revokeObjectURL(url); }; }, [crop?.url]);
  const result = businessCompletion(completion);
  const label = category;
  const actionLabel = businessSecondPill({ category, primary_action: primaryAction, website: completion.website, phone: completion.phone, lat: completion.lat, lng: completion.lng, ...props.actionData }, (_key, fallback) => fallback)?.label;
  const open = (key: BusinessCompletionKey | 'name') => {
    if (busy) return;
    if (['address', 'phone', 'website', 'hours'].includes(key)) { props.onFocusLegacy(key as BusinessCompletionKey); return; }
    setDraft(key === 'name' ? name : key === 'about' ? completion.description : key === 'established' ? completion.foundedYear : '');
    setSheet(key);
  };
  const choose = (kind: BusinessPhotoKind) => { setSheet(null); (kind === 'logo' ? logoInput : coverInput).current?.click(); };
  const picked = (kind: BusinessPhotoKind, input: HTMLInputElement) => {
    const file = input.files?.[0]; input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Choose a photo.'); return; }
    setCrop({ kind, url: URL.createObjectURL(file) });
  };
  const save = async () => {
    const key = sheet === 'name' ? 'name' : sheet === 'about' ? 'description' : 'founded_year';
    const value = key === 'name' ? draft.trim() : key === 'description' ? draft || null : draft ? Number(draft) : null;
    if (await props.onSave(key, value)) setSheet(null);
  };
  const row = (title: string, value: string, key: 'name' | 'about' | 'established' | null, reason?: string) => {
    const content = <><span className="ep-row-label">{title}</span><span className={`ep-row-value${key === 'about' ? ' two' : ''}${!value ? ' placeholder' : ''}`}>{value || (key === 'about' ? 'Add an about' : 'Add a year')}{reason && <span className="be2-lock"> · {reason}</span>}</span>{key && !reason && <ChevronRight aria-hidden="true" size={18} />}</>;
    return key && !reason ? <Button type="button" variant="ghost" className="ep-row" disabled={busy} onClick={() => open(key)}>{content}</Button> : <div className="ep-row be2-readonly">{content}</div>;
  };
  const photoSheet = sheet === 'logo' || sheet === 'cover' ? sheet : null;
  const title = sheet === 'name' ? 'Name' : sheet === 'about' ? 'About' : 'Established';
  return <>
    <section className="be2-top-section">
      <div className="be2-top">
        <Button type="button" variant="ghost" className="be2-cover" disabled={busy} aria-label={completion.cover ? 'Edit cover' : 'Add cover'} onClick={() => open('cover')}>
          {completion.cover && <img src={completion.cover} alt="" />}<span className="be2-cover-chip">{completion.cover ? 'Edit cover' : 'Add cover'}</span>
        </Button>
        <div className="be2-identity">
          <Button type="button" variant="ghost" className="be2-logo" disabled={busy} aria-label={completion.logo ? 'Edit logo' : 'Add a logo'} onClick={() => open('logo')}>
            <span aria-hidden="true"><SquircleAvatar src={completion.logo} alt={name} size={68} hairlineRing ringWidth={1} surface="canvas" /></span><span className="be2-plus" aria-hidden="true"><Plus size={13} /></span>
          </Button>
          <h1 className="be2-name">{name}</h1><div className="be2-line">{label}{city ? ` · ${city}` : ''}</div>
          <div className="be2-preview">{actionLabel && <span className="be2-action">{actionLabel}</span>}<span className="be2-follow">Follow</span><small>What golfers see</small></div>
        </div>
      </div>
      {result.remaining > 0 && <div className="be2-completion" data-testid="be2-completion">
        <h2>{result.remaining} {result.remaining === 1 ? 'thing' : 'things'} left</h2><p>Golfers act on a profile they can trust.</p>
        <div className="be2-bars" aria-hidden="true">{result.done.map((done, i) => <i key={i} data-done={done} />)}</div>
        <div className="be2-chips">{result.missing.map(([key, text]) => <Button key={key} type="button" variant="ghost" disabled={busy} onClick={() => open(key)}>{text}</Button>)}</div>
      </div>}
      <h2 className="ep-group">Business</h2><div className="ep-rows be2-business">
        {row('Name', name, 'name', clubLinked ? 'from your club' : editor ? 'owners and admins' : undefined)}
        {row('Category', label, null, 'set when created')}
        {row('About', completion.description, 'about')}{row('Established', completion.foundedYear, 'established')}
      </div>
    </section>
    <input ref={logoInput} type="file" accept="image/*" hidden data-testid="be2-logo-picker" onChange={event => picked('logo', event.currentTarget)} />
    <input ref={coverInput} type="file" accept="image/*" hidden data-testid="be2-cover-picker" onChange={event => picked('cover', event.currentTarget)} />
    {photoSheet && <div className="be2-sheet-scope"><BizcSheet title={photoSheet === 'logo' ? 'Logo' : 'Cover'} hideHeader testId="be2-photo-actions" onDone={() => setSheet(null)}>
      <div className="be2-sheet-content"><Button type="button" variant="ghost" className="be2-photo-action" onClick={() => choose(photoSheet)}>Choose a photo</Button>
        {completion[photoSheet] && <Button type="button" variant="ghost" className="be2-photo-action destructive" disabled={busy} onClick={async () => { if (await props.onPhoto(photoSheet, null)) setSheet(null); }}>Remove {photoSheet}</Button>}
      </div>
    </BizcSheet></div>}
    {sheet && !photoSheet && <BizcSheet title={title} testId="be2-identity-sheet" onDone={() => setSheet(null)} onAction={() => void save()} actionDisabled={busy || (sheet === 'name' ? !draft.trim() : sheet === 'established' ? !!foundedYearError(draft) : false)}>
      <div className="be2-sheet-content">
        {sheet === 'about' ? <><div className="be2-fld"><textarea aria-label="About" value={draft} maxLength={ABOUT_LIMIT} onChange={event => setDraft(event.target.value.slice(0, ABOUT_LIMIT))} /></div><div className="be2-about-foot"><span>Facilities, coaching style, atmosphere, events, or what makes you different.</span><span>{draft.length.toLocaleString('en-GB')} / 2,500</span></div></> : <><label className="be2-fld"><span>{sheet === 'name' ? 'Business name' : 'Year'}</span><input aria-label={sheet === 'name' ? 'Business name' : 'Year'} inputMode={sheet === 'established' ? 'numeric' : 'text'} value={draft} onChange={event => setDraft(sheet === 'established' ? event.target.value.replace(/\D/g, '').slice(0, 4) : event.target.value)} /></label><p className="be2-helper">{sheet === 'name' ? 'Shown on your profile and in search.' : 'Shown on your About tab.'}</p></>}
      </div>
    </BizcSheet>}
    {crop && <WelcomeCropper image={crop.url} aspect={crop.kind === 'cover' ? BUSINESS_COVER_ASPECT : 1} frameShape={crop.kind === 'cover' ? 'square' : 'squircle'} appearance="business" subtitle={crop.kind === 'cover' ? 'This is the top of your profile' : 'Your logo, as golfers will see it'} hint="Pinch to zoom, drag to position" onCancel={() => setCrop(null)} onUse={file => { const kind = crop.kind; setCrop(null); void props.onPhoto(kind, file); }} />}
  </>;
}