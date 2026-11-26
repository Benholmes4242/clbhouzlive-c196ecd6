import { useEffect, useMemo, useState } from 'react';
import { cachedVerifiedMember, readVerifiedMembers, subscribeVerifiedMembers } from './verifiedMembersCache';

/** Brief 40: same lifecycle as useAmateurMembers; failed reads settle
 * without identity rather than throwing into the member-name UI. */
export function useVerifiedMembers(userIds: readonly (string | null | undefined)[]) {
  const key = JSON.stringify([...new Set(userIds.filter((id): id is string => !!id))].sort());
  const ids = useMemo(() => JSON.parse(key) as string[], [key]);
  const [revision, setRevision] = useState(0);
  const [loaded, setLoaded] = useState<{ key: string; members: Set<string> } | null>(null);
  useEffect(() => subscribeVerifiedMembers(() => { setLoaded(null); setRevision(value => value + 1); }), []);
  useEffect(() => {
    let active = true;
    if (ids.length) void readVerifiedMembers(ids).then(members => {
      if (active) setLoaded({ key, members });
    }).catch(() => { if (active) setLoaded({ key, members: new Set() }); });
    return () => { active = false; };
  }, [ids, key, revision]);
  const members = new Set<string>();
  for (const id of ids) {
    const cached = cachedVerifiedMember(id);
    if (cached || (cached === undefined && loaded?.key === key && loaded.members.has(id))) members.add(id);
  }
  return { members, isLoading: ids.some(id => cachedVerifiedMember(id) === undefined) && loaded?.key !== key };
}