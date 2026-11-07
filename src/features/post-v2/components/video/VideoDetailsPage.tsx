/** Full-page Details shares composer state; Back and Done never roll back edits.
 * Viewer descriptions and playback remain outside this creator-only module. */
import { useRef, useState } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { MentionsComposerInput } from '@/components/mentions/MentionsComposerInput';
import { ShareFooter } from '../golf/ShareFooter';
import { GP } from '../golf/golfPageTokens';
import { CREDIT_ROLES, detectVideoLink, VIDEO_LIMITS, type VideoDetails } from '../../lib/videoDetails';
import { VideoDetailsSheets, type VideoAddKind } from './VideoDetailsSheets';
import './videoCreator.css';
export function VideoDetailsPage({ details, description, long, userId, onChange, onDescription, onBack }: { details: VideoDetails; description: string; long: boolean; userId: string | null; onChange: (patch: Partial<VideoDetails>) => void; onDescription: (value: string) => void; onBack: () => void }) {
  const [addKind, setAddKind] = useState<VideoAddKind | null>(null);
  const sections = useRef<Partial<Record<VideoAddKind, HTMLElement | null>>>({});
  const counts = { credits: details.credits.length, links: details.links.length, thanks: details.thanks.length, gear: details.gear.length };
  const headings: Record<VideoAddKind, [string, string, string, string]> = { credits: ['CREDITS', 'Up to 10', 'Credits', '+ Add a credit'], links: ['LINKS', 'Up to 5', 'Links', '+ Add a link'], thanks: ['THANKS TO', 'A club or brand', 'Thanks to a club or brand', '+ Add a club or brand'], gear: ['GEAR IN THIS VIDEO', 'Optional', 'Gear in this video', '+ Add gear'] };
  const remove = (kind: VideoAddKind, index: number) => { if (kind === 'credits') onChange({ credits: details.credits.filter((_, i) => i !== index) }); if (kind === 'links') onChange({ links: details.links.filter((_, i) => i !== index) }); if (kind === 'thanks') onChange({ thanks: details.thanks.filter((_, i) => i !== index) }); if (kind === 'gear') onChange({ gear: details.gear.filter((_, i) => i !== index) }); };
  const removeButton = (kind: VideoAddKind, index: number, label: string) => <Button variant="ghost" className="vc-remove" aria-label={`Remove ${label}`} onClick={() => remove(kind, index)}><X size={15} /></Button>;
  return <div className="video-creator vc-details" role="dialog" aria-label="Video Details">
    <header className="vc-top"><div className="vc-top-row"><Button variant="ghost" className="vc-back" aria-label="Back to composer" onClick={onBack}><ChevronLeft size={22} /></Button><span>Details</span><span /></div></header>
    <div className="vc-scroll"><div className="vc-description-top"><span className="vc-kicker">DESCRIPTION</span><div className="vc-box vc-description-input"><MentionsComposerInput value={description} onChange={onDescription} currentUserId={userId} placeholder="Description" textStyle={{ fontSize: 14, lineHeight: 1.5, minHeight: 150, padding: '0', color: GP.mute }} /></div>
      <div className="vc-hint">{long ? 'Timestamps turn into chapters. ' : ''}@names link to profiles. Links work. No limit.</div>
      <div className="vc-chips">{(Object.keys(headings) as VideoAddKind[]).map(kind => <Button key={kind} variant="ghost" className="vc-chip" data-filled={counts[kind] > 0} onClick={() => sections.current[kind]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>{headings[kind][2]}{counts[kind] > 0 ? ` · ${counts[kind]}` : kind === 'credits' || kind === 'links' ? ' · 0' : ''}</Button>)}</div>
    </div>
    {(Object.keys(headings) as VideoAddKind[]).map(kind => <section key={kind} className="vc-section" data-video-section={kind} ref={element => { sections.current[kind] = element; }}><div className="vc-heading"><span className="vc-kicker">{headings[kind][0]}</span><span className="vc-note">{headings[kind][1]}</span></div><div className="vc-box">
      {kind === 'credits' && details.credits.map((c, i) => <div className="vc-list-row" key={c.id}><SquircleAvatar size={30} src={c.avatarUrl} alt={c.name} userId={c.id} hairlineRing /><span className="vc-grow">{c.name}</span><span className="vc-role">{CREDIT_ROLES.find(([key]) => key === c.role)?.[1]}</span>{removeButton(kind, i, c.name)}</div>)}
      {kind === 'links' && details.links.map((link, i) => <div className="vc-list-row" key={`${link.url}-${i}`}><span className="vc-glyph">{detectVideoLink(link.url)?.glyph ?? 'WEB'}</span><span className="vc-grow">{link.label}<span className="vc-small">{link.url.replace(/^https:\/\//, '')}</span></span>{removeButton(kind, i, link.label)}</div>)}
      {kind === 'thanks' && details.thanks.map((b, i) => <div className="vc-list-row" key={b.id}><SquircleAvatar size={30} src={b.logoUrl} alt={b.name} userId={b.id} hairlineRing /><span className="vc-grow">{b.name}<span className="vc-small">{b.category}</span></span>{removeButton(kind, i, b.name)}</div>)}
      {kind === 'gear' && details.gear.map((gear, i) => <div className="vc-list-row" key={`${gear}-${i}`}><span className="vc-grow">{gear}</span>{removeButton(kind, i, gear)}</div>)}
      {counts[kind] < VIDEO_LIMITS[kind] && <Button variant="ghost" className="vc-add" onClick={() => setAddKind(kind)}>{headings[kind][3]}</Button>}
    </div></section>)}
    </div>
    <ShareFooter label="DONE" subLine="" disabled={false} busy={false} onShare={onBack} />
    <VideoDetailsSheets kind={addKind} credits={details.credits} thanks={details.thanks} onClose={() => setAddKind(null)} onCredit={credit => { if (details.credits.length < 10 && !details.credits.some(c => c.id === credit.id)) onChange({ credits: [...details.credits, credit] }); }} onLink={link => { if (details.links.length < 5) onChange({ links: [...details.links, link] }); }} onThanks={business => { if (details.thanks.length < 3 && !details.thanks.some(b => b.id === business.id)) onChange({ thanks: [...details.thanks, business] }); }} onGear={gear => { if (details.gear.length < 10) onChange({ gear: [...details.gear, gear] }); }} />
  </div>;
}