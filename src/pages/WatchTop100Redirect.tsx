/** Brief 42A — /watch/top100 retired; old shared links replace to the video page on For you. */
import { Navigate } from 'react-router-dom';
export const WATCH_TOP100_REDIRECT = '/amateur?view=watch&watch=all';
export function WatchTop100Redirect() { return <Navigate to={WATCH_TOP100_REDIRECT} replace />; }
