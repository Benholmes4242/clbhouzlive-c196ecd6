/**
 * HandicapPage — Top-level Handicap route (the user's own handicap).
 *
 * Wraps WhsHandicapTab in a sticky 3-row header (back / sync pill / more,
 * editorial title with greeting, segmented control). Subtab state is owned
 * here and threaded down to HandicapDashboard via props.
 *
 * Reached via /handicap from the ProfileHubSheet 2×2 grid. Public to any
 * authenticated user — feature flag was removed per the fix brief.
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageRoot } from '@/components/layout/PageRoot';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import WhsHandicapTab from '@/components/profile/handicap/whs/WhsHandicapTab';
import MorningMoment from '@/components/handicap/MorningMoment';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { isHandicapSubtab, type HandicapSubtab } from '@/components/profile/handicap/whs/types';

const INK = '#0F172A';
const INK_55 = '#64748B';
const BORDER = 'rgba(15,23,42,0.10)';
const BORDER_SOFT = 'rgba(15,23,42,0.07)';
const BG_SURFACE = '#F8FAFC';
const AMBER = '#F7931E';
const AMBER_INK = '#C97211';
const GREEN = '#059669';
const RED = '#9F1D1D';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

function getGreeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

interface HeaderProps {
  userId: string;
  firstName: string | null;
  activeTab: HandicapSubtab;
  onTabChange: (tab: HandicapSubtab) => void;
}

const HandicapPageHeader: React.FC<HeaderProps> = ({ userId, firstName, activeTab, onTabChange }) => {
  const navigate = useNavigate();
  const { data: connection } = useWhsConnection(userId);

  const greeting = useMemo(() => getGreeting(), []);

  const syncStatus = useMemo(() => {
    if (!connection) return null;
    const status = (connection as any).last_sync_status;
    const lastSync = connection.last_synced_at;
    if (status === 'auth_failed') {
      return { color: 'red' as const, label: 'Sync needs reauth' };
    }
    if (!lastSync || (Date.now() - new Date(lastSync).getTime()) > 24 * 3600_000) {
      return { color: 'amber' as const, label: 'Sync pending' };
    }
    return { color: 'green' as const, label: 'England Golf · synced' };
  }, [connection]);

  const pillBg = syncStatus?.color === 'green'
    ? 'rgba(5,150,105,0.10)'
    : syncStatus?.color === 'amber'
    ? 'rgba(247,147,30,0.10)'
    : 'rgba(159,29,29,0.10)';
  const pillBorder = syncStatus?.color === 'green'
    ? 'rgba(5,150,105,0.20)'
    : syncStatus?.color === 'amber'
    ? 'rgba(247,147,30,0.20)'
    : 'rgba(159,29,29,0.20)';
  const pillDot = syncStatus?.color === 'green' ? GREEN : syncStatus?.color === 'amber' ? AMBER : RED;
  const pillText = syncStatus?.color === 'green' ? GREEN : syncStatus?.color === 'amber' ? AMBER_INK : RED;

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: BG_SURFACE,
        paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
      }}
    >
      {/* Row 1 — top bar */}
      <div className="flex items-center justify-between px-4" style={{ height: 44 }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#fff',
            border: `0.5px solid ${BORDER}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={20} strokeWidth={2.2} color={INK} />
        </button>

        {syncStatus && (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 12px',
              background: pillBg,
              border: `0.5px solid ${pillBorder}`,
              borderRadius: 999,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: pillDot }} />
            <span style={{
              fontSize: 11, fontWeight: 700, color: pillText,
              fontFamily: FONT_GEIST,
            }}>
              {syncStatus.label}
            </span>
          </div>
        )}

        {/* More menu — v1 stub, no-op */}
        <button
          aria-label="More options"
          aria-disabled="true"
          // TODO: wire menu (Refresh now / Disconnect / Privacy) in a follow-up brief.
          onClick={() => { /* no-op */ }}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#fff',
            border: `0.5px solid ${BORDER}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <MoreHorizontal size={18} strokeWidth={2.2} color={INK} />
        </button>
      </div>

      {/* Row 2 — title */}
      <div style={{ padding: '14px 20px 18px' }}>
        <div style={{
          fontSize: 11, fontWeight: 800, color: INK_55,
          letterSpacing: '0.22em', marginBottom: 6,
          fontFamily: FONT_GEIST,
        }}>
          HANDICAP
        </div>
        <h1 style={{
          fontFamily: FONT_GEIST,
          fontSize: 28, fontWeight: 700, color: INK,
          lineHeight: 1.1, letterSpacing: '-0.02em',
          margin: 0,
        }}>
          {firstName ? `${greeting}, ${firstName}` : 'Welcome back'}
        </h1>
      </div>

      {/* Row 3 — segmented control */}
      <div style={{
        display: 'flex',
        borderBottom: `0.5px solid ${BORDER}`,
        paddingLeft: 20,
      }}>
        {(['overview', 'trends', 'friends'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? `2px solid ${AMBER}` : '2px solid transparent',
              marginBottom: -1,
              fontSize: 14,
              fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? INK : INK_55,
              cursor: 'pointer',
              fontFamily: FONT_GEIST,
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>
    </header>
  );
};

const HandicapPage: React.FC = () => {
  const { user, loading } = useSupabaseSession();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawSubtab = searchParams.get('subtab');
  const activeTab: HandicapSubtab = isHandicapSubtab(rawSubtab) ? rawSubtab : 'overview';

  const handleTabChange = useCallback((next: HandicapSubtab) => {
    const params = new URLSearchParams(searchParams);
    params.set('subtab', next);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  // Fetch first name for greeting
  const { data: profile } = useQuery<{ first_name: string | null; full_name: string | null; username: string | null } | null>({
    queryKey: ['handicap-page-greeting', user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('user_profiles')
        .select('first_name, full_name, username')
        .eq('id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });

  const firstName = useMemo(() => {
    const fn = (profile as any)?.first_name?.trim();
    if (fn) return fn;
    const full = profile?.full_name?.trim();
    if (full) return full.split(/\s+/)[0];
    return null;
  }, [profile]);

  useEffect(() => {
    if (user?.id) {
      analyticsEvents.track?.('handicap_page_viewed', { source: 'route' });
    }
  }, [user?.id]);

  if (loading) {
    return <PageRoot><div /></PageRoot>;
  }

  if (!user?.id) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <PageRoot style={{ background: BG_SURFACE }}>
      <HandicapPageHeader
        userId={user.id}
        firstName={firstName}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <main>
        <MorningMoment userId={user.id} />
        <WhsHandicapTab userId={user.id} subtab={activeTab} onSubtabChange={handleTabChange} />
      </main>
    </PageRoot>
  );
};

export default HandicapPage;
