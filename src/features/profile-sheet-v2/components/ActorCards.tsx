/**
 * ProfileSheetV2 · ActorCards — the actor SWITCH LINE (BRIEF_SHEET_TOP_V5 G.2).
 *
 * RENDERS ONLY WHEN profiles.length > 1. One actor means this block does not
 * exist — not an empty container, no residual spacing.
 *
 * THE ACTIVE ACTOR IS NOT RENDERED. Its name and face are already in the
 * identity header directly above. What remains is the switch: the other
 * actor's 19px avatar, "Switch to {name}", and that actor's unread count.
 * With three or more actors it reads "Switch actor", the count is the SUM
 * across every non-active actor, and pressing it opens the list of actors
 * rather than switching blind.
 *
 * A COUNT APPEARS ONLY FOR NON-ACTIVE ACTORS. The active actor's count belongs
 * on Alerts and nowhere else.
 *
 * ON THIS SHEET A NOTIFICATION COUNT IS WHITE (ground A.INK, figure A.CANVAS).
 * It never takes amber.
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

function Count({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span
      data-switch-count
      aria-label={`${n} unread`}
      style={{
        minWidth: 15, height: 15, borderRadius: 999, background: A.INK, color: A.CANVAS,
        fontSize: 9.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 4px', fontVariantNumeric: 'tabular-nums', flex: 'none',
      }}
    >
      {n > 99 ? '99+' : n}
    </span>
  );
}

function SwitchPill({ avatar, label, count, onClick, expanded }: {
  avatar?: ActorCardsProfile; label: string; count: number; onClick: () => void; expanded?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: '100%',
        border: `1px solid ${A.TRACK}`, borderRadius: 999, padding: '3px 10px 3px 3px',
        background: A.SOFT, fontFamily: SANS, cursor: 'pointer',
      }}
    >
      {avatar ? (
        <SquircleAvatar size={19} src={avatar.avatarUrl} alt={avatar.name} userId={avatar.id} hairlineRing ringColor={DARK_HAIRLINE} />
      ) : (
        <span aria-hidden style={{ width: 19, height: 19, borderRadius: 6, background: A.TRACK, flex: 'none' }} />
      )}
      <span style={{ fontSize: 11.5, fontWeight: 700, color: A.MUTE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label}
      </span>
      <Count n={count} />
    </button>
  );
}

export default function ActorCards({ currentActor, profiles, onSwitchProfile }: Props) {
  const { countFor } = useActorUnreadCounts();
  const [switching, setSwitching] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  if (profiles.length <= 1) return null;

  const others = profiles.filter((p) => p.id !== currentActor.id);
  const switchTo = (id: string) => {
    if (switching) return;
    setSwitching(true);
    Promise.resolve(onSwitchProfile(id)).finally(() => setSwitching(false));
  };

  const wrap: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '0 22px 12px', fontFamily: SANS,
  };

  if (others.length === 1) {
    const o = others[0];
    return (
      <div data-actor-switch style={wrap}>
        <SwitchPill avatar={o} label={`Switch to ${o.name}`} count={countFor(o.type, o.id)} onClick={() => switchTo(o.id)} />
      </div>
    );
  }

  // Three or more actors: one control, summed count, opens the list.
  const total = others.reduce((s, p) => s + countFor(p.type, p.id), 0);
  return (
    <div data-actor-switch style={wrap}>
      <SwitchPill label="Switch actor" count={total} expanded={open} onClick={() => setOpen((v) => !v)} />
      {open && others.map((p) => (
        <SwitchPill key={`${p.type}-${p.id}`} avatar={p} label={p.name} count={countFor(p.type, p.id)} onClick={() => switchTo(p.id)} />
      ))}
    </div>
  );
}
