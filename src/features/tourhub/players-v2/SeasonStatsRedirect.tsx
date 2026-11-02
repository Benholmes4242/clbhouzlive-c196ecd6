/** /tourhub/season-stats?tour=X → the Players full field, Stats lens (replace). Leaders' season index is retired. */
import { Navigate, useLocation } from 'react-router-dom';
import { seasonStatsRedirect } from './playersRules';

export default function SeasonStatsRedirect() {
  const { search } = useLocation();
  return <Navigate to={seasonStatsRedirect(search)} replace />;
}
