import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { adminTheme as t } from '@/features/admin/theme';

/**
 * Admin invite redemption. Registered like /business/invite/accept (route,
 * bottom-nav hide list, chrome registry). accept_invite is called ONCE; the
 * edge function decides whether this account is the invited one.
 */
type State =
  | { kind: 'loading' }
  | { kind: 'success'; role: 'full' | 'limited' }
  | { kind: 'mismatch' }
  | { kind: 'invalid' };

export default function AdminInviteAcceptPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<State>(token ? { kind: 'loading' } : { kind: 'invalid' });
  const called = useRef(false);

  useHideBottomNav();

  useEffect(() => {
    if (!token || called.current) return;
    called.current = true;
    (async () => {
      const { data, error } = await supabase.functions.invoke('admin-invite-manage', {
        body: { action: 'accept_invite', token },
      });
      if (!error && data?.ok) {
        setState({ kind: 'success', role: data.role === 'full' ? 'full' : 'limited' });
        return;
      }
      if (error instanceof FunctionsHttpError && error.context.status === 403) {
        setState({ kind: 'mismatch' });
        return;
      }
      setState({ kind: 'invalid' });
    })();
  }, [token]);

  const title =
    state.kind === 'success' ? `You're now a ${state.role === 'full' ? 'Full' : 'Limited'} admin`
    : state.kind === 'mismatch' ? 'This invite is for a different account.'
    : state.kind === 'invalid' ? 'This invite has expired or is no longer valid.'
    : null;
  const body =
    state.kind === 'mismatch' ? 'Sign in with the invited account to accept it.'
    : state.kind === 'invalid' ? 'Ask the person who invited you to send it again.'
    : null;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: t.canvas,
        color: t.ink,
        paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        paddingLeft: 20,
        paddingRight: 20,
      }}
    >
      <section
        style={{
          maxWidth: 440,
          margin: '40px auto 0',
          background: t.surface,
          border: `0.5px solid ${t.line}`,
          borderRadius: 16,
          padding: '24px 16px',
          textAlign: 'center',
        }}
      >
        {state.kind === 'loading' ? (
          <div aria-busy="true" style={{ height: 44 }} />
        ) : (
          <>
            <h1 style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em', margin: 0 }}>{title}</h1>
            {body && (
              <p style={{ fontSize: 13.5, lineHeight: 1.45, color: t.inkMuted, margin: '8px 0 0' }}>{body}</p>
            )}
            {state.kind === 'success' && (
              <button
                type="button"
                onClick={() => navigate('/admin-v2')}
                style={{
                  marginTop: 24,
                  padding: '12px 24px',
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 600,
                  background: t.ink,
                  color: t.canvas,
                }}
              >
                Open admin
              </button>
            )}
          </>
        )}
      </section>
    </main>
  );
}
