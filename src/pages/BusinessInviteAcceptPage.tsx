import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useAcceptInvite, BUSINESS_ROLE_LABELS, BusinessRole } from '@/hooks/useBusinessTeam';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';

/* NO PRIVATE PALETTE - see BusinessReviewsPage. Shared manage vocabulary,
   derived from the analytical `A` ramp. */
import { INK, INK_45, HAIR, CARD_BG, PAGE_BG } from '@/components/manage/ui';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { GREEN, DANGER } from '@/components/manage/ui';

interface InviteView {
  id: string;
  business_id: string;
  role: BusinessRole;
  status: string;
  business_name: string;
  business_logo_url: string | null;
}

export default function BusinessInviteAcceptPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');

  useHideBottomNav();

  const acceptInvite = useAcceptInvite();

  const [invite, setInvite] = useState<InviteView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<{ businessId: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!token) { setError('Missing invite token.'); setLoading(false); return; }
      try {
        const { data, error } = await supabase
          .from('business_invites')
          .select('id, business_id, role, status, business:business_accounts!business_invites_business_id_fkey(name, logo_url, slug)')
          .eq('token', token)
          .maybeSingle();
        if (error) throw error;
        if (!data) { setError('Invite not found.'); setLoading(false); return; }
        const biz = (data as any).business;
        if (!cancelled) {
          setInvite({
            id: data.id,
            business_id: data.business_id,
            role: data.role as BusinessRole,
            status: data.status,
            business_name: biz?.name || 'this business',
            business_logo_url: biz?.logo_url || null,
          });
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load invite');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    try {
      const res = await acceptInvite.mutateAsync(token);
      setAccepted({ businessId: (res as any).business_id || invite?.business_id || '' });
    } catch {
      /* toast handled */
    }
  };

  return (
    <ManagePageShell title="Team invite">
      <main className="px-4 pt-6 pb-8 max-w-lg mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16" style={{ color: INK_45 }}>
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : accepted ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
            <div
              className="h-16 w-16 mx-auto rounded-full flex items-center justify-center mb-4"
              style={{ background: 'rgba(52,215,127,0.16)' }}
            >
              <CheckCircle2 size={32} color={GREEN} strokeWidth={2.25} />
            </div>
            <h2 className="text-[19px] font-bold mb-2" style={{ color: INK }}>You're on the team</h2>
            <p className="text-[13.5px] mb-6" style={{ color: INK_45 }}>
              You joined {invite?.business_name} as {BUSINESS_ROLE_LABELS[invite?.role || 'admin']}.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/business/${accepted.businessId}`)}
              className="px-6 py-3 rounded-full font-semibold text-[14px]"
              style={{ background: INK, color: A.CANVAS }}
            >
              Go to business
            </button>
          </motion.div>
        ) : error || !invite ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
            <div
              className="h-16 w-16 mx-auto rounded-full flex items-center justify-center mb-4"
              style={{ background: 'rgba(255,90,90,0.16)' }}
            >
              <XCircle size={32} color={DANGER} strokeWidth={2.25} />
            </div>
            <h2 className="text-[19px] font-bold mb-2" style={{ color: INK }}>Invite unavailable</h2>
            <p className="text-[13.5px] mb-6" style={{ color: INK_45 }}>{error || 'This invite may have expired.'}</p>
          </motion.div>
        ) : invite.status !== 'pending' ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
            <h2 className="text-[19px] font-bold mb-2" style={{ color: INK }}>Invite {invite.status}</h2>
            <p className="text-[13.5px] mb-6" style={{ color: INK_45 }}>
              This invite is no longer active.
            </p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div
              className="mb-6 text-center"
              style={{
                background: CARD_BG,
                border: `1px solid ${HAIR}`,
                borderRadius: 16,
                padding: '24px 16px',
              }}
            >
              {invite.business_logo_url ? (
                <SquircleAvatar
                  src={invite.business_logo_url}
                  alt={invite.business_name}
                  size={72}
                  hairlineRing
                  ringColor={DARK_HAIRLINE}
                />
              ) : (
                <div
                  className="h-[72px] w-[72px] mx-auto flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 24 }}
                >
                  <Building2 size={32} color={INK_45} />
                </div>
              )}
              <h2 className="text-[19px] font-bold mt-4" style={{ color: INK, letterSpacing: '-0.01em' }}>
                Join {invite.business_name}
              </h2>
              <p className="text-[13.5px] mt-1.5" style={{ color: INK_45 }}>
                You've been invited as {BUSINESS_ROLE_LABELS[invite.role]}.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 py-3 rounded-full font-semibold text-[14px]"
                style={{ color: INK, background: CARD_BG, border: `1px solid ${HAIR}` }}
              >
                Not now
              </button>
              <button
                type="button"
                onClick={handleAccept}
                disabled={acceptInvite.isPending}
                className="flex-1 py-3 rounded-full font-semibold text-[14px] disabled:opacity-60"
                style={{ background: INK, color: A.CANVAS }}
              >
                {acceptInvite.isPending ? 'Joining…' : 'Accept invite'}
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </ManagePageShell>
  );
}
