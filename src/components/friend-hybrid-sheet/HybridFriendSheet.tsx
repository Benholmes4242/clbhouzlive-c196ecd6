/**
 * HybridFriendSheet — Vaul bottom sheet built against get_friend_hybrid_snapshot.
 *
 * Sections (top→bottom):
 *   1. Drag handle
 *   2. Header — squircle avatar, name, username, friendship pill
 *   3. Clbhouz snapshot — bio, posts/followers/mutuals, recent post line
 *   4. Hairline divider
 *   5. Handicap snapshot — synced (value + trend chip + chips + last round)
 *      OR non-synced (lock icon + conversion copy + social proof)
 *   6. Sticky footer — primary + secondary CTAs
 *
 * Spec: Proposal B+E1.
 */
import React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { useNavigate } from 'react-router-dom';
import { X, Lock, ChevronRight } from 'lucide-react';
import { useFriendHybridSnapshot } from '@/lib/whs/hooks/useFriendHybridSnapshot';
import { firstName } from '@/lib/whs/share';
import { analyticsEvents } from '@/utils/analyticsEvents';

const AMBER = '#F7931E';
const INK_100 = '#0F172A';
const INK_60 = '#64748B';
const INK_40 = '#94A3B8';
const INK_30 = '#CBD5E1';
const GREEN = '#059669';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const SURFACE = '#FFFFFF';
const BG_TINT = '#F8FAFC';
const FONT = '"Geist", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface Props {
  viewerUserId: string;
  targetUserId: string;
  source?: string;
  open: boolean;
  onClose: () => void;
}

