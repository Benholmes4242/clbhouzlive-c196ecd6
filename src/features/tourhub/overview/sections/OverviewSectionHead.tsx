import { ChevronRight } from 'lucide-react';
import { FONT, INK, INK_MUTE } from '../../_shared/tokens';

interface OverviewSectionHeadProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function OverviewSectionHead({ title, action, onAction }: OverviewSectionHeadProps) {
  return (
    <div style={{ minHeight: 28, margin: '0 24px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, fontFamily: FONT }}>
      <h2 style={{ margin: 0, fontSize: 20, lineHeight: 1.2, fontWeight: 800, letterSpacing: 0, color: INK }}>{title}</h2>
      {action && onAction ? (
        <button type="button" onClick={onAction} style={{ minHeight: 28, padding: 0, display: 'inline-flex', alignItems: 'center', gap: 2, border: 0, background: 'transparent', color: INK_MUTE, fontFamily: FONT, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          {action}<ChevronRight size={14} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}