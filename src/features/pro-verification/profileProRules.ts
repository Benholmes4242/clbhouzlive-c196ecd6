import type { ProMember } from './proMembersCache';

export function profileProTabs(pro: ProMember | null | undefined, isOwner: boolean, _hasConnection: boolean) {
  const tour = pro?.pro_kind === 'tour_pro' && (!!pro.pro_player_id || isOwner);
  return { tour, handicap: isOwner && !pro };
}
export function showPendingProNote(isOwner: boolean, pending: boolean, pro: ProMember | null | undefined) {
  return isOwner && pending && !pro;
}