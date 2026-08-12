import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SuspensionDetails } from '@/hooks/useSuspensionStatus';
import { formatDateLongTimeShort, formatDateNumeric } from '@/i18n/format';


type Props = { suspension: SuspensionDetails };

const SUSPENSION_REF_FALLBACK = '1970-01-01T00:00:00.000Z';

function formatUntil(iso: string | null): string {
  if (!iso) return '';
  try {
    return formatDateLongTimeShort(new Date(iso));
  } catch {
    return iso;
  }
}


type AppealRow = {
  id: string;
  status: 'pending' | 'upheld' | 'overturned';
  message: string;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
};

/**
 * Terminal screen for suspended accounts. Rendered by RootGate OUTSIDE
 * ClubhouseWrapped so there is no bottom nav / global chrome / feed access.
 */
const SuspendedScreen: React.FC<Props> = ({ suspension }) => {
  const [signingOut, setSigningOut] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [existing, setExisting] = React.useState<AppealRow | null>(null);
  const [loadingExisting, setLoadingExisting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [meId, setMeId] = React.useState<string | null>(null);

  const isPermanent = suspension.permanent || !suspension.suspended_until;
  const suspensionRef = suspension.suspended_at ?? suspension.suspended_until ?? SUSPENSION_REF_FALLBACK;

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setMeId(data.user?.id ?? null);
    })();
    return () => { alive = false; };
  }, []);

  const loadExistingAppeal = React.useCallback(async () => {
    if (!meId) return;
    setLoadingExisting(true);
    try {
      const { data, error } = await supabase
        .from('suspension_appeals')
        .select('id, status, message, review_note, reviewed_at, created_at')
        .eq('user_id', meId)
        .eq('suspension_ref', suspensionRef)
        .maybeSingle();
      if (error) {
        console.warn('[appeal] fetch failed', error);
        setExisting(null);
      } else {
        setExisting((data as AppealRow) ?? null);
      }
    } finally {
      setLoadingExisting(false);
    }
  }, [meId, suspensionRef]);

  const openSheet = async () => {
    setErrorMsg(null);
    setSheetOpen(true);
    await loadExistingAppeal();
  };

  const submitAppeal = async () => {
    if (!meId) return;
    const text = message.trim();
    if (!text) {
      setErrorMsg('Please add a short explanation.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('suspension_appeals')
        .insert({
          user_id: meId,
          suspension_ref: suspensionRef,
          message: text,
          status: 'pending',
        } as any)
        .select('id, status, message, review_note, reviewed_at, created_at')
        .single();

      if (error) {
        // Unique violation -> already appealed for this suspension.
        const code = (error as any).code ?? '';
        if (code === '23505' || /duplicate|unique/i.test(error.message)) {
          await loadExistingAppeal();
          return;
        }
        setErrorMsg(error.message ?? 'Could not submit appeal.');
        return;
      }
      setExisting(data as AppealRow);
      setMessage('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      window.location.replace('/auth');
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: '#0F172A', color: '#F8FAFC',
        zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center',
        padding: 'max(env(safe-area-inset-top, 0px), 32px) 24px max(env(safe-area-inset-bottom, 0px), 32px)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: 440, width: '100%', margin: '0 auto' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.62)', fontWeight: 600, marginBottom: 12 }}>
          Account status
        </div>
        <h1 style={{ fontSize: 28, lineHeight: 1.15, fontWeight: 700, letterSpacing: '-0.01em', margin: 0, marginBottom: 12 }}>
          Your account is suspended
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.5, color: '#CBD5E1', margin: 0, marginBottom: 20 }}>
          {isPermanent
            ? 'Your account has been suspended indefinitely.'
            : `Your account is suspended until ${formatUntil(suspension.suspended_until)}.`}
        </p>

        {suspension.reason ? (
          <div style={{ border: '1px solid rgba(248, 250, 252, 0.12)', background: 'rgba(248, 250, 252, 0.04)', borderRadius: 12, padding: '14px 16px', marginBottom: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94A3B8', fontWeight: 600, marginBottom: 6 }}>
              Reason
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.5, color: '#F8FAFC', whiteSpace: 'pre-wrap' }}>
              {suspension.reason}
            </div>
          </div>
        ) : null}

        <p style={{ fontSize: 13, lineHeight: 1.5, color: '#94A3B8', margin: 0, marginBottom: 20 }}>
          If you believe this is a mistake, you can appeal.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            onClick={openSheet}
            style={{
              display: 'block', textAlign: 'center', padding: '13px 16px', borderRadius: 999,
              background: '#F7931E', color: '#0F172A', fontWeight: 600, fontSize: 15,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Appeal this decision
          </button>
          <a
            href="mailto:support@clbhouz.co.uk?subject=Account%20suspension"
            style={{
              display: 'block', textAlign: 'center', padding: '12px 16px', borderRadius: 999,
              background: 'transparent', color: '#F8FAFC', border: '1px solid rgba(248, 250, 252, 0.24)',
              fontWeight: 500, fontSize: 15, textDecoration: 'none',
            }}
          >
            Contact support
          </a>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              display: 'block', width: '100%', padding: '12px 16px', borderRadius: 999,
              background: 'transparent', color: '#94A3B8', border: '1px solid rgba(148, 163, 184, 0.24)',
              fontWeight: 500, fontSize: 14, cursor: signingOut ? 'default' : 'pointer',
              opacity: signingOut ? 0.6 : 1, fontFamily: 'inherit',
            }}
          >
            {signingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </div>

      {sheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => !submitting && setSheetOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 10001,
            background: 'rgba(2, 6, 23, 0.72)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 520, background: '#0F172A', color: '#F8FAFC',
              borderTop: '1px solid rgba(248, 250, 252, 0.12)',
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              padding: '18px 20px max(env(safe-area-inset-bottom, 0px), 24px)',
              display: 'flex', flexDirection: 'column', gap: 14,
              fontFamily: 'inherit',
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(248, 250, 252, 0.24)', margin: '0 auto 4px' }} />
            <div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Appeal your suspension</div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 6, lineHeight: 1.5 }}>
                Tell us why you think this suspension should be reviewed. A moderator will get back to you.
              </div>
            </div>

            {loadingExisting ? (
              <div style={{ color: '#94A3B8', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
                Loading...
              </div>
            ) : existing ? (
              <ExistingAppealCard row={existing} />
            ) : (
              <>
                <textarea
                  autoFocus
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Explain your appeal..."
                  rows={5}
                  disabled={submitting}
                  style={{
                    width: '100%', padding: 12, borderRadius: 12,
                    background: 'rgba(248, 250, 252, 0.06)', color: '#F8FAFC',
                    border: '1px solid rgba(248, 250, 252, 0.14)',
                    fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                    lineHeight: 1.5,
                  }}
                />
                {errorMsg && (
                  <div style={{ color: '#FCA5A5', fontSize: 12 }}>{errorMsg}</div>
                )}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setSheetOpen(false)}
                    disabled={submitting}
                    style={{
                      padding: '10px 16px', borderRadius: 999,
                      background: 'transparent', color: '#F8FAFC',
                      border: '1px solid rgba(248, 250, 252, 0.24)',
                      fontWeight: 500, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitAppeal}
                    disabled={submitting || !message.trim()}
                    style={{
                      padding: '10px 18px', borderRadius: 999,
                      background: '#F7931E', color: '#0F172A',
                      border: 'none', fontWeight: 700, fontSize: 14,
                      cursor: submitting ? 'default' : 'pointer',
                      opacity: submitting || !message.trim() ? 0.55 : 1,
                      fontFamily: 'inherit',
                    }}
                  >
                    {submitting ? 'Submitting...' : 'Submit appeal'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function ExistingAppealCard({ row }: { row: AppealRow }) {
  const heading =
    row.status === 'pending' ? 'Your appeal is under review'
    : row.status === 'overturned' ? 'Your appeal was successful'
    : 'Your appeal was reviewed';
  const body =
    row.status === 'pending'
      ? 'We will let you know once a moderator has taken a look.'
      : row.status === 'overturned'
      ? 'Your account should be reinstated shortly.'
      : 'A moderator reviewed your appeal and the suspension stands.';

  return (
    <div
      style={{
        border: '1px solid rgba(248, 250, 252, 0.14)',
        background: 'rgba(248, 250, 252, 0.04)',
        borderRadius: 12, padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{heading}</div>
      <div style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.5 }}>{body}</div>
      {row.review_note && (
        <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
          Note from moderator: {row.review_note}
        </div>
      )}
      <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Submitted {formatDateNumeric(new Date(row.created_at))}
      </div>
    </div>
  );
}

export default SuspendedScreen;
