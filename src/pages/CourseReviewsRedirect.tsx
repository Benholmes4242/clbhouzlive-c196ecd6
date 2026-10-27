/** CB110: legacy review-page bookmarks retain their review/highlight intent;
 * CourseReviewsTab owns landing and parameter consumption, not this redirect.
 */
import { Navigate, useLocation, useParams } from 'react-router-dom';

export default function CourseReviewsRedirect() {
  const { courseId } = useParams<{ courseId: string }>();
  const { search } = useLocation();
  if (!courseId) return <Navigate to="/courses" replace />;
  const params = new URLSearchParams(search);
  params.set('tab', 'reviews');
  params.set('at', 'reviews');
  return <Navigate to={`/courses/${courseId}?${params.toString()}`} replace />;
}