export const HybridFriendSheet: React.FC<Props> = ({
  viewerUserId,
  targetUserId,
  source,
  open,
  onClose,
}) => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useFriendHybridSnapshot(viewerUserId, targetUserId);

  React.useEffect(() => {
    if (open) {
      analyticsEvents.track?.('friend_hybrid_sheet_opened', {
        viewer_id: viewerUserId,
        target_id: targetUserId,
        source,
      });
    }
  }, [open, viewerUserId, targetUserId, source]);

  const profile = data?.profile;
  const social = data?.social;
  const hcp = data?.handicap;
  const recentPost = data?.recent_post;

  const name = profile?.display_name ?? 'Golfer';
  const first = firstName(name) || 'this golfer';
  const friendshipPill = (() => {
    if (!social) return null;
    if (social.is_friend) return 'Friends';
    if (social.is_following && social.mutual_count > 0) return 'Mutual';
    if (social.is_following) return 'Following';
    return 'Stranger';
  })();

  const handleViewProfile = () => {
    onClose();
    navigate(`/profile/${profile?.username ?? targetUserId}`);
  };
  const handleViewHandicap = () => {
    onClose();
    navigate(`/handicap/${targetUserId}`);
  };

  return (
    <DrawerPrimitive.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 80,
          }}
        />
        <DrawerPrimitive.Content
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 81,
            background: SURFACE,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '70vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: FONT,
            color: INK_100,
          }}
        >
          <DrawerPrimitive.Title className="sr-only">{name}</DrawerPrimitive.Title>
          <DrawerPrimitive.Description className="sr-only">
            Friend hybrid profile snapshot
          </DrawerPrimitive.Description>

          {/* Drag handle */}
          <div aria-hidden style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px', flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.18)' }} />
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              zIndex: 3,
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: BG_TINT,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} color={INK_100} strokeWidth={2.4} />
          </button>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {/* Header */}
            <div style={{ padding: '12px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '34%',
                  overflow: 'hidden',
                  background: BG_TINT,
                  flexShrink: 0,
                }}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <PlaceholderSilhouette />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: INK_100, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
                  {name}
                </h2>
                {profile?.username && profile.username !== profile.display_name && (
                  <div style={{ fontSize: 15, color: INK_60, marginTop: 2 }}>@{profile.username}</div>
                )}
              </div>
              {friendshipPill && (
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: BG_TINT,
                    fontSize: 11,
                    fontWeight: 700,
                    color: INK_60,
                    letterSpacing: '0.04em',
                    flexShrink: 0,
                    border: `1px solid ${HAIRLINE}`,
                  }}
                >
                  {friendshipPill}
                </span>
              )}
            </div>

            {/* Loading / error */}
            {isLoading && <SkeletonBody />}
            {error && (
              <div style={{ padding: '20px', color: INK_60, fontSize: 14 }}>
                Couldn't load profile snapshot.
              </div>
            )}

            {/* Clbhouz snapshot */}
            {!isLoading && !error && data && (
              <div style={{ padding: '4px 20px 18px' }}>
                <Eyebrow label="CLBHOUZ" />
                {profile?.bio && (
                  <p
                    style={{
                      margin: '8px 0 12px',
                      fontSize: 15,
                      color: INK_100,
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {profile.bio}
                  </p>
                )}
                <MetricStrip
                  items={[
                    { label: 'POSTS', value: social?.posts_count ?? 0 },
                    { label: 'FOLLOWERS', value: social?.followers_count ?? 0 },
                    { label: 'MUTUALS', value: social?.mutual_count ?? 0 },
                  ]}
                />
                {recentPost && (
                  <div style={{ marginTop: 10, fontSize: 12, color: INK_60, fontStyle: 'italic' }}>
                    Posted {fmtRelative(recentPost.created_at)} · {excerpt(recentPost.content, 30)}
                  </div>
                )}
              </div>
            )}

            {/* Divider */}
            {!isLoading && !error && data && (
              <div style={{ height: 1, background: HAIRLINE, margin: '0 0 14px' }} />
            )}

            {/* Handicap snapshot */}
            {!isLoading && !error && hcp && (
              hcp.is_synced ? (
                <SyncedHandicap hcp={hcp} />
              ) : (
                <NonSyncedHandicap first={first} syncedFriends={data?.synced_friends_count ?? 0} />
              )
            )}

            <div style={{ height: 8 }} />
          </div>

          {/* Sticky footer */}
          {!isLoading && !error && data && (
            <div
              style={{
                flexShrink: 0,
                borderTop: `1px solid ${HAIRLINE}`,
                padding: '12px 16px',
                paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
                display: 'flex',
                gap: 12,
                background: SURFACE,
              }}
            >
              <FooterButton variant="secondary" onClick={handleViewProfile}>
                View profile
              </FooterButton>
              <FooterButton
                variant="primary"
                onClick={hcp?.is_synced ? handleViewHandicap : handleViewProfile}
              >
                {hcp?.is_synced ? 'See full handicap' : 'Nudge to sync'}
              </FooterButton>
            </div>
          )}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────

const Eyebrow: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: AMBER }} />
    <span
      style={{
        fontSize: 13,
        fontWeight: 800,
        color: AMBER,
        letterSpacing: '0.14em',
      }}
    >
      {label}
    </span>
  </div>
);

