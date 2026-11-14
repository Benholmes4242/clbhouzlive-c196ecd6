import { useEffect, useMemo, useState } from 'react';
import { cachedAmateurMember, readAmateurMembers, subscribeAmateurMembers } from './amateurMembersCache';

/** Same sibling-row batching lifecycle as useProMembers; failed reads settle
 * without identity rather than throwing into the member-name UI. */
export function useAmateurMembers(userIds: readonly (string | null | undefined)[]) {
  const key = JSON.stringify([...new Set(userIds.filter((id): id is string => !!id))].sort());
  const ids = useMemo(() => JSON.parse(key) as string[], [key]);
  const [revision, setRevision] = useState(0);
  const [loaded, setLoaded] = useState<{ key: string; members: Set<string> } | null>(null);
  useEffect(() => subscribeAmateurMembers(() => { setLoaded(null); setRevision(value => value + 1); }), []);
  useEffect(() => {
    let active = true;
    if (ids.length) void readAmateurMembers(ids).then(members => {
      if (active) setLoaded({ key, members });
    }).catch(() => { if (active) setLoaded({ key, members: new Set() }); });
    return () => { active = false; };
  }, [ids, key, revision]);
  const members = new Set<string>();
  for (const id of ids) {
    const cached = cachedAmateurMember(id);
    if (cached || (cached === undefined && loaded?.key === key && loaded.members.has(id))) members.add(id);
  }
  return { members, isLoading: ids.some(id => cachedAmateurMember(id) === undefined) && loaded?.key !== key };
}