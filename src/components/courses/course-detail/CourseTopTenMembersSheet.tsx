import { useNavigate } from 'react-router-dom';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer';
import { ProLabel } from '@/features/pro-verification/ProLabel';
import { CourseTopTenAvatar } from './CourseTopTenAvatar';
import { courseTenSheetLine, type CourseTopTenStanding } from './courseTopTenRules';

/** Every server-admitted public ten, already ordered by position, Pros then name. */
export function CourseTopTenMembersSheet({ courseId, courseName, standing, open, onOpenChange }: {
  courseId: string;
  courseName: string;
  standing: CourseTopTenStanding;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  return <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
    <DrawerContent className="clb-ten-sheet course-ten-sheet">
      <DrawerTitle className="clb-ten-sheet-title">In members' top tens</DrawerTitle>
      <DrawerDescription className="clb-ten-sheet-description">
        {courseTenSheetLine(courseName, standing.in_tens, standing.number_ones)}
      </DrawerDescription>
      <div className="course-ten-member-list">
        {standing.members.map(member => <button type="button" className="course-ten-member-row" key={member.user_id}
          onClick={() => {
            onOpenChange(false);
            navigate(`/profile/${encodeURIComponent(member.username || member.user_id)}?tab=courses&course=${encodeURIComponent(courseId)}`);
          }}>
          <CourseTopTenAvatar member={member} size={36} />
          <span className="course-ten-member-text">
            <span className="course-ten-member-name">
              <span className="course-ten-member-name-text">{member.display_name}</span>
              {member.is_pro && <ProLabel userId={member.user_id} name={member.display_name} surface="course-top-ten" />}
            </span>
            <span className="course-ten-member-subline">{member.is_pinned ? 'Picked' : `From ${member.pronoun} ratings`}</span>
          </span>
          <span className="course-ten-member-figure"><b>#{member.position}</b><small>Their ten</small></span>
        </button>)}
      </div>
    </DrawerContent>
  </Drawer>;
}
