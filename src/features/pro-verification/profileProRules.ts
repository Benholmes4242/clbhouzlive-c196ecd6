import type { ProMember } from './proMembersCache';

export function profileProTabs(pro: ProMember | null | undefined, isOwner: boolean, hasConnection: boolean) {
  const tour = pro?.pro_kind === 'tour_pro' && (!!pro.pro_player_id || isOwner);
  return { tour, handicap: isOwner && (!tour || hasConnection) };
}
export function showPendingProNote(isOwner: boolean, pending: boolean, pro: ProMember | null | undefined) {
  return isOwner && pending && !pro;
}