import { Navigate } from 'react-router-dom';

/**
 * Phase 3: Loop content folded into Clubhouse Friends tab.
 * Direct hits to this orphan surface are redirected.
 */
export default function NewLoopTab() {
  return <Navigate to="/clubhouse?tab=friends" replace />;
}
