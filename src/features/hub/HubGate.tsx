/**
 * HubGate - Conditional Hub renderer
 * 
 * Only renders the Hub when it's truly open (unmounted when closed).
 * This ensures the Hub isn't in the DOM when navigating to full-screen pages.
 */

import { useHub } from './useHub';
import { HubShell } from './HubShell';

export function HubGate() {
  const { isOpen, close } = useHub();
  return isOpen ? <HubShell onClose={close} /> : null;
}
