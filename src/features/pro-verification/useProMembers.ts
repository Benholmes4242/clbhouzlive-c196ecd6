import { useEffect, useMemo, useState } from 'react';
import { cachedProMember, readProMembers, subscribeProMembers, type ProMember } from './proMembersCache';

/** Per-id cache and cross-component batch ownership live in proMembersCache.
 * Screens may pass all visible ids; independently mounted rows are coalesced
 * into the same public RPC instead of issuing one network read per label. */
export function useProMembers(userIds: readonly (string | null | undefined)[]) {
  const key = JSON.stringify([...new Set(userIds.filter((id): id is string => !!id))].sort());
  const ids = useMemo(() => JSON.parse(key) as string[], [key]);
  const [revision, setRevision] = useState(0);
  const [loaded, setLoaded] = useState<{ key: string; members: Map<string, ProMember | null> } | null>(null);
  useEffect(() => subscribeProMembers(() => { setLoaded(null); setRevision(v => v + 1); }), []);
  useEffect(() => {
    let active = true;
    if (ids.length) void readProMembers(ids).then(members => {
      if (active) setLoaded({ key, members });
    }).catch(() => { if (active) setLoaded({ key, members: new Map() }); });
    return () => { active = false; };
  }, [ids, key, revision]);
  const members = new Map<string, ProMember>();
  for (const id of ids) {
    const member = cachedProMember(id) ?? (loaded?.key === key ? loaded.members.get(id) : null);
    if (member) members.set(id, member);
  }
  return { members, isLoading: ids.some(id => cachedProMember(id) === undefined) && loaded?.key !== key };
}