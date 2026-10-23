// CB65 §1 — the actor ONE composer session posts as.
//
// An opener may ask for an initial actor (e.g. "Post as {business}" calls
// openPostStudio({ actorType: 'business', actorId })). That request is honoured
// only when the actor is in availableActors (personal self; owner/admin/editor
// of the business). Anything else is ignored silently and the composer uses the
// app-wide active actor.
//
// Scope: the override lives in component state for this composer mount only.
// It never calls setActiveActor, so ActiveActorContext and the persisted
// `clbhouz_active_actor` are untouched; when the composer unmounts the
// override is gone. Switching inside the composer (ActorSheet) is the normal
// way: it clears the override and sets the global actor as before.
//
// Drafts: a restored draft's stored actor (post_drafts.actor_type/actor_id),
// when available, wins over the initial actor.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useActiveActor } from '@/context/ActiveActorContext';
import type { ActiveActor, ActorType } from '@/types/actor';

export function resolveAvailableActor(
  type: ActorType | null | undefined,
  id: string | null | undefined,
  available: ActiveActor[],
): ActiveActor | null {
  if (!type || !id) return null;
  return available.find((a) => a.type === type && a.id === id) ?? null;
}

export function useComposerActor(opts: {
  initialActorType?: ActorType | null;
  initialActorId?: string | null;
  /** Edit and draft sessions never take the opener's initial actor. */
  ignoreInitial?: boolean;
}) {
  const { activeActor: globalActor, setActiveActor, availableActors } = useActiveActor();
  const [postActor, setPostActor] = useState<ActiveActor | null>(null);
  const seededRef = useRef(false);
  const draftRef = useRef(false);

  // Seed once from the opener, as soon as availableActors can confirm it.
  useEffect(() => {
    if (seededRef.current || draftRef.current || opts.ignoreInitial) return;
    if (!opts.initialActorId) { seededRef.current = true; return; }
    const hit = resolveAvailableActor(opts.initialActorType, opts.initialActorId, availableActors);
    if (hit) { seededRef.current = true; setPostActor(hit); }
  }, [opts.initialActorType, opts.initialActorId, opts.ignoreInitial, availableActors]);

  /** Apply a restored draft's stored actor; it wins over any initial actor. */
  const applyDraftActor = useCallback((type: string | null, id: string | null) => {
    draftRef.current = true;
    seededRef.current = true;
    const hit = resolveAvailableActor(type as ActorType | null, id, availableActors);
    if (hit) setPostActor(hit);
  }, [availableActors]);

  /** The normal in-composer switch: global actor changes, override clears. */
  const selectActor = useCallback((a: ActiveActor) => {
    setPostActor(null);
    setActiveActor(a);
  }, [setActiveActor]);

  return { activeActor: postActor ?? globalActor, selectActor, applyDraftActor };
}
