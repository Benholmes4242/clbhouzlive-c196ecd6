/** Brief 24B B3: the owner's status card for a pending or rejected club,
 * directly under the hero action buttons. The rejected body quotes the latest
 * course_claim_requests.admin_note word for word. */
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import type { ListingStatus } from './listingStatus';

const INK = '#F8FAFC', MUTE = 'rgba(248,250,252,0.62)', DIM = 'rgba(248,250,252,0.42)', AMBER = '#F7931E';

export function useLatestClaimNote(businessId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['business-latest-claim-note', businessId],
    enabled: !!businessId && enabled,
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase.from('course_claim_requests').select('admin_note, created_at')
        .eq('business_id', businessId as string).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return (data as { admin_note: string | null } | null)?.admin_note ?? null;
    },
  });
}

const pillBtn = (filled: boolean): React.CSSProperties => ({
  flex: 1, height: 44, borderRadius: 999, fontSize: 14.5, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
  ...(filled ? { background: INK, color: '#0A0A0C', border: 0 } : { background: 'transparent', color: INK, border: '1px solid rgba(255,255,255,0.16)' }),
});

export function ListingStatusCard({ status, businessId, onFix, onDelete }: { status: Exclude<ListingStatus, 'live'>; businessId: string; onFix: () => void; onDelete: () => void }) {
  const { t } = useTranslation('profile');
  const k = (key: string, defaultValue: string) => t(`businessPending.${key}`, { defaultValue });
  const note = useLatestClaimNote(businessId, status === 'rejected');
  const pending = status === 'pending';
  const Icon = pending ? Clock : AlertCircle;
  return (
    <div data-testid="listing-status-card" data-status={status} style={{ margin: '16px 16px 0', background: '#16161A', border: `1px solid ${pending ? 'rgba(247,147,30,0.28)' : 'rgba(255,255,255,0.10)'}`, borderRadius: 22, padding: 16 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 12, flex: 'none', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', border: `1px solid ${pending ? 'rgba(247,147,30,0.35)' : 'rgba(255,255,255,0.16)'}`, color: pending ? AMBER : INK }}>
          <Icon size={17} strokeWidth={1.8} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: pending ? AMBER : DIM }}>{pending ? k('cardPendingKicker', 'Under review') : k('cardRejectedKicker', 'Claim not approved')}</div>
          <div style={{ marginTop: 6, fontSize: 16, fontWeight: 600, color: INK }}>{pending ? k('cardPendingTitle', "We're checking your claim") : k('cardRejectedTitle', "We couldn't confirm this is your club")}</div>
          <p data-testid="listing-status-body" style={{ margin: '3px 0 0', fontSize: 13, lineHeight: 1.35, color: MUTE }}>
            {pending
              ? k('cardPendingBody', "Only you can see this profile until it's approved. We'll message you as soon as it is.")
              : <>{note.data ? `\u201C${note.data}\u201D ` : ''}{k('cardRejectedBody', 'Fix your details and send it again, or delete the profile.')}</>}
          </p>
        </div>
      </div>
      {!pending && (
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button type="button" data-testid="listing-fix" style={pillBtn(true)} onClick={onFix}>{k('fixAgain', 'Fix and send again')}</button>
          <button type="button" data-testid="listing-delete" style={pillBtn(false)} onClick={onDelete}>{k('deleteProfile', 'Delete profile')}</button>
        </div>
      )}
    </div>
  );
}
