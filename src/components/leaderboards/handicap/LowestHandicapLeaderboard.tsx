import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { useLowestHandicapLeaderboard } from '@/hooks/leaderboards';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { formatHcp, getHandicapStatusLabel, getHandicapStatusColor, getHandicapBadgeStyle } from '@/lib/formatHcp';
import { HandicapPodium } from './HandicapPodium';
import { HandicapInsightBanner } from './HandicapInsightBanner';
import { HandicapMoverStrip } from './HandicapMoverStrip';
import { Skeleton } from '@/components/ui/skeleton';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';
import { ClubSearchBar } from '../exploration/ClubSearchBar';
import { CountrySelector } from '../shared/CountrySelector';
import type { LeaderboardScope } from '@/types/leaderboards';
import { useSeasonCalendar } from '@/hooks/championship';
import { getSeasonConfig, type SeasonId } from '@/lib/seasonConfig';

// --- Constants ---
const ROW_HEIGHT = 72;
const VIRTUALIZATION_THRESHOLD = 50;
const OVERSCAN = 8;
const STORAGE_KEY_SCROLL = 'handicap-leaderboard-scroll';

const SCOPE_OPTIONS = [
  { id: 'global' as const, label: '🌍 Global' },
  { id: 'country' as const, label: 'Country' },
  { id: 'club' as const, label: 'Club' },
  { id: 'friends' as const, label: '👥 Friends' },
] satisfies { id: LeaderboardScope; label: string }[];

// --- Helper components ---
function HandicapLeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-5 w-6 rounded" />
          <Skeleton className="h-11 w-11 rounded-lg" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Full-page skeleton matching dark header layout */
function HandicapPageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: '#F8FAFC', minHeight: '100%' }}>
      {/* Dark header skeleton */}
      <div style={{ background: 'linear-gradient(160deg, #1a1a2e, #2d1f3d, #1f1535)', padding: '16px 16px 0' }}>
        <Skeleton className="h-3 w-52 rounded mb-4" style={{ background: 'rgba(255,255,255,0.12)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <Skeleton className="w-[52px] h-[52px] rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }} />
          <div style={{ flex: 1 }}>
            <Skeleton className="h-3 w-28 rounded mb-3" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Skeleton className="h-9 w-20 rounded" style={{ background: 'rgba(255,255,255,0.2)' }} />
              <Skeleton className="h-5 w-20 rounded" style={{ background: 'rgba(255,255,255,0.12)' }} />
            </div>
          </div>
          <Skeleton className="h-10 w-12 rounded" style={{ background: 'rgba(255,255,255,0.12)' }} />
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 flex-1 rounded-t-[8px]" style={{ background: i === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)' }} />
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Insight banner skeleton */}
        <Skeleton className="h-12 w-full rounded-[14px]" />

        {/* Band legend skeleton */}
        <div style={{ display: 'flex', gap: 6, overflow: 'hidden' }}>
          {[48, 60, 72, 52, 80].map((w, i) => (
            <Skeleton key={i} className="h-6 rounded" style={{ width: w }} />
          ))}
        </div>

        {/* Rankings label */}
        <Skeleton className="h-3 w-20 rounded" />

        {/* Row skeletons */}
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            background: '#FFFFFF', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)',
            borderLeft: '3px solid #e5e7eb',
          }}>
            <Skeleton className="w-5 h-4 rounded" />
            <Skeleton className="w-11 h-11 rounded-lg" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Skeleton className="h-4 rounded" style={{ width: `${[70, 55, 65, 50, 60, 55][i]}%` }} />
              <Skeleton className="h-3 rounded" style={{ width: `${[45, 40, 50, 35, 45, 40][i]}%` }} />
            </div>
            <Skeleton className="h-6 w-14 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function InlineRetryCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-4 px-3">
      <button
        onClick={onRetry}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-muted text-sm text-muted-foreground active:scale-[0.98] active:opacity-70 transition-all"
      >
        Couldn't load more entries · Tap to retry
      </button>
    </div>
  );
}

function InitialErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-3 text-center space-y-4">
      <p className="text-muted-foreground text-sm">Something went wrong loading the leaderboard.</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium active:scale-[0.97] active:opacity-90 transition-all"
      >
        Try again
      </button>
    </div>
  );
}

