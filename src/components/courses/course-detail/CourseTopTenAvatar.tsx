import { avatarFallbackFill, getInitialsFromName } from '@/lib/avatarFallback';
import type { CourseTopTenMember } from './courseTopTenRules';

/** Local 12px-radius geometry is signed off for this card; the fallback fill stays canonical. */
export function CourseTopTenAvatar({ member, size }: { member: CourseTopTenMember; size: 26 | 36 }) {
  return <span
    className="course-ten-avatar"
    style={{ width: size, height: size, background: avatarFallbackFill(member.user_id), fontSize: size === 26 ? 8 : 12 }}
    aria-hidden="true"
  >
    <span>{getInitialsFromName(member.display_name)}</span>
    {member.avatar_url && <img src={member.avatar_url} alt="" loading="lazy" onError={event => { event.currentTarget.hidden = true; }} />}
  </span>;
}
