/**
 * PickFranchiseSheet — Bottom sheet for discovering and following college franchises.
 * Dispatch flat-row design.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { BottomSheet } from '@/components/ui/BottomSheet';
import SheetHeader from '@/components/ui/SheetHeader';
import { useCollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../../hooks/useCollegeMedia';
import { useFollowedColleges, useFollowCollegeMutations } from '../../hooks/useCollegeMovers';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useCollegeMediaSearch } from '@/hooks/useCollegeMediaSearch';
import { INK_TINT_07 } from '../../_shared/tokens';

interface PickFranchiseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function FollowBtn({
  normalizedName,
  userId,
  isFollowed,
}: {
  normalizedName: string;
  userId: string | undefined;
  isFollowed: boolean;
}) {
  const { follow, unfollow } = useFollowCollegeMutations(userId);
  const isPending = follow.isPending || unfollow.isPending;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;
    if (isFollowed) {
      await unfollow.mutateAsync(normalizedName);
    } else {
      await follow.mutateAsync(normalizedName);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending || !userId}
      style={{
        fontSize: '13px',
        fontWeight: 600,
        borderRadius: '20px',
        padding: '8px 18px',
        background: isFollowed ? '#0F172A' : 'transparent',
        color: isFollowed ? '#ffffff' : '#0F172A',
        border: isFollowed ? 'none' : '1px solid rgba(15,23,42,0.15)',
        cursor: isPending ? 'not-allowed' : 'pointer',
        opacity: isPending ? 0.6 : 1,
        transition: 'all 0.2s ease',
        flexShrink: 0,
      }}
    >
      {isFollowed ? 'Following ✓' : 'Follow'}
    </button>
  );
}

function CollegeRow({
  normalizedName,
  displayName,
  logoUrl,
  playerCount,
  userId,
  isFollowed,
}: {
  normalizedName: string;
  displayName: string;
  logoUrl: string | null;
  playerCount: number;
  userId: string | undefined;
  isFollowed: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: `0.5px solid ${INK_TINT_07}` }}>
      {/* Logo chip */}
      <div style={{ width: 30, height: 30, borderRadius: 8, overflow: 'hidden', background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {logoUrl
          ? <img src={logoUrl} alt={displayName} style={{ width: 22, height: 22, objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
          : <span style={{ fontSize: 12, fontWeight: 900, color: 'rgba(15,23,42,0.3)' }}>{displayName.charAt(0)}</span>
        }
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{displayName}</div>
        <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>{playerCount} {playerCount === 1 ? 'pro' : 'pros'} on tour</div>
      </div>
      {/* Follow button */}
      <FollowBtn normalizedName={normalizedName} userId={userId} isFollowed={isFollowed} />
    </div>
  );
}

export function PickFranchiseSheet({ open, onOpenChange }: PickFranchiseSheetProps) {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: allStats } = useCollegeSeasonStats();
  const { data: collegeMap } = useCollegeMediaMap();
  const { data: searchResults } = useCollegeMediaSearch(searchQuery);

  // Single query for follow state — shared across all rows
  const { data: followed } = useFollowedColleges(user?.id);
  const followedSet = useMemo(
    () => new Set(followed?.map(f => f.normalized_name) || []),
    [followed]
  );

  // Top 20 colleges by earnings for "Popular" list
  const popularColleges = useMemo(() => {
    if (!allStats?.length) return [];
    return [...allStats]
      .sort((a, b) => b.earnings_total - a.earnings_total)
      .slice(0, 20);
  }, [allStats]);

  const isSearching = searchQuery.length >= 2;

  return (
    <BottomSheet
      open={open}
      onClose={() => onOpenChange(false)}
      ariaLabelledBy="pick-franchise-title"
    >
      <div
        className="overflow-y-auto overscroll-contain"
        style={{ maxHeight: 'calc(85dvh - 60px)' }}
      >
        {/* Header */}
        <SheetHeader
          eyebrow="COLLEGE GOLF"
          title={<span id="pick-franchise-title">Pick your franchise</span>}
          sub="Follow a college and join the rivalry."
          onClose={() => onOpenChange(false)}
        />

        {/* Search input */}
        <div style={{ margin: '12px 16px 10px', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(15,23,42,0.04)', borderRadius: 10, padding: '0 12px', height: 40, border: `0.5px solid ${INK_TINT_07}` }}>
          <Search className="w-4 h-4" style={{ color: '#94A3B8', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search colleges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: '#0F172A' }}
          />
        </div>

        {/* Section label */}
        {!isSearching && (
          <div style={{ padding: '8px 16px 6px' }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#64748B', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Popular Franchises</span>
          </div>
        )}

        {/* Search results */}
        {isSearching && searchResults ? (
          searchResults.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94A3B8', padding: '32px 16px', fontSize: 14 }}>
              No colleges found for "{searchQuery}"
            </p>
          ) : (
            searchResults.map((college) => {
              const stats = allStats?.find(s => s.normalized_name === college.normalized_name);
              return (
                <CollegeRow
                  key={college.normalized_name}
                  normalizedName={college.normalized_name}
                  displayName={college.short_name || college.college_name}
                  logoUrl={getCollegeLogoUrl(college.college_name)}
                  playerCount={stats?.player_count ?? 0}
                  userId={user?.id}
                  isFollowed={followedSet.has(college.normalized_name)}
                />
              );
            })
          )
        ) : (
          /* Popular list */
          popularColleges.map((stats) => {
            const media = collegeMap?.get(stats.normalized_name);
            const displayName = media?.short_name || media?.college_name || stats.normalized_name;
            return (
              <CollegeRow
                key={stats.normalized_name}
                normalizedName={stats.normalized_name}
                displayName={displayName}
                logoUrl={getCollegeLogoUrl(media?.college_name || stats.normalized_name)}
                playerCount={stats.player_count}
                userId={user?.id}
                isFollowed={followedSet.has(stats.normalized_name)}
              />
            );
          })
        )}

        {/* View All link */}
        <button
          onClick={() => { onOpenChange(false); navigate('/tourhub/college-golf'); }}
          style={{ width: '100%', padding: '14px 0', background: 'transparent', border: 'none', borderTop: `0.5px solid ${INK_TINT_07}`, fontSize: 12, fontWeight: 700, color: '#F7931E', cursor: 'pointer', marginTop: 4 }}
        >
          View All Franchises →
        </button>
      </div>

      {/* Safe area bottom padding */}
      <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 8px)' }} />
    </BottomSheet>
  );
}
