import { useParams } from 'react-router-dom';
import CourseMediaTabNew from '@/components/course-media-tab/CourseMediaTabNew';
import PageRoot from '@/components/layout/PageRoot';

export default function CourseMediaTestPage() {
  const { courseId } = useParams<{ courseId: string }>();
  if (!courseId) return null;
  return (
    <PageRoot>
      <div className="min-h-screen bg-background">
        <CourseMediaTabNew courseId={courseId} courseName="Test Course" />
      </div>
    </PageRoot>
  );
}
