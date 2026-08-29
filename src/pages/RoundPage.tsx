/**
 * RoundPage — /round/:whsScoreId
 *
 * BRIEF_ROUND_PAGE. A round finally has its own address. Until now the
 * scorecard was only ever a sheet opened inside whatever page you were on, so
 * a round notification had to borrow /handicap/:userId?score= to host it.
 *
 * S1.2 / S1.3 — THIS PAGE IS A HOST, NOT A SECOND SCORECARD. It mounts the
 * canonical RoundDetailSheet (itself a thin wrapper over CardScorecardSheet),
 * so the summary header, chart, hole grid and stat rail are literally the same
 * component the rest of the app renders. Nothing is forked. Any redesign of the
 * sheet lands here for free.
 *
 * S5.1 — THIS ROUTE IS THE INTENDED TARGET FOR OPEN GRAPH TAGS on a shared
 * round, and for a future share action on the sheet. Neither is built here: the
 * SPA serves static OG tags and fixing that is its own piece of work.
 *
 * SIGNED OUT (S2.3): the round page renders for a guest, but the CARD CANNOT.
 * whs_scores' only public-facing policy (whs_scores_select_public_visible) is
 * granted to the `authenticated` role alone, so an anonymous reader gets zero
 * rows from every round in the database. Rather than show a guest the generic
 * "scorecard unavailable" (which would be a lie about why), a signed-out
 * visitor gets an explicit sign-in state. No member data crosses RLS.
 */

import React, { useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Table } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { A, SANS, Panel } from '@/features/courses/components/holes/analytical/tokens';

/**
 * Who played this round. The sheet needs the owner for the player identity
 * block (name, avatar, handicap) and for "view profile".
 *
 * The post is tried first: verified in the database, every round post carries a
 * distinct whs_score_id and an author, so it is a safe one-hop lookup and it is
 * readable without touching the handicap tables. If a round has no post (it was
 * never shared), fall back to the connection that owns the score — subject to
 * the same RLS as the card itself.
 */
function useRoundOwner(scoreId: string | undefined) {
  return useQuery({
    queryKey: ['round-page-owner', scoreId ?? ''],
    enabled: !!scoreId,
    staleTime: 300_000,
    queryFn: async (): Promise<string | null> => {
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('whs_score_id', scoreId as string)
        .eq('status', 'published')
        .maybeSingle();
      if (post?.user_id) return post.user_id as string;

      const { data: score } = await supabase
        .from('whs_scores' as never)
        .select('connection_id')
        .eq('id', scoreId as string)
        .maybeSingle();
      const connectionId = (score as { connection_id?: string } | null)?.connection_id;
      if (!connectionId) return null;

      const { data: conn } = await supabase
        .from('whs_connections' as never)
        .select('user_id')
        .eq('id', connectionId)
        .maybeSingle();
      return (conn as { user_id?: string } | null)?.user_id ?? null;
    },
  });
}

const StateShell: React.FC<{
  title: string;
  body: string;
  cta?: { label: string; onClick: () => void };
}> = ({ title, body, cta }) => (
  <div
    style={{
      minHeight: '100dvh', background: A.CANVAS, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}
  >
    <Panel style={{ maxWidth: 320, width: '100%', textAlign: 'center' }}>
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 10, padding: '18px 0 6px', color: A.MUTE, fontFamily: SANS,
        }}
      >
        <Table size={22} strokeWidth={1.6} />
        <div style={{ fontSize: 17, fontWeight: 700, color: A.INK }}>{title}</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: A.MUTE, maxWidth: 250 }}>{body}</div>
        {cta ? (
          <button
            type="button"
            onClick={cta.onClick}
            style={{
              marginTop: 8, padding: '10px 18px', borderRadius: 14,
              background: A.AMBER, color: '#15171F', fontSize: 13, fontWeight: 700,
            }}
          >
            {cta.label}
          </button>
        ) : null}
      </div>
    </Panel>
  </div>
);

const RoundPage: React.FC = () => {
  const { whsScoreId } = useParams<{ whsScoreId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['courses']);
  const { user, loading: authLoading } = useSupabaseSession();

  /**
   * S2.4 — A DESTINATION, NOT AN OVERLAY. React Router marks the first entry of
   * a session with key 'default', so a cold launch straight to this URL has no
   * history to pop: closing goes to Discover with a replace. Any in-app arrival
   * goes back where it came from.
   */
  const hasHistory = location.key !== 'default';
  const goBack = () => {
    if (hasHistory) navigate(-1);
    else navigate('/explore', { replace: true });
  };

  const ownerQuery = useRoundOwner(whsScoreId);
  const ownerId = ownerQuery.data ?? null;

  const missingId = !whsScoreId;
  const signedOut = !authLoading && !user;

  const content = useMemo(() => {
    if (missingId) {
      return (
        <StateShell
          title={t('courses:scorecard.unavailableTitle')}
          body={t('courses:scorecard.unavailableBody')}
          cta={{ label: t('courses:scorecard.roundBack'), onClick: goBack }}
        />
      );
    }
    if (signedOut) {
      return (
        <StateShell
          title={t('courses:scorecard.roundSignInTitle')}
          body={t('courses:scorecard.roundSignInBody')}
          cta={{
            label: t('courses:scorecard.roundSignInCta'),
            onClick: () => navigate(`/auth?redirect=${encodeURIComponent(location.pathname)}`),
          }}
        />
      );
    }
    // The sheet owns every remaining outcome: it shows a syncing state while the
    // score resolves, and its 'unavailable' state for a deleted score or one
    // this viewer cannot see under RLS. Nothing here can end in a blank screen.
    return (
      <div style={{ minHeight: '100dvh', background: A.CANVAS }}>
        <RoundDetailSheet
          open
          onClose={goBack}
          scoreId={whsScoreId}
          profileUserId={ownerId}
        />
      </div>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingId, signedOut, whsScoreId, ownerId, t, hasHistory, authLoading]);

  return content;
};

export default RoundPage;
