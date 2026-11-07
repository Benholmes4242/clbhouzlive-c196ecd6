import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import BottomSheet from '../BottomSheet';
import { CREDIT_ROLES, detectVideoLink, VIDEO_LIMITS, type CreditRole, type VideoCredit, type VideoThanks, type VideoLink } from '../../lib/videoDetails';
import { searchCreditPeople, searchVideoBusinesses, type CreditPerson } from '../../lib/videoDetailsSearch';
export type VideoAddKind = 'credits' | 'links' | 'thanks' | 'gear';
export function VideoDetailsSheets({ kind, credits, thanks, onClose, onCredit, onLink, onThanks, onGear, peopleSearch = searchCreditPeople, businessSearch = searchVideoBusinesses }: {
  kind: VideoAddKind | null; credits: VideoCredit[]; thanks: VideoThanks[]; onClose: () => void;
  onCredit: (credit: VideoCredit) => void; onLink: (link: VideoLink) => void; onThanks: (business: VideoThanks) => void; onGear: (gear: string) => void;
  peopleSearch?: typeof searchCreditPeople; businessSearch?: typeof searchVideoBusinesses;
}) {
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState<CreditPerson[]>([]);
  const [businesses, setBusinesses] = useState<VideoThanks[]>([]);
  const [person, setPerson] = useState<CreditPerson | null>(null);
  const [business, setBusiness] = useState<VideoThanks | null>(null);
  const [role, setRole] = useState<CreditRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => { setQuery(''); setPerson(null); setBusiness(null); setRole(null); setPeople([]); setBusinesses([]); setError(false); }, [kind]);
  useEffect(() => {
    if ((kind !== 'credits' && kind !== 'thanks') || !query.trim()) { setPeople([]); setBusinesses([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true); setError(false);
    const timer = setTimeout(() => { void (async () => {
      try { if (kind === 'credits') { const rows = await peopleSearch(query); if (!cancelled) setPeople(rows); } else { const rows = await businessSearch(query); if (!cancelled) setBusinesses(rows); } }
      catch { if (!cancelled) { setError(true); setPeople([]); setBusinesses([]); } }
      finally { if (!cancelled) setLoading(false); }
    })(); }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, kind, peopleSearch, businessSearch]);
  const link = detectVideoLink(query);
  const title = kind === 'credits' ? 'Add a credit' : kind === 'links' ? 'Add a link' : kind === 'thanks' ? 'Add a club or brand' : 'Add gear';
  const disabled = kind === 'credits' ? !person || !role || credits.length >= VIDEO_LIMITS.credits || credits.some(c => c.id === person.id) : kind === 'thanks' ? !business || thanks.length >= VIDEO_LIMITS.thanks || thanks.some(b => b.id === business.id) : kind === 'links' ? !link : !query.trim();
  const add = () => {
    if (disabled) return;
    if (kind === 'credits' && person && role) onCredit({ id: person.id, name: person.name, avatarUrl: person.avatarUrl, role });
    if (kind === 'thanks' && business) onThanks(business);
    if (kind === 'links' && link) onLink({ url: link.url, label: link.label });
    if (kind === 'gear') onGear(query.trim());
    onClose();
  };
  return <BottomSheet open={kind !== null} title={title} onClose={onClose} surfaceClassName="vc-sheet-surface">
    <div className="video-creator vc-sheet" role="dialog" aria-label={title}>
      <input className="vc-search" aria-label={kind === 'credits' ? 'Search people' : kind === 'thanks' ? 'Search businesses' : kind === 'links' ? 'Link address' : 'Gear'} placeholder={kind === 'links' ? 'https://' : kind === 'gear' ? 'Gear in this video' : 'Search'} value={query} maxLength={kind === 'gear' ? 60 : kind === 'links' ? 300 : undefined} onChange={e => setQuery(e.target.value)} />
      {loading && <div className="vc-note" role="status">Searching…</div>}{error && <div className="vc-note" role="alert">Could not search. Try again.</div>}
      {!loading && !error && query.trim() && (kind === 'credits' ? people.length === 0 : kind === 'thanks' ? businesses.length === 0 : false) && <div className="vc-note">No matches</div>}
      {kind === 'credits' && <><div>{people.map(p => { const existing = credits.find(c => c.id === p.id); return <Button key={p.id} variant="ghost" className="vc-result" disabled={!!existing} aria-pressed={person?.id === p.id} onClick={() => setPerson(p)}><SquircleAvatar size={36} src={p.avatarUrl} alt={p.name} userId={p.id} hairlineRing /><span className="vc-grow"><b>{p.name}</b><span className="vc-small">{[p.username ? `@${p.username}` : null, p.homeClub].filter(Boolean).join(' · ')}</span></span>{existing ? <span className="vc-role">{CREDIT_ROLES.find(([key]) => key === existing.role)?.[1]}</span> : person?.id === p.id ? <span className="vc-tick"><Check size={14} /></span> : null}</Button>; })}</div>
        <div className="vc-kicker" style={{ marginTop: 18 }}>THEIR ROLE</div><div className="vc-roles">{CREDIT_ROLES.map(([key, label]) => <Button key={key} variant="ghost" className="vc-chip" aria-pressed={role === key} data-filled={role === key} onClick={() => setRole(key)}>{label}</Button>)}</div></>}
      {kind === 'thanks' && <div>{businesses.map(b => <Button key={b.id} variant="ghost" className="vc-result" disabled={thanks.some(existing => existing.id === b.id)} aria-pressed={business?.id === b.id} onClick={() => setBusiness(b)}><SquircleAvatar size={36} src={b.logoUrl} alt={b.name} userId={b.id} hairlineRing /><span className="vc-grow"><b>{b.name}</b><span className="vc-small">{b.category}</span></span>{business?.id === b.id && <span className="vc-tick"><Check size={14} /></span>}</Button>)}</div>}
      {kind === 'links' && link && <div className="vc-list-row"><span className="vc-glyph">{link.glyph}</span><span className="vc-grow">{link.label}</span></div>}
      {kind === 'links' && query && !link && <div className="vc-note" role="alert">Enter a valid https address.</div>}
      {kind === 'gear' && <div className="vc-count">{query.length}/60</div>}
      <Button className="vc-sheet-action" disabled={disabled} onClick={add}>{kind === 'credits' ? 'ADD CREDIT' : kind === 'links' ? 'ADD LINK' : kind === 'thanks' ? 'ADD' : 'ADD GEAR'}</Button>
      {kind === 'credits' && person && <div className="vc-sheet-note">{person.name.trim().split(/\s+/)[0]} is notified when the video goes live.</div>}
    </div>
  </BottomSheet>;
}