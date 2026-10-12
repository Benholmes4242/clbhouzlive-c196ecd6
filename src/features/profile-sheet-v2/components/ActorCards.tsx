/**
 * ProfileSheetV2 · ActorCards — the actor pills (BRIEF_PROFILE_SHEET_REBUILD B).
 *
 * RENDERS ONLY WHEN profiles.length > 1. One actor means this block does not
 * exist — not an empty container, not a single pill, no residual spacing.
 *
 * THIS RAIL CONTAINS IDENTITIES ONLY (BRIEF_ACCOUNT_SHEET_REBUILD D). No
 * creation door here; that rides the "Manage businesses" row.
 *
 * A COUNT APPEARS ONLY ON A NON-ACTIVE ACTOR. The active actor's count belongs
 * on Alerts and nowhere else.
 *
 * ON THIS SHEET A NOTIFICATION COUNT IS WHITE (ground A.INK, figure A.CANVAS),
 * matching QuickActionsRow, which this brief leaves unchanged.
 *
 * The active pill takes the canonical 1px active field border (28% white), not
 * amber: both actors are the viewing member, so amber cannot tell them apart.
 */

import React from 'react';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { useActorUnreadCounts } from '@/hooks/useActorUnreadCounts';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';

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
  /** Kept declared so the opener needs no change; unread. */
  onNavigate?: (route: string) => void;
}

const ACTIVE_BORDER = 'rgba(255,255,255,0.28)';

export default function ActorCards({ currentActor, profiles, onSwitchProfile }: Props) {
  const { countFor } = useActorUnreadCounts();
  const [switchingId, setSwitchingId] = React.useState<string | null>(null);

  const ordered = React.useMemo(() => {
    const indexed = profiles.map((p, i) => ({ p, i }));
    indexed.sort((a, b) => {
      const aa = a.p.id === currentActor.id ? 0 : 1;
      const bb = b.p.id === currentActor.id ? 0 : 1;
      return aa !== bb ? aa - bb : a.i - b.i;
    });
    return indexed.map((x) => x.p);
  }, [profiles, currentActor.id]);

  if (profiles.length <= 1) return null;

  return (
    <div data-actor-pills style={{ display: 'flex', gap: 7, padding: '0 22px 14px', flexWrap: 'wrap', fontFamily: SANS }}>
      {ordered.map((p) => {
        const active = p.id === currentActor.id;
        const unread = active ? 0 : countFor(p.type, p.id);
        const tap = () => {
          if (active || switchingId) return;
          setSwitchingId(p.id);
          Promise.resolve(onSwitchProfile(p.id)).finally(() => setSwitchingId(null));
        };
        return (
          <button
            key={`${p.type}-${p.id}`}
            type="button"
            onClick={tap}
            aria-pressed={active}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, maxWidth: '100%',
              border: `1px solid ${active ? ACTIVE_BORDER : A.BORDER}`, borderRadius: 999,
              padding: '5px 11px 5px 5px', background: A.SOFT, fontFamily: SANS,
              fontSize: 12, fontWeight: 700, color: active ? A.INK : A.MUTE,
              cursor: active ? 'default' : 'pointer',
            }}
          >
            <SquircleAvatar size={22} src={p.avatarUrl} alt={p.name} userId={p.id} hairlineRing ringColor={DARK_HAIRLINE} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
            {unread > 0 && (
              <span
                aria-label={`${unread} unread`}
                style={{
                  minWidth: 17, height: 17, borderRadius: 999, background: A.INK, color: A.CANVAS,
                  fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 5px', fontVariantNumeric: 'tabular-nums',
                }}
              >
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
