/**
 * CB61: one player-row door for round/review sheets and the swipe preview.
 * Preview doors are spans, never disabled/focusable buttons or no-op handlers.
 * The absolute hit area adds 7px above/below without changing row layout.
 */
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { A } from '@/features/courses/components/holes/analytical/tokens';

interface SheetDoorButtonProps {
  label: string;
  icon: LucideIcon;
  door: 'course' | 'profile';
  onClick?: () => void;
  inert?: boolean;
}

export function SheetDoorButton({ label, icon: Icon, door, onClick, inert = false }: SheetDoorButtonProps) {
  const content = <><Icon size={14} strokeWidth={1.9} aria-hidden="true" /><span>{label}</span></>;
  if (inert) {
    return <span className="sheet-door-button" data-sheet-door={door} aria-hidden="true" style={{ color: A.INK }}>{content}</span>;
  }
  return (
    <Button type="button" variant="ghost" className="sheet-door-button" data-sheet-door={door} onClick={onClick} style={{ color: A.INK }}>
      <span className="sheet-door-hit-area" aria-hidden="true" />
      {content}
    </Button>
  );
}