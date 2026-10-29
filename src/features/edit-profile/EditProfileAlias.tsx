import { Navigate, useLocation } from 'react-router-dom';
/** Retired preview URL preserves arrival intent. */
export function EditProfileAlias() {
 const location = useLocation();
 return <Navigate to={`/edit-profile${location.search}${location.hash}`} replace />;
}
