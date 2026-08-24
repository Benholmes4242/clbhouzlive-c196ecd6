/**
 * ProfileSheetV2 · ActorCards
 *
 * Horizontal rail of "posting as" actor cards. Selection is marked with a 2px
 * INK border (amber means the viewing member, and BOTH cards are the viewing
 * member, so amber cannot tell them apart); inactive cards tap to switch. Per-actor unread
 * badges (notifications + DMs) via useActorUnreadCounts. A trailing
 * dashed "+ Business" door is rendered ONLY when the user has no
 * business actors yet.
 *
 * ON THIS SHEET A NOTIFICATION COUNT IS WHITE (ground A.INK, figure
 * A.CANVAS). Amber still means the viewing member app-wide, and still marks
 * a BUSINESS actor here (:156). The two must not be confused, which is
 * exactly why the counts moved off amber.
 */

import React from 'react';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { useActorUnreadCounts } from '@/hooks/useActorUnreadCounts';

import { A } from '@/features/courses/components/holes/analytical/tokens';

const DOT = '\u00B7';

export interface ActorCardsProfile {
  id: string;
  type: 'personal' | 'business';
  name: string;
  avatarUrl?: string;
  subtitle?: string;
  username?: string | null;
}

export interface ActorCardsCurrent {
  id: string;
  type: 'personal' | 'business';
}

interface Props {
  currentActor: ActorCardsCurrent;
  profiles: ActorCardsProfile[];
  onSwitchProfile: (id: string) => void | Promise<void>;
  onNavigate: (route: string) => void;
}

export default function ActorCards({
  currentActor,
  profiles,
  onSwitchProfile,
  onNavigate,
}: Props) {
  const { countFor } = useActorUnreadCounts();
  const [switchingId, setSwitchingId] = React.useState<string | null>(null);
  const hasBusiness = profiles.some(p => p.type === 'business');
  // Active actor first; preserve original order for the rest (stable sort).
  const orderedProfiles = React.useMemo(() => {
    const indexed = profiles.map((p, i) => ({ p, i }));
    indexed.sort((a, b) => {
      const aActive = a.p.id === currentActor.id ? 0 : 1;
      const bActive = b.p.id === currentActor.id ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return a.i - b.i;
    });
    return indexed.map(x => x.p);
  }, [profiles, currentActor.id]);

  return (
    <div>
      <div
        style={{
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: A.INK,
          padding: '0 20px 8px',
        }}
      >
        POSTING AS
      </div>
      <div
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          padding: '12px 20px 2px',
          marginTop: -12,
          scrollbarWidth: 'none',
        }}
        className="ps2-no-scrollbar"
      >
        <style>{`.ps2-no-scrollbar::-webkit-scrollbar{display:none}`}</style>

        {orderedProfiles.map((p) => {
          const active = p.id === currentActor.id;
          const unread = countFor(p.type, p.id);
          const sub = p.type === 'personal'
            ? [p.username ? `@${p.username}` : (p.subtitle || ''), 'personal']
                .filter(Boolean).join(` ${DOT} `)
            : ['business', unread > 0 ? `${unread} unread` : null]
                .filter(Boolean).join(` ${DOT} `);
          const initial = (p.name?.[0] || '?').toUpperCase();

          const handleCardTap = () => {
            if (active || switchingId) return;
            setSwitchingId(p.id);
            Promise.resolve(onSwitchProfile(p.id)).finally(() => setSwitchingId(null));
          };

          return (
            <div
              key={`${p.type}-${p.id}`}
              onClick={handleCardTap}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardTap();
                }
              }}
              role="button"
              tabIndex={0}
              style={{
                position: 'relative',
                flexShrink: 0,
                width: 220,
                background: A.PANEL,
                borderRadius: 16,
                padding: active ? 13 : 14,
                display: 'flex',
                flexDirection: 'row',
                gap: 12,
                alignItems: 'center',
                cursor: active ? 'default' : 'pointer',
                // 2px INK when selected; the padding above compensates so the
                // cards never shift as selection moves.
                border: active
                  ? `2px solid ${A.INK}`
                  : `1px solid ${A.BORDER}`,
                opacity: switchingId === p.id ? 0.55 : 1,
                transition: 'opacity 120ms ease',
              }}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {p.avatarUrl ? (
                  <SquircleAvatar
                    size={42}
                    src={p.avatarUrl}
                    alt={p.name}
                    hairlineRing
                    ringColor={DARK_HAIRLINE}
                  />
                ) : (
                  <div style={{ position: 'relative', width: 42, height: 42, flexShrink: 0 }}>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '34%',
                        overflow: 'hidden',
                        background: p.type === 'business' ? A.INK : A.TRACK,
                        color: p.type === 'business' ? A.AMBER : A.MUTE,
                        fontWeight: 700,
                        fontSize: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {initial}
                    </div>
                    {/* Canonical 1px traced hairline on the dark actor card. */}
                    <div
                      aria-hidden
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '34%',
                        border: `1px solid ${A.BORDER}`,
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: A.INK,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.name}
                </div>
                <div
                  style={{
                    fontWeight: 500,
                    fontSize: 11,
                    color: A.MUTE,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: 2,
                  }}
                >
                  {sub}
                </div>
              </div>
              {unread > 0 && (
                <div
                  aria-label={`${unread} unread`}
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    minWidth: 18,
                    height: 18,
                    padding: '0 5px',
                    borderRadius: 999,
                    // ON THIS SHEET A NOTIFICATION COUNT IS WHITE.
                    background: A.INK,
                    color: A.CANVAS,
                    fontWeight: 700,
                    fontSize: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px solid ${A.PANEL}`,
                    boxSizing: 'content-box',
                  }}
                >
                  {unread > 99 ? '99+' : unread}
                </div>
              )}
            </div>
          );
        })}

        {!hasBusiness && (
          <div
            onClick={() => onNavigate('/businesses/manage')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onNavigate('/businesses/manage');
              }
            }}
            role="button"
            tabIndex={0}
            style={{
              flexShrink: 0,
              width: 92,
              border: `1.5px dashed ${A.BORDER}`,
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: '13px 8px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 16, color: A.AMBER_DEEP, lineHeight: 1 }}>
              +
            </div>
            <div style={{ fontWeight: 600, fontSize: 10, color: A.MUTE, marginTop: 4 }}>
              Business
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
