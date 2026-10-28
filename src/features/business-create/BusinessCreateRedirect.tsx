/** Old draft URL remains a query-preserving alias, never a second flow. */
import { Navigate, useLocation } from 'react-router-dom';
export default function BusinessCreateRedirect() {
  const location = useLocation();
  return <Navigate to={`/business/create${location.search}`} replace />;
}