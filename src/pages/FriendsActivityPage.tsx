import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * /friends-activity is preserved as a redirect for legacy deep links.
 * The dedicated friend-activity destination was removed; legacy visits now
 * land on the Courses Explore tab.
 */
const FriendsActivityPage: React.FC = () => {
  return <Navigate to="/courses" replace />;
};

export default FriendsActivityPage;
