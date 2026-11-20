/** Shared wizard accessory; body portal avoids transformed/scrolling ancestors.
 * Material is owned by global keyboard-done tokens, geometry by viewport data.
 */
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { KEYBOARD_DONE_Z } from '@/lib/zLayers';

export interface KeyboardDonePillProps {
  keyboardOpen: boolean;
  keyboardTop: number;
  dismiss: () => void;
}

export function KeyboardDonePill({ keyboardOpen, keyboardTop, dismiss }: KeyboardDonePillProps) {
  if (!keyboardOpen) return null;
  return createPortal(<Button type="button" variant="ghost" className="keyboard-done-pill" aria-label="Close keyboard"
    style={{ bottom: window.innerHeight - keyboardTop + 10, zIndex: KEYBOARD_DONE_Z }}
    onPointerDown={event => { event.preventDefault(); dismiss(); }}>Done</Button>, document.body);
}