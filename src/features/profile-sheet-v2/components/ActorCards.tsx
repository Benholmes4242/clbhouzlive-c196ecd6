/**
 * ProfileSheetV2 · ActorCards
 *
 * Horizontal rail of "posting as" actor cards. Selection is marked with the
 * canonical 1px active border (amber means the viewing member, and BOTH cards are the viewing
 * member, so amber cannot tell them apart); inactive cards tap to switch. Per-actor unread
 * badges (notifications + DMs) via useActorUnreadCounts.
 *
 * THIS RAIL CONTAINS IDENTITIES ONLY (BRIEF_ACCOUNT_SHEET_REBUILD D). The
 * dashed "+ Business" creation tile was removed to SheetNavGroup's business
 * row, and the personal card no longer prints the account email.

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
  /** D2 removed this rail's only navigation (the dashed tile). The prop stays
   *  declared so the opener needs no change; it is currently unread. */
  onNavigate?: (route: string) => void;
}


export default function ActorCards({
  currentActor,
  profiles,
  onSwitchProfile,
}: Props) {
  const { countFor } = useActorUnreadCounts();
  const [switchingId, setSwitchingId] = React.useState<string | null>(null);

  /* BRIEF_ACCOUNT_SHEET_REBUILD D3 — CARD WIDTH IS A FUNCTION OF ACTOR COUNT.
     A peek is an affordance for content past the fold; with exactly two actors
     there is nothing past it, so a fixed 220 showed a truncated tile
     advertising nothing (2 x 220 + 10 gap + 40 side padding = 470 against a
     390pt screen). Two or fewer actors therefore get a width that FITS:
     (390 - 40 padding - 10 gap) / 2 = 170, taken as 168 to leave 2px slack for
     any narrower device. Three or more keeps 220, so the third genuinely peeks
     and the rail scrolls because something really is past the edge. */
  const CARD_W = profiles.length <= 2 ? 168 : 220;


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
          fontSize: 11,
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
          /* BRIEF_ACCOUNT_SHEET_REBUILD D1 — NO EMAIL ON THE PERSONAL CARD.
             The second line was `@username · personal`, falling back to the
             account EMAIL when a member has no username. The email is what
             clipped at the screen edge, and it is the member's own address on
             their own account sheet — the least useful string available. With
             no username the line is simply "personal". `subtitle` is no longer
             read here; the opener still passes it and it is now inert. */
          const sub = p.type === 'personal'
            ? [p.username ? `@${p.username}` : null, 'personal']
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
                width: CARD_W,
                background: A.PANEL,
                borderRadius: 16,
                padding: 14,
                display: 'flex',
                flexDirection: 'row',
                gap: 12,
                alignItems: 'center',
                cursor: active ? 'default' : 'pointer',
                // One border weight in both states — the selected card carries
                // the canonical active field border (1px at 28% white) and the
                // inactive card A.BORDER. Because both are 1px there is nothing
                // to compensate for, so padding is a constant 14 and the cards
                // never shift as selection moves.
                border: active
                  ? '1px solid rgba(255,255,255,0.28)'
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
                    userId={p.id}
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
                    fontSize: 15,
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
                    fontSize: 13,
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
                    fontSize: 11,
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

        {/* BRIEF_ACCOUNT_SHEET_REBUILD D2 — THE DASHED "+ BUSINESS" TILE IS
            GONE FROM THIS RAIL. Creating a business is account creation, not an
            identity, so it does not belong in an identity switcher; it also
            took the second slot, which is why a scrolled sheet opened on a
            dashed tile. It now rides the existing "Manage businesses" row in
            SheetNavGroup as the subtitle "Create a business profile". Do not
            put a creation door back in this rail. */}

      </div>
    </div>
  );
}
