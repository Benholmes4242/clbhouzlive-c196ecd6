import { Navigate, useParams } from 'react-router-dom';

/**
 * Redirects /profile/:username/friends to the unified Following page with the
 * Friends filter active. The legacy URL is preserved for backward compatibility
 * (bookmarks, external links).
 *
 * Mirror of the FollowingListPage redirect pattern.
 */
export default function FriendsRedirectToFollowing() {
  const { username } = useParams<{ username: string }>();
  if (!username) return <Navigate to="/" replace />;
  return (
    <Navigate
      to={`/profile/${username}/followers?tab=following&filter=friends`}
      replace
    />
  );
}
