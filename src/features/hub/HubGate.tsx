/**
 * Hub Gate
 * 
 * Conditionally renders HubShell based on Hub state.
 * Hub unmounts when closed, providing clean state management.
 */

import { useHub } from './useHub';
import { HubShell } from './HubShell';

export function HubGate() {
  const { isOpen } = useHub();
  return isOpen ? <HubShell /> : null;
}
