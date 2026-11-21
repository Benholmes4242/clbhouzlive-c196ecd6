/** Owner completion is a view of the existing profile-keyed bag/partner/ask
 * queries, never an independent read or optimistic completion source. Shared
 * query keys deduplicate these observers with the sections below. Collection
 * panels replace one another through the existing sheet; Ask's explainer is
 * unchanged. All three successful reads are required, including on refetch. */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getGuestUser } from '@/features/guest/guestGateStore';
import { useProBag, useProPartners } from './useProCollections';
import { useProAnswers } from './useProAsk';
import { ProCollectionSections } from './ProCollectionSections';
import type { CollectionPanel } from './ProCollectionSheets';
import { ProAskSection } from './ProAskSection';
import { ProExplainerSheet } from './ProAskSheets';
import type { ProEvent } from './proProfileRules';

export function ProOwnerSections({ userId, owner, first, events, eventsReady, showCareer, viewerId }: {
  userId: string; owner: boolean; first: string; events: ProEvent[];
  eventsReady: boolean; showCareer: boolean; viewerId?: string;
}) {
  const bag = useProBag(userId), partners = useProPartners(userId), asks = useProAnswers(userId);
  const [panel, setPanel] = useState<CollectionPanel | null>(null);
  const [explainer, setExplainer] = useState(false);
  const canEdit = owner && !getGuestUser();
  const ready = bag.isSuccess && !bag.isError && partners.isSuccess && !partners.isError && asks.isSuccess && !asks.isError;
  const rows = [
    { key: 'bag', done: (bag.data?.length ?? 0) > 0, title: "What's in your bag", sub: 'Brands on clbhouz link to their page', open: () => setPanel({ kind: 'bag', mode: 'edit' }) },
    { key: 'partners', done: (partners.data?.length ?? 0) > 0, title: 'Your partners', sub: 'Sponsors show their logo and link', open: () => setPanel({ kind: 'partners', mode: 'edit' }) },
    { key: 'questions', done: asks.data?.enabled === true, title: 'Answer member questions', sub: 'You choose which to answer', open: () => setExplainer(true) },
  ];
  const done = rows.filter(row => row.done).length;
  return <>
    {canEdit && ready && done < 3 && <section className="pro-profile-section" data-pro-completion>
      <div className="pro-finish">
        <div className="pro-finish-header"><span>ONLY YOU SEE THIS</span><b data-pro-completion-count>{done} of 3 done</b></div>
        <h3>Finish your profile</h3>
        <p>Visitors only see what you add. Each takes a minute.</p>
        {rows.filter(row => !row.done).map(row => <Button key={row.key} variant={null} size={null} className="pro-finish-row" data-pro-completion-row={row.key} onClick={row.open}>
          <i aria-hidden>+</i><span className="pro-finish-main"><b>{row.title}</b><small>{row.sub}</small></span><span className="pro-finish-chevron" aria-hidden>›</span>
        </Button>)}
      </div>
    </section>}
    <ProCollectionSections userId={userId} owner={owner} first={first} events={events} eventsReady={eventsReady} showCareer={showCareer} panel={panel} onPanelChange={setPanel} />
    <ProAskSection userId={userId} owner={owner} first={first} viewerId={viewerId} />
    {canEdit && explainer && <ProExplainerSheet userId={userId} first={first} close={() => setExplainer(false)} />}
  </>;
}