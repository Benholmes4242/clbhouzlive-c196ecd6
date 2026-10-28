/** BC4 previews never upload: cropped files live in the parent draft until BC5.
 * Parent owns committed preview URLs across history; this step owns only the temporary crop source. */
import { useEffect, useRef, useState } from 'react';
import { Camera, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { emptyImage } from '@/components/business/editor/editorTypes';
import { WelcomeCropper } from '@/features/onboarding/WelcomeCropper';
import { BUSINESS_COVER_ASPECT } from '@/lib/tokens/coverAspect';
import { businessActionLabel } from '@/lib/business/businessHero';
import { toast } from '@/lib/toast';
import { BizcSheet } from './BusinessCreateStep3';
import { ABOUT_LIMIT, draftHeroIdentity, foundedYearError } from './step4Rules';
import type { BusinessCreateDraft } from './createRules';
import '@/styles/welcome.css';

type PhotoKind = 'cover' | 'logo';
interface Props { draft: BusinessCreateDraft; setDraft: (fn: (d: BusinessCreateDraft) => BusinessCreateDraft) => void; onFinish: () => void; creating?: boolean }

export function BusinessCreateStep4({ draft, setDraft, onFinish, creating = false }: Props) {
  const coverInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const aboutInput = useRef<HTMLTextAreaElement>(null);
  const [sheet, setSheet] = useState<PhotoKind | null>(null);
  const [crop, setCrop] = useState<{ kind: PhotoKind; url: string } | null>(null);
  const [yearBlurred, setYearBlurred] = useState(false);
  const identity = draftHeroIdentity(draft);
  const yearError = foundedYearError(draft.foundedYear);
  useEffect(() => {
    const url = crop?.url;
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [crop?.url]);
  useEffect(() => {
    const input = aboutInput.current;
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
  }, [draft.description]);

  const pick = (kind: PhotoKind) => { setSheet(null); (kind === 'cover' ? coverInput : logoInput).current?.click(); };
  const open = (kind: PhotoKind) => { if (draft[kind].localPreview || draft[kind].url) setSheet(kind); else pick(kind); };
  const picked = (kind: PhotoKind, input: HTMLInputElement) => {
    const file = input.files?.[0]; input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Choose a photo.'); return; }
    setCrop({ kind, url: URL.createObjectURL(file) });
  };
  const usePhoto = (file: File) => {
    if (!crop) return;
    const kind = crop.kind;
    const localPreview = URL.createObjectURL(file);
    setDraft(d => ({ ...d, [kind]: { ...emptyImage, pendingFile: file, localPreview } }));
    setCrop(null);
  };
  const finish = () => { setYearBlurred(true); if (!yearError) onFinish(); };
  const cover = draft.cover.localPreview ?? draft.cover.url;
  const logo = draft.logo.localPreview ?? draft.logo.url;
  return <>
    <main className="bizc-body" data-testid="bizc-step-4">
      <div className="bizc-kicker">Your profile</div><h1>Make it look like you.</h1>
      <div className="bizc-minihero">
        <Button variant="ghost" className="bizc-mini-cover" aria-label={cover ? 'Change cover photo' : 'Add a cover photo'} onClick={() => open('cover')}>
          {cover ? <><img src={cover} alt="" /><span className="bizc-mini-fade" /></> : <><Camera size={18} strokeWidth={1.8} aria-hidden="true" /><span>Add a cover photo</span></>}
        </Button>
        <div className="bizc-mini-identity">
          <Button variant="ghost" className="bizc-mini-crest" aria-label={logo ? 'Change logo' : 'Add a logo'} onClick={() => open('logo')}>
            {logo ? <img src={logo} alt="" /> : <Plus size={24} strokeWidth={1.8} aria-hidden="true" />}
          </Button>
          <div className="bizc-mini-name" data-testid="bizc-mini-name">{identity.name}</div>
          <div className="bizc-mini-place" data-testid="bizc-mini-place">{identity.line}</div>
          <div className="bizc-mini-pills">
            {draft.primaryAction && <span className="bizc-mini-pill" data-testid="bizc-mini-action">{businessActionLabel(draft.primaryAction, draft.category, (_k, fallback) => fallback)}</span>}
            <span className="bizc-mini-pill glass">Follow</span>
          </div>
        </div>
      </div>
      <label className="bizc-about">
        <span className="bizc-field-label">About<span className="bizc-about-count" data-testid="bizc-about-count">{draft.description.length} / {ABOUT_LIMIT}</span></span>
        <textarea ref={aboutInput} aria-label="About" rows={1} maxLength={ABOUT_LIMIT} value={draft.description} placeholder="Tell golfers what makes you different" onChange={e => setDraft(d => ({ ...d, description: e.target.value.slice(0, ABOUT_LIMIT) }))} />
      </label>
      <label className="bizc-field"><span className="bizc-field-label">Year founded</span>
        <input className="bizc-field-input" aria-label="Year founded" inputMode="numeric" maxLength={4} placeholder="Optional" value={draft.foundedYear} aria-invalid={yearBlurred && !!yearError} aria-describedby={yearBlurred && yearError ? 'bizc-year-error' : undefined} onChange={e => setDraft(d => ({ ...d, foundedYear: e.target.value.replace(/\D/g, '').slice(0, 4) }))} onBlur={() => setYearBlurred(true)} />
      </label>
      {yearBlurred && yearError && <p id="bizc-year-error" className="bizc-error" role="alert">{yearError}</p>}
      <input ref={coverInput} type="file" accept="image/*" hidden data-testid="bizc-cover-picker" onChange={e => picked('cover', e.currentTarget)} />
      <input ref={logoInput} type="file" accept="image/*" hidden data-testid="bizc-logo-picker" onChange={e => picked('logo', e.currentTarget)} />
    </main>
    <div className="bizc-foot"><Button variant="ghost" className="bizc-primary" disabled={creating} onClick={finish}>{creating ? 'Creating…' : 'Create my profile'}</Button></div>
    {sheet && <BizcSheet title={sheet === 'cover' ? 'Cover photo' : 'Logo'} hideHeader testId="bizc-photo-actions" onDone={() => setSheet(null)}>
      <Button variant="ghost" className="bizc-photo-action" onClick={() => pick(sheet)}>Choose another photo</Button>
      <Button variant="ghost" className="bizc-photo-action destructive" onClick={() => { const kind = sheet; setDraft(d => ({ ...d, [kind]: { ...emptyImage } })); setSheet(null); }}>{sheet === 'cover' ? 'Remove cover photo' : 'Remove logo'}</Button>
      <Button variant="ghost" className="bizc-textbtn" onClick={() => setSheet(null)}>Cancel</Button>
    </BizcSheet>}
    {crop && <WelcomeCropper image={crop.url} aspect={crop.kind === 'cover' ? BUSINESS_COVER_ASPECT : 1} frameShape={crop.kind === 'cover' ? 'square' : 'squircle'} appearance="business" subtitle={crop.kind === 'cover' ? 'This is the top of your profile' : 'Your logo, as golfers will see it'} hint="Pinch to zoom, drag to position" onCancel={() => setCrop(null)} onUse={usePhoto} />}
  </>;
}