// --- Empty State ---
function EmptyState({ scope, clubName, country }: { scope: string; clubName?: string | null; country?: string | null }) {
  const message = (() => {
    if (scope === 'club' && clubName) return `No handicaps from ${clubName} yet — invite your club mates`;
    if (scope === 'country' && country) return `No ${country} players yet`;
    if (scope === 'friends') return 'None of your friends have a handicap yet';
    return 'No handicaps recorded yet. Add your handicap to appear here!';
  })();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-3 text-center space-y-4">
      <p className="text-base text-muted-foreground">{message}</p>
      <Link
        to="/profile/edit"
        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.97]"
        style={{ backgroundColor: '#F5A623' }}
      >
        Add Handicap
      </Link>
    </div>
  );
}

// --- Handicap Row — Band border design ---
function HandicapRow({ entry, userId }: { entry: any; userId?: string }) {
  const isMe = entry.user_id === userId;
  const rank = entry.rank;
  const handicap = entry.handicap_index;
  const statusLabel = getHandicapStatusLabel(handicap);
  const bandColor = getHandicapStatusColor(handicap);
  const badgeStyle = getHandicapBadgeStyle(handicap);

  const initials = (entry.display_name || '?')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link
      to={`/profile/${entry.user_id}`}
      className="flex items-center gap-3 active:scale-[0.98] transition-transform"
      style={{
        background: isMe ? '#FFFBF0' : '#FFFFFF',
        border: isMe ? '1px solid rgba(245,166,35,0.27)' : '1px solid rgba(0,0,0,0.07)',
        borderLeft: `3px solid ${isMe ? '#F5A623' : bandColor}`,
        borderRadius: 14,
        padding: 'clamp(10px,2.5vw,12px) clamp(12px,3vw,14px)',
        marginBottom: 6,
        minHeight: 44,
      }}
    >
      {/* Rank */}
      <span style={{
        width: 20, fontSize: 'clamp(12px,3.2vw,13px)', fontWeight: 700,
        fontVariantNumeric: 'tabular-nums', textAlign: 'center', flexShrink: 0,
        color: rank <= 3 ? '#F5A623' : '#64748B',
      }}>
        {rank}
      </span>

      {/* Avatar */}
      <SquircleAvatar
        size={44}
        src={entry.avatar_url}
        alt={entry.display_name || ''}
        fallback={initials}
        thinRing
        className="flex-shrink-0"
      />

      {/* Name + YOU badge + Location + Club */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-bold truncate" style={{ fontSize: 'clamp(13px,3.5vw,14px)', color: '#0F172A' }}>
            {entry.display_name || 'Unknown'}
          </p>
          {isMe && (
            <span style={{
              fontSize: 9, fontWeight: 800, color: '#F5A623',
              background: 'rgba(245,166,35,0.12)', borderRadius: 4,
              padding: '1px 5px', letterSpacing: '0.5px', flexShrink: 0,
            }}>
              YOU
            </span>
          )}
        </div>
        {(entry.city || entry.country) && (
          <p className="truncate" style={{ fontSize: 11, color: '#94A3B8' }}>
            {[entry.city, entry.country].filter(Boolean).join(', ')}
          </p>
        )}
        {entry.club_name && (
          <p className="truncate" style={{ fontSize: 11, color: '#94A3B8' }}>
            {entry.club_name}
          </p>
        )}
      </div>

      {/* Handicap number + band pill */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center" style={{ width: 72 }}>
        <span style={{ color: bandColor, fontSize: 'clamp(18px,4.8vw,21px)', fontWeight: 800, lineHeight: 1 }}>
          {formatHcp(handicap)}
        </span>
        {statusLabel && (
          <span
            className="font-semibold uppercase tracking-wide mt-1 text-center leading-tight"
            style={{
              fontSize: 8, background: badgeStyle.bg, color: badgeStyle.text,
              borderRadius: 6, padding: '2px 6px', maxWidth: 68,
            }}
          >
            {statusLabel}
          </span>
        )}
      </div>
    </Link>
  );
}

// --- Scope label helper ---
function getScopeLabel(scope: string, country?: string | null, clubName?: string | null): string {
  switch (scope) {
    case 'country': return country ? `in ${country}` : 'in your country';
    case 'club': return clubName ? `at ${clubName}` : 'at your club';
    case 'friends': return 'among friends';
    default: return 'globally';
  }
}

function getScopeContext(scope: string, country?: string | null, clubName?: string | null): string {
  switch (scope) {
    case 'country': return country ? `${country} · Country leaderboard` : 'Country leaderboard';
    case 'club': return clubName ? `${clubName} · Club leaderboard` : 'Club leaderboard';
    case 'friends': return 'Friends · People you follow';
    default: return 'Global · All clbhouz members';
  }
}

// --- Main component ---
interface LowestHandicapLeaderboardProps {
  scope: LeaderboardScope;
  onScopeChange: (scope: LeaderboardScope) => void;
  clubId?: string | null;
  clubName?: string | null;
  country?: string | null;
  scopeSelector?: React.ReactNode;
  seasonColor?: string;
  selectedClubId?: string | null;
  selectedClubName?: string | null;
  onClubSelect?: (id: string | null, name: string | null) => void;
  selectedCountry?: string | null;
  onCountrySelect?: (country: string | null) => void;
  userHomeClubId?: string | null;
  userHomeClubName?: string | null;
}

export function LowestHandicapLeaderboard({
  scope, onScopeChange, clubId, clubName, country,
  scopeSelector, seasonColor,
  selectedClubId, selectedClubName, onClubSelect,
  selectedCountry, onCountrySelect,
  userHomeClubId, userHomeClubName,
}: LowestHandicapLeaderboardProps) {
  const { user } = useSupabaseSession();
  const [scrollTop, setScrollTop] = useState(0);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const hasRestoredScroll = useRef(false);

  // Season config for header label
  const { data: seasonCalendar } = useSeasonCalendar();
  const currentSeasonId = useMemo(() => {
    const current = seasonCalendar?.find(s => s.is_current);
    if (!current) return 'major' as SeasonId;
    const lower = current.name.toLowerCase();
    if (lower.includes('pre')) return 'preseason' as SeasonId;
    if (lower.includes('summer')) return 'summer' as SeasonId;
    if (lower.includes('off')) return 'offseason' as SeasonId;
    return 'major' as SeasonId;
  }, [seasonCalendar]);

  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useLowestHandicapLeaderboard({
    scope,
    clubId: scope === 'club' ? clubId : undefined,
    country: scope === 'country' ? country : undefined,
  });

  const allEntries = useMemo(
    () => data?.pages.flatMap(page => page.entries) ?? [],
    [data?.pages]
  );

  // Scroll tracking for virtualization
  useEffect(() => {
    const handleScroll = () => {
      const rootEl = document.getElementById('root');
      const currentScroll = (rootEl && rootEl.scrollTop > 0) ? rootEl.scrollTop : window.scrollY;
      setScrollTop(currentScroll);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    const rootEl = document.getElementById('root');
    rootEl?.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      rootEl?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Scroll restore
  useEffect(() => {
    if (hasRestoredScroll.current || allEntries.length === 0) return;
    const savedScroll = sessionStorage.getItem(STORAGE_KEY_SCROLL);
    if (savedScroll) {
      hasRestoredScroll.current = true;
      requestAnimationFrame(() => {
        const rootEl = document.getElementById('root');
        const scrollTarget = parseInt(savedScroll);
        if (rootEl) rootEl.scrollTop = scrollTarget;
        window.scrollTo({ top: scrollTarget, behavior: 'instant' as ScrollBehavior });
        sessionStorage.removeItem(STORAGE_KEY_SCROLL);
      });
    }
  }, [allEntries.length]);

  // Infinite scroll observer
  const isFetchingRef = useRef(isFetchingNextPage);
  isFetchingRef.current = isFetchingNextPage;

  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingRef.current) {
          fetchNextPage();
        }
      },
      { rootMargin: '600px', threshold: 0 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  // Save scroll on entry click
  const handleEntryClick = useCallback(() => {
    const rootEl = document.getElementById('root');
    const scrollY = (rootEl && rootEl.scrollTop > 0) ? rootEl.scrollTop : window.scrollY;
    sessionStorage.setItem(STORAGE_KEY_SCROLL, scrollY.toString());
  }, []);

  // Find current user's rank
  const currentUserEntry = allEntries.find(e => e.user_id === user?.id);
  const userRank = currentUserEntry?.rank;
  const topHandicap = allEntries.length > 0 ? (allEntries[0] as any).handicap_index : null;
  const userHandicap = currentUserEntry ? (currentUserEntry as any).handicap_index : null;

  // Scope label
  const scopeLabel = getScopeLabel(scope, country, clubName);
  const scopeContext = getScopeContext(scope, country, clubName);

  // Virtualization
  const virtualizedContent = useMemo(() => {
    if (allEntries.length <= VIRTUALIZATION_THRESHOLD) return null;
    const containerOffset = listContainerRef.current?.offsetTop ?? 0;
    const relativeScroll = Math.max(0, scrollTop - containerOffset);
    const viewportHeight = window.innerHeight;
    const startIndex = Math.max(0, Math.floor(relativeScroll / ROW_HEIGHT) - OVERSCAN);
    const visibleCount = Math.ceil(viewportHeight / ROW_HEIGHT) + OVERSCAN * 2;
    const endIndex = Math.min(allEntries.length, startIndex + visibleCount);
    const totalHeight = allEntries.length * ROW_HEIGHT;
    const offsetY = startIndex * ROW_HEIGHT;
    return { startIndex, endIndex, totalHeight, offsetY };
  }, [allEntries.length, scrollTop]);

  // Initial error
  if (isError && allEntries.length === 0 && !isLoading) {
    return <InitialErrorState onRetry={() => refetch()} />;
  }

  if (isLoading && allEntries.length === 0) {
    return <HandicapPageSkeleton />;
  }

  if (!isError && allEntries.length === 0) {
    return <EmptyState scope={scope} clubName={clubName} country={country} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* ── DARK HERO HEADER ── */}
      <div style={{
        background: 'linear-gradient(160deg, #1a1a2e 0%, #2d1f3d 60%, #1f1535 100%)',
        padding: 'clamp(14px,3vw,18px) clamp(14px,4vw,18px) 0',
        position: 'relative', overflow: 'hidden', flexShrink: 0,
      }}>
        {/* Decorative glows */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(247,147,30,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 20, right: -10, width: 100, height: 100, borderRadius: '50%', background: 'rgba(247,147,30,0.04)', pointerEvents: 'none' }} />

        {/* Season label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 'clamp(8px,2vw,12px)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.5)' }} />
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(9px,2.5vw,11px)', fontWeight: 600, fontFamily: 'DM Sans, system-ui, sans-serif', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            Handicap Rankings · {getSeasonConfig(currentSeasonId).title}
          </span>
        </div>

        {/* User handicap row */}
        {currentUserEntry && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'clamp(14px,3.5vw,20px)' }}>
            {/* Avatar */}
            {currentUserEntry.avatar_url ? (
              <img
                src={currentUserEntry.avatar_url}
                alt=""
                style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.5)', fontSize: 18, fontWeight: 700, flexShrink: 0,
              }}>
                {(currentUserEntry.display_name || '?').charAt(0).toUpperCase()}
              </div>
            )}

            {/* Handicap + band label */}
            <div style={{ flex: 1 }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'clamp(10px,2.8vw,12px)', fontWeight: 500, fontFamily: 'DM Sans, system-ui, sans-serif', marginBottom: 2 }}>
                Your Handicap Index
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#F7931E', fontSize: 'clamp(30px,8vw,38px)', fontWeight: 800, fontFamily: 'DM Sans, system-ui, sans-serif', lineHeight: 1 }}>
                  {formatHcp((currentUserEntry as any).handicap_index)}
                </span>
                {getHandicapStatusLabel((currentUserEntry as any).handicap_index) && (
                  <span style={{
                    ...(() => {
                      const bs = getHandicapBadgeStyle((currentUserEntry as any).handicap_index);
                      return { background: bs.bg, color: bs.text };
                    })(),
                    fontSize: 'clamp(10px,2.8vw,12px)', fontWeight: 700, borderRadius: 8,
                    padding: '3px 10px', textTransform: 'uppercase' as const, letterSpacing: '0.5px',
                  }}>
                    {getHandicapStatusLabel((currentUserEntry as any).handicap_index)}
                  </span>
                )}
              </div>
            </div>

            {/* Rank */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'clamp(9px,2.4vw,10px)', fontWeight: 500, fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                {scope === 'global' ? 'Global rank' : scope === 'club' ? 'Club rank' : scope === 'country' ? 'Country rank' : 'Friend rank'}
              </span>
              <span style={{ color: '#fff', fontSize: 'clamp(22px,6vw,28px)', fontWeight: 800, fontFamily: 'DM Sans, system-ui, sans-serif', lineHeight: 1 }}>
                #{userRank ?? '—'}
              </span>
            </div>
          </div>
        )}

        {/* Scope tabs — flush to bottom */}
        <div style={{ display: 'flex', gap: 2 }}>
          {SCOPE_OPTIONS.map(t => (
            <button
              key={t.id}
              onClick={() => onScopeChange(t.id)}
              style={{
                flex: 1, padding: 'clamp(8px,2vw,10px) 0', borderRadius: '8px 8px 0 0',
                border: 'none', cursor: 'pointer',
                fontSize: 'clamp(9px,2.5vw,11px)',
                fontWeight: scope === t.id ? 800 : 500,
                fontFamily: 'DM Sans, system-ui, sans-serif',
                background: scope === t.id ? '#F8FAFC' : 'rgba(255,255,255,0.07)',
                color: scope === t.id ? '#0C0C0E' : 'rgba(255,255,255,0.55)',
                transition: 'all 0.2s',
              }}
              className="active:scale-[0.97] transition-all"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── LIGHT BODY ZONE ── */}
      <div style={{ background: '#F8FAFC', flex: 1, padding: 'clamp(12px,3vw,16px)' }}>

        {/* Club/Country selectors */}
        {scope === 'club' && (
          <div style={{ marginBottom: 12 }}>
            <ClubSearchBar
              selectedClubId={selectedClubId ?? null}
              selectedClubName={selectedClubName ?? null}
              userHomeClubId={userHomeClubId ?? null}
              userHomeClubName={userHomeClubName ?? null}
              onClubSelect={onClubSelect ?? (() => {})}
            />
          </div>
        )}
        {scope === 'country' && (
          <div style={{ marginBottom: 12 }}>
            <CountrySelector
              selectedCountry={selectedCountry ?? null}
              onCountrySelect={onCountrySelect ?? (() => {})}
            />
          </div>
        )}

        {/* Context label */}
        <p className="text-center" style={{ fontSize: 11, color: '#94A3B8', marginBottom: 12 }}>
          {scopeContext}
        </p>

        {/* Insight Banner */}
        <div style={{ marginBottom: 12 }}>
          <HandicapInsightBanner
            userRank={userRank}
            topHandicap={topHandicap}
            userHandicap={userHandicap}
            userId={user?.id}
            scope={scope}
            scopeLabel={scopeLabel}
            mode="lowest"
          />
        </div>

        {/* Band Legend Strip */}
        {allEntries.length > 0 && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }} className="scrollbar-hide">
            {allEntries
              .map(e => getHandicapStatusLabel((e as any).handicap_index))
              .filter((v, i, arr) => v && arr.indexOf(v) === i)
              .map(label => {
                const rep = allEntries.find(e => getHandicapStatusLabel((e as any).handicap_index) === label);
                if (!rep) return null;
                const hcp = (rep as any).handicap_index;
                const badgeStyle = getHandicapBadgeStyle(hcp);
                return (
                  <span key={label} style={{
                    fontSize: 10, fontWeight: 700, borderRadius: 10,
                    padding: '4px 10px', whiteSpace: 'nowrap', flexShrink: 0,
                    background: badgeStyle.bg, color: badgeStyle.text,
                    textTransform: 'uppercase', letterSpacing: '0.3px',
                  }}>
                    {label}
                  </span>
                );
              })}
          </div>
        )}

        {/* Rankings eyebrow */}
        <p className="font-bold uppercase" style={{ fontSize: 10, letterSpacing: '0.12em', color: '#F5A623', marginBottom: 8 }}>
          Rankings
        </p>

        {/* Rankings List */}
        {allEntries.length > 0 && (
          <div ref={listContainerRef} onClick={handleEntryClick}>
            {virtualizedContent ? (
              <div style={{ height: virtualizedContent.totalHeight, position: 'relative' }}>
                <div style={{ transform: `translateY(${virtualizedContent.offsetY}px)`, position: 'absolute', width: '100%' }}>
                  {allEntries.slice(virtualizedContent.startIndex, virtualizedContent.endIndex).map(entry => (
                    <HandicapRow key={entry.user_id} entry={entry} userId={user?.id} />
                  ))}
                </div>
              </div>
            ) : (
              allEntries.map(entry => (
                <HandicapRow key={entry.user_id} entry={entry} userId={user?.id} />
              ))
            )}
          </div>
        )}

        {/* Sentinel + loading */}
        {hasNextPage && !isError && (
          <div ref={sentinelRef}>
            {isFetchingNextPage && <HandicapLeaderboardSkeleton />}
          </div>
        )}

        {/* Inline retry */}
        {isError && !isFetchingNextPage && allEntries.length > 0 && (
          <InlineRetryCard onRetry={() => fetchNextPage()} />
        )}

        {isError && isFetchingNextPage && allEntries.length > 0 && (
          <HandicapLeaderboardSkeleton />
        )}
      </div>
    </div>
  );
}