const MetricStrip: React.FC<{ items: { label: string; value: number | string }[] }> = ({ items }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${items.length}, 1fr)`,
      background: BG_TINT,
      border: `1px solid ${HAIRLINE}`,
      borderRadius: 12,
      padding: '12px 0',
    }}
  >
    {items.map((it, i) => (
      <div
        key={it.label}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          borderLeft: i > 0 ? `1px solid ${HAIRLINE}` : 'none',
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 900, color: INK_100, fontVariantNumeric: 'tabular-nums' }}>
          {it.value}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: INK_60, letterSpacing: '0.10em' }}>{it.label}</span>
      </div>
    ))}
  </div>
);

const SyncedHandicap: React.FC<{ hcp: NonNullable<ReturnType<typeof useFriendHybridSnapshot>['data']>['handicap'] }> = ({ hcp }) => {
  const delta = hcp.trend_delta;
  let chip: { label: string; bg: string; color: string } | null = null;
  if (delta != null) {
    if (delta < -0.3) chip = { label: `↓ ${Math.abs(delta).toFixed(1)}`, bg: 'rgba(5,150,105,0.10)', color: GREEN };
    else if (delta > 0.3) chip = { label: `↑ ${Math.abs(delta).toFixed(1)}`, bg: 'rgba(247,147,30,0.12)', color: AMBER };
    else chip = { label: '→ flat', bg: BG_TINT, color: INK_40 };
  }

  return (
    <div style={{ padding: '0 20px 18px' }}>
      <Eyebrow label="HANDICAP" />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
        <span style={{ fontSize: 48, fontWeight: 900, color: INK_100, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
          {hcp.handicap_index?.toFixed(1) ?? '—'}
        </span>
        {chip && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              padding: '4px 8px',
              borderRadius: 999,
              background: chip.bg,
              color: chip.color,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {chip.label}
          </span>
        )}
      </div>
      <div style={{ marginTop: 12 }}>
        <MetricStrip
          items={[
            { label: 'BADGES', value: hcp.badges_earned },
            { label: 'STREAKS', value: hcp.active_streaks },
            { label: 'SHARED', value: hcp.shared_rounds },
          ]}
        />
      </div>
      {hcp.last_round && (
        <div style={{ marginTop: 10, fontSize: 12, color: INK_60 }}>
          Last round — {hcp.last_round.course_name ?? 'Course'}
          {hcp.last_round.adjusted_gross != null && <>, {hcp.last_round.adjusted_gross}</>}
          {hcp.last_round.play_date && <>, {fmtRelative(hcp.last_round.play_date)}</>}
        </div>
      )}
    </div>
  );
};

const NonSyncedHandicap: React.FC<{ first: string; syncedFriends: number }> = ({ first, syncedFriends }) => (
  <div style={{ padding: '0 20px 18px' }}>
    <Eyebrow label="HANDICAP" />
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '12px 0 4px' }}>
      <Lock size={48} color={INK_30} strokeWidth={1.6} />
      <div style={{ fontSize: 16, fontWeight: 700, color: INK_100 }}>Not synced yet</div>
      <p style={{ margin: 0, fontSize: 14, color: INK_60, textAlign: 'center', lineHeight: 1.4, maxWidth: 320 }}>
        If {first} syncs their England Golf handicap, you'll see their live index, recent rounds, achievements, and head-to-head record.
      </p>
      {syncedFriends > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: INK_60, fontStyle: 'italic', marginTop: 4 }}>
          {syncedFriends} of your friends are already synced
          <ChevronRight size={14} />
        </div>
      )}
    </div>
  </div>
);

const FooterButton: React.FC<{
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}> = ({ variant, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      flex: 1,
      height: 48,
      borderRadius: 12,
      fontFamily: FONT,
      fontSize: 14,
      fontWeight: 700,
      cursor: 'pointer',
      border: variant === 'primary' ? 'none' : `1px solid ${HAIRLINE}`,
      background: variant === 'primary' ? INK_100 : SURFACE,
      color: variant === 'primary' ? '#FFFFFF' : INK_100,
    }}
  >
    {children}
  </button>
);

const SkeletonBody: React.FC = () => (
  <div style={{ padding: '0 20px 20px' }}>
    {[60, 80, 140, 40].map((h, i) => (
      <div
        key={i}
        className="animate-pulse"
        style={{ height: h, background: BG_TINT, borderRadius: 12, marginBottom: 10 }}
      />
    ))}
  </div>
);

const PlaceholderSilhouette: React.FC = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" aria-hidden="true" style={{ display: 'block', opacity: 0.45 }}>
    <circle cx="32" cy="25" r="11" fill={INK_30} />
    <path d="M11 64 C 11 48, 21 40, 32 40 C 43 40, 53 48, 53 64 Z" fill={INK_30} />
  </svg>
);

// ─── Utils ────────────────────────────────────────────────────────────────

function excerpt(text: string | null, n: number): string {
  if (!text) return '';
  const t = text.trim();
  return t.length > n ? `${t.slice(0, n).trim()}…` : t;
}

function fmtRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (!isFinite(then)) return '';
  const diffMin = Math.round((Date.now() - then) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `${diffD}d ago`;
  const diffMo = Math.round(diffD / 30);
  if (diffMo < 12) return `${diffMo}mo ago`;
  const diffY = Math.round(diffMo / 12);
  return `${diffY}y ago`;
}

export default HybridFriendSheet;
