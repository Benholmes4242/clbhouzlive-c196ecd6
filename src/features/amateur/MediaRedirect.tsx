import { Navigate, useSearchParams } from 'react-router-dom';

/** CM1: legacy Media addresses only select a Watch chip; no library reads. */
export function MediaRedirect() {
  const [params] = useSearchParams();
  const kind = params.get('kind');
  const watch = kind === 'clips' ? 'quick' : kind === 'longer' ? 'long' : 'community';
  return <Navigate to={`/amateur?view=watch&watch=${watch}`} replace />;
}