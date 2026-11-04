/**
 * BRIEF 1 §2 — ProDetailsSheet, shared by sign-up (Welcome screen 1) and
 * Edit profile. Layout and copy follow the signed-off Pro details tab.
 * Submit goes through request_pro_verification, withdraw through
 * withdraw_pro_verification; the sheet never writes profile columns itself.
 * RPC errors surface as toasts carrying the RPC's own message.
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { useMyProStatus, useInvalidateMyProStatus } from './useMyProStatus';
import {
  EMPTY_PRO_DRAFT, OTHER_TOUR, PRO_PGA_BODIES, PRO_TOUR_CHIPS,
  proDraftFromRequest, proDraftValid, proRequestArgs,
  type ProDetailsDraft,
} from './proRules';
import './pro-verification.css';

export type ProSheetOutcome = 'sent' | 'withdrawn' | 'closed';

export function ProDetailsSheet({ userId, open, onClose }: {
  userId: string;
  open: boolean;
  onClose: (outcome: ProSheetOutcome) => void;
}) {
  const pro = useMyProStatus(userId);
  const invalidate = useInvalidateMyProStatus();
  const [draft, setDraft] = useState<ProDetailsDraft>(EMPTY_PRO_DRAFT);
  const [busy, setBusy] = useState(false);

  /* §2 — reopening with a pending or declined request prefills every field. */
  useEffect(() => {
    if (!open) return;
    setDraft(pro.request && (pro.pending || pro.declined) ? proDraftFromRequest(pro.request) : EMPTY_PRO_DRAFT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const set = <K extends keyof ProDetailsDraft>(key: K, value: ProDetailsDraft[K]) =>
    setDraft(d => ({ ...d, [key]: value }));
  const valid = proDraftValid(draft);
  const isTour = draft.kind === 'tour_pro';

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    const { error } = await supabase.rpc('request_pro_verification', proRequestArgs(draft));
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast('Request sent');
    invalidate(userId);
    onClose('sent');
  };

  const withdraw = async () => {
    if (busy) return;
    setBusy(true);
    const { error } = await supabase.rpc('withdraw_pro_verification');
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    invalidate(userId);
    onClose('withdrawn');
  };

  return createPortal(
    <div className="pds-root" role="dialog" aria-modal="true" aria-labelledby="pds-title" data-pro-details-sheet>
      <button type="button" className="pds-dim" aria-label="Close" onClick={() => onClose('closed')} />
      <div className="pds-sheet">
        <div className="pds-grab" aria-hidden="true" />
        <div className="pds-head">
          <div className="pds-kicker">GOLF PROFESSIONAL</div>
          <h2 id="pds-title">Tell us about your golf</h2>
          <p>We check every request by hand, usually within a day. Until then your profile shows as a standard member.</p>
        </div>
        <div className="pds-body">
          <div className="pds-kinds">
            <button type="button" className={`pds-kind${isTour ? ' on' : ''}`} aria-pressed={isTour} onClick={() => set('kind', 'tour_pro')}>
              <b>Tour professional</b><span>You play on a professional tour</span>
            </button>
            <button type="button" className={`pds-kind${!isTour ? ' on' : ''}`} aria-pressed={!isTour} onClick={() => set('kind', 'teaching_pro')}>
              <b>Teaching professional</b><span>You coach as a PGA professional</span>
            </button>
          </div>

          {isTour ? <>
            <div className="pds-label">WHICH TOUR</div>
            <div className="pds-chips">
              {PRO_TOUR_CHIPS.map(c => (
                <button key={c.label} type="button" className={`pds-chip${draft.tour === c.label ? ' on' : ''}`} aria-pressed={draft.tour === c.label} onClick={() => set('tour', c.label)}>{c.label}</button>
              ))}
            </div>
            {draft.tour === OTHER_TOUR && <>
              <div className="pds-label">WHICH TOUR</div>
              <input className="pds-inp" aria-label="Which tour" value={draft.otherTour} onChange={e => set('otherTour', e.target.value)} placeholder="Tour name" />
              <div className="pds-hint">Type the tour's name. We don't have results from every tour yet, so your tour rounds show on your profile once we connect with it.</div>
            </>}
            <div className="pds-label">YOUR TOUR PROFILE</div>
            <input className="pds-inp" aria-label="Your tour profile" value={draft.link} disabled={draft.noProfile} onChange={e => set('link', e.target.value)} placeholder="Link to your tour profile" />
            {!draft.noProfile && <div className="pds-hint">The page with your name on the tour's own site. It's how we check.</div>}
            <button type="button" className={`pds-cb${draft.noProfile ? ' on' : ''}`} aria-pressed={draft.noProfile} onClick={() => set('noProfile', !draft.noProfile)}>
              <span className="box">{draft.noProfile && <Check size={13} strokeWidth={3.5} />}</span>
              <span>I don't have a tour profile</span>
            </button>
            {draft.noProfile && <>
              <div className="pds-label">HOW CAN WE CHECK?</div>
              <textarea className="pds-inp" aria-label="How can we check" value={draft.howToCheck} onChange={e => set('howToCheck', e.target.value)} />
              <div className="pds-hint">Events you've played, your tour card, or anyone at the tour who can confirm it.</div>
            </>}
          </> : <>
            <div className="pds-label">YOUR PGA</div>
            <div className="pds-chips">
              {PRO_PGA_BODIES.map(b => (
                <button key={b} type="button" className={`pds-chip${draft.body === b ? ' on' : ''}`} aria-pressed={draft.body === b} onClick={() => set('body', b)}>{b}</button>
              ))}
            </div>
            <div className="pds-label">WHERE YOU COACH</div>
            <input className="pds-inp" aria-label="Where you coach" value={draft.club} onChange={e => set('club', e.target.value)} placeholder="Club or academy" />
            <input className="pds-inp" aria-label="Membership number" value={draft.membershipNumber} onChange={e => set('membershipNumber', e.target.value)} placeholder="Membership number (optional)" />
            <input className="pds-inp" aria-label="Link to your coaching page" value={draft.coachingLink} onChange={e => set('coachingLink', e.target.value)} placeholder="Link to your coaching page (optional)" />
            <div className="pds-hint">Your club or academy, as your PGA lists it. We check it against their directory.</div>
          </>}
        </div>
        <div className="pds-foot">
          <button type="button" className="pds-primary" disabled={!valid || busy} onClick={() => void submit()}>Request verification</button>
          {pro.pending && <button type="button" className="pds-text" disabled={busy} onClick={() => void withdraw()}>Withdraw request</button>}
          <div className="pds-fn">You can use clbhouz as normal while we check.</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
