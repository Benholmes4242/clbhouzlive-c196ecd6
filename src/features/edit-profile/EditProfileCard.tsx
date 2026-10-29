/** EP1 profile card (1A) plus the photo flows (1B–1D). Photos save one field
 * at a time through the parent's onSavePhoto; this file owns only the picker,
 * the crop source and the change-or-remove sheet. */
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { WelcomeCropper } from '@/features/onboarding/WelcomeCropper';
import { BizcSheet } from '@/features/business-create/BusinessCreateStep3';
import { AVATAR_CROP_ASPECT, PERSONAL_COVER_ASPECT, PERSONAL_COVER_ASPECT_CSS } from '@/lib/tokens/coverAspect';
import { toast } from '@/lib/toast';

export type PhotoKind = 'cover' | 'avatar';
interface Props {
  name: string;
  username: string;
  city: string;
  coverUrl: string | null;
  avatarUrl: string | null;
  indexLabel: string | null;
  homeClub: string | null;
  onSavePhoto: (kind: PhotoKind, file: File | null) => void;
}

export function identityLine(username: string, city: string) {
  const c = city.trim();
  return c ? `@${username} · ${c}` : `@${username}`;
}

export interface PhotoActions { open: (kind: PhotoKind) => void }
export const EditProfileCard = forwardRef<PhotoActions, Props>(function EditProfileCard({ name, username, city, coverUrl, avatarUrl, indexLabel, homeClub, onSavePhoto }, ref) {
  const coverInput = useRef<HTMLInputElement>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const [sheet, setSheet] = useState<PhotoKind | null>(null);
  const [crop, setCrop] = useState<{ kind: PhotoKind; url: string } | null>(null);
  useEffect(() => { const url = crop?.url; return () => { if (url) URL.revokeObjectURL(url); }; }, [crop?.url]);

  const pick = (kind: PhotoKind) => { setSheet(null); (kind === 'cover' ? coverInput : avatarInput).current?.click(); };
  const open = (kind: PhotoKind) => { if (kind === 'cover' ? coverUrl : avatarUrl) setSheet(kind); else pick(kind); };
  useImperativeHandle(ref, () => ({ open }));
  const picked = (kind: PhotoKind, input: HTMLInputElement) => {
    const file = input.files?.[0]; input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Choose a photo.'); return; }
    setCrop({ kind, url: URL.createObjectURL(file) });
  };

  return <>
    <div className="ep-card" data-testid="ep-card">
      <button type="button" className="ep-cover" data-testid="ep-cover" aria-label="Edit cover" style={{ aspectRatio: PERSONAL_COVER_ASPECT_CSS }} onClick={() => open('cover')}>
        {coverUrl ? <><img src={coverUrl} alt="" /><span className="ep-cover-fade" /></> : null}
        <span className="ep-edit-chip" aria-hidden="true"><Camera size={14} strokeWidth={2} />Edit cover</span>
      </button>
      <div className="ep-identity">
        <button type="button" className="ep-avatar" aria-label={avatarUrl ? 'Change photo' : 'Add a photo'} data-testid="ep-avatar" onClick={() => open('avatar')}>
          <span aria-hidden="true" style={{ display: 'inline-flex' }}><SquircleAvatar size={76} src={avatarUrl} alt={name} hairlineRing ringWidth={1} className="ep-avatar-face" /></span>
          <span className="ep-avatar-badge" aria-hidden="true">+</span>
        </button>
        <div className="ep-name" data-testid="ep-name">{name}</div>
        <div className="ep-line" data-testid="ep-line">{identityLine(username, city)}</div>
        {(indexLabel || homeClub) && <div className="ep-tags">
          {indexLabel && <span className="ep-tag" data-testid="ep-index-tag"><b>{indexLabel}</b> Index</span>}
          {homeClub && <span className="ep-tag ep-tag-club" data-testid="ep-club-tag">{homeClub}</span>}
        </div>}
      </div>
    </div>
    <input ref={coverInput} type="file" accept="image/*" hidden data-testid="ep-cover-picker" onChange={e => picked('cover', e.currentTarget)} />
    <input ref={avatarInput} type="file" accept="image/*" hidden data-testid="ep-avatar-picker" onChange={e => picked('avatar', e.currentTarget)} />
    {sheet && <BizcSheet title={sheet === 'cover' ? 'Cover photo' : 'Photo'} hideHeader testId="ep-photo-actions" onDone={() => setSheet(null)}>
      <Button variant="ghost" className="bizc-photo-action" onClick={() => pick(sheet)}>Choose another photo</Button>
      <Button variant="ghost" className="bizc-photo-action destructive" onClick={() => { const kind = sheet; setSheet(null); onSavePhoto(kind, null); }}>{sheet === 'cover' ? 'Remove cover photo' : 'Remove photo'}</Button>
      <Button variant="ghost" className="bizc-textbtn" onClick={() => setSheet(null)}>Cancel</Button>
    </BizcSheet>}
    {crop && <WelcomeCropper
      image={crop.url}
      aspect={crop.kind === 'cover' ? PERSONAL_COVER_ASPECT : AVATAR_CROP_ASPECT}
      frameShape={crop.kind === 'cover' ? 'square' : 'squircle'}
      subtitle={crop.kind === 'cover' ? 'The top of your profile' : 'This is how golfers will see you'}
      onCancel={() => setCrop(null)}
      onUse={(file) => { const kind = crop.kind; setCrop(null); onSavePhoto(kind, file); }}
    />}
  </>;
});
