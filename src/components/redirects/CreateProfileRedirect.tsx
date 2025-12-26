import { Navigate, useLocation } from 'react-router-dom';

/**
 * Redirect from legacy /create-profile to /edit-profile
 * Preserves query params for any edge cases
 */
const CreateProfileRedirect = () => {
  const location = useLocation();
  const newPath = `/edit-profile${location.search}`;
  
  return <Navigate to={newPath} replace />;
};

export default CreateProfileRedirect;
