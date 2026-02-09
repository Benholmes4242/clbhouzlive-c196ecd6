import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * Redirects /profile/:username/following to /profile/:username/followers?tab=following
 * The Following tab is now embedded inside the Followers page.
 */
const FollowingListPage = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (username) {
      navigate(`/profile/${username}/followers?tab=following`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [username, navigate]);

  return null;
};

export default FollowingListPage;
