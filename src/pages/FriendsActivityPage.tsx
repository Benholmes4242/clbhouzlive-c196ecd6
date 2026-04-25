import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * /friends-activity is preserved as a redirect for legacy deep links.
 *
 * The Friends Activity surface was migrated to NetworkCoursesSheet — a
 * bottom sheet that opens from the Your Network section on Courses › Explore.
 * Direct visits to /friends-activity teleport users to the sheet's open state.
 */
const FriendsActivityPage: React.FC = () => {
  return <Navigate to="/courses?network=open" replace />;
};

export default FriendsActivityPage;
