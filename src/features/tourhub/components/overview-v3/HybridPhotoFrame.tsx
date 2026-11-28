/** Overview-only photo/card material. PhotoBand and its tournament consumers
 * retain their geometry; image readiness still belongs to the overview gate. */
import { useEffect, useState, type ReactNode } from 'react';
import { HERO_CONTENT_TOP, HERO_CONTENT_BOTTOM } from '@/lib/heroHeights';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useOverviewBandReady } from './overviewShells';
import { PhotoBandFade } from './HybridHeroBands/photoBandMaterial';
import '@/styles/tour-overview-hybrid.css';

export interface HybridCardData {
  label: string; name: string; sub?: string | null; figure?: ReactNode; unit?: string | null;
  under?: boolean; champion?: boolean;
  faces?: Array<{ key: string; name: string; candidates: string[] }>;
}
export function HybridGlassCard({ card }: { card: HybridCardData }) {
  return <div className="ov48-glass" data-overview-glass-card>
    <div className="ov48-glass-left">
      {card.faces?.length ? <div className="ov48-faces" data-overview-card-faces>{card.faces.slice(0, 3).map(face => <span key={face.key} className="ov48-face"><SquircleAvatar size={48} srcCandidates={face.candidates} alt={face.name} userId={face.key} hideRing /></span>)}</div> : null}
      <div className="ov48-glass-copy"><div className={card.champion ? 'ov48-glass-label ov48-gold' : 'ov48-glass-label'}>{card.label}</div><div className="ov48-glass-name">{card.name}</div>{card.sub ? <div className="ov48-glass-sub">{card.sub}</div> : null}</div>
    </div>
    {card.figure != null ? <div className={card.under ? 'ov48-glass-figure ov48-under' : 'ov48-glass-figure'}>{card.figure}{card.unit ? <span className="ov48-glass-unit">{card.unit}</span> : null}</div> : null}
  </div>;
}
export function HybridPhotoFrame({ title, kicker, tone = 'dim', venue, image, card, footer, onOpen, stateKey }: { title: string; kicker: string; tone?: 'live' | 'suspended' | 'dim'; venue?: string | null; image: string | null; card?: ReactNode; footer?: ReactNode; onOpen: () => void; stateKey: string }) {
  const [ready, setReady] = useState(!image);
  useEffect(() => {
    if (!image) { setReady(true); return; }
    setReady(false); const img = new Image();
    img.onload = img.onerror = () => setReady(true); img.src = image;
    return () => { img.onload = null; img.onerror = null; };
  }, [image]);
  useOverviewBandReady('photoImage', ready);
  return <div className="ov48-photo" style={{ paddingTop: HERO_CONTENT_TOP, paddingBottom: HERO_CONTENT_BOTTOM }} data-overview-photo-band data-overview-photo-state={stateKey} role="button" tabIndex={0} aria-label={title} onClick={onOpen} onKeyDown={event => {
    if (event.key === 'Enter') onOpen();
    if (event.key === ' ') { event.preventDefault(); onOpen(); }
  }}>
    {image ? <img className="ov48-photo-image" src={image} alt="" /> : null}<PhotoBandFade />
    <div className="ov48-photo-content" data-overview-photo-text>
      <div className={`ov48-kicker ov48-kicker-${tone}`} data-overview-photo-kicker-row>{tone === 'live' ? <i className="ov48-live-dot" aria-hidden /> : null}{kicker}</div>
      <h1 className="ov48-title">{title}</h1>
      {venue ? <div className="ov48-venue">{venue}</div> : null}{card}{footer}
    </div>
  </div>;
}