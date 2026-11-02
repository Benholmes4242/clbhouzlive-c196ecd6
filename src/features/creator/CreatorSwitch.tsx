/** CR1 owns one neutral creator switch. Welcome delegates interaction to its
 * whole card, rendering this same track without a nested interactive control. */
import { Button } from '@/components/ui/button';
import './creator.css';
type Props = { checked: boolean; onCheckedChange?: (checked: boolean) => void; label?: string; disabled?: boolean; decorative?: boolean };
export function CreatorSwitch({ checked, onCheckedChange, label = 'Creator profile', disabled, decorative }: Props) {
  const track = <span className="creator-track" data-checked={checked} aria-hidden="true"><i /></span>;
  if (decorative) return <span className="creator-switch-visual">{track}</span>;
  return <Button type="button" variant="ghost" role="switch" aria-label={label} aria-checked={checked} disabled={disabled} className="creator-switch" onClick={() => onCheckedChange?.(!checked)}>{track}</Button>;
}
