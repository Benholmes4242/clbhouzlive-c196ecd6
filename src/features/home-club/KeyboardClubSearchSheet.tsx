/** Editor-only club presentation; canonical search and selection hooks retain
 * authority. A row chooses a candidate, never saves before confirmation. Callback
 * callers save themselves; default callers use the canonical home-club mutation. */
import { useEffect, useState } from 'react';
import { ChevronLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RequestCourseCTA } from '@/components/courses/RequestCourseCTA';
import KeyboardSearchSheet from '@/features/composer-flow/KeyboardSearchSheet';
import { useHomeClubSearch, type HomeClubHit } from './useHomeClubSearch';
import { useSetHomeClub } from './useSetHomeClub';

export function KeyboardClubSearchSheet(p: { open: boolean; onClose: () => void; onSelected?: (club: { id: string; name: string }) => void; pendingName?: string | null }) {
  const [query, setQuery] = useState('');
  const [candidate, setCandidate] = useState<HomeClubHit | null>(null);
  const results = useHomeClubSearch(query);
  const setter = useSetHomeClub();
  useEffect(() => { if (!p.open) { setQuery(''); setCandidate(null); } }, [p.open]);
  const place = (club: HomeClubHit) => [club.sub_country, club.region].filter(Boolean).join(' · ');
  const confirm = async () => {
    if (!candidate || setter.isPending) return;
    const club = { id: candidate.id, name: candidate.name };
    if (p.onSelected) p.onSelected(club);
    else await setter.mutateAsync(club);
    p.onClose();
  };
  return <KeyboardSearchSheet mode="club" open={p.open} onClose={p.onClose} title="Home club" closeLabel="Close" clearLabel="Clear search" placeholder="Search clubs" query={query} onQueryChange={value => { setQuery(value); setCandidate(null); }} testId="ep-sheet-homeClub">
    {candidate ? <div className="rcs-section">
      <Button variant="ghost" className="rcs-row" onClick={() => setCandidate(null)}><ChevronLeft size={16} />Back to search</Button>
      <p>Set this as your home club?</p>
      <div className="rcs-row"><MapPin size={18} /><span className="rcs-text"><b className="rcs-name">{candidate.name}</b><span className="rcs-place">{place(candidate)}</span></span></div>
      <p>This appears on your profile. You can change it at any time.</p>
      <Button variant="ghost" className="rcs-row" disabled={setter.isPending} onClick={() => void confirm()}>{setter.isPending ? 'Saving…' : 'Confirm home club'}</Button>
    </div> : <>
      {p.pendingName && <p className="rcs-count">We're adding this club — you'll be connected automatically.</p>}
      {query.trim().length < 2 ? null : results.loading ? <p className="rcs-count">Searching…</p> : results.error ? <p className="rcs-count" role="alert">{results.error}</p> : results.data.length === 0 ? <RequestCourseCTA variant="hero" tone="dark" prefillName={query.trim()} homeClub onBeforeOpen={p.onClose} /> : results.data.map(club => <Button key={club.id} variant="ghost" className="rcs-row" data-club={club.id} onClick={() => setCandidate(club)}><MapPin size={18} /><span className="rcs-text"><b className="rcs-name">{club.name}</b><span className="rcs-place">{place(club)}</span></span></Button>)}
    </>}
  </KeyboardSearchSheet>;
}