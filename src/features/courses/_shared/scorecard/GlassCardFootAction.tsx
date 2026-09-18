import type { LucideIcon } from 'lucide-react';

import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';

interface GlassCardFootActionProps {
  label: string;
  onClick: () => void;
  icon: LucideIcon;
  disabled?: boolean;
}

export function GlassCardFootAction({ label, onClick, icon: Icon, disabled = false }: GlassCardFootActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        minHeight: 44,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        background: 'none',
        border: 0,
        padding: 2,
        color: A.INK,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        fontFamily: SANS,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <Icon size={17} strokeWidth={1.75} />
      <span style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase', color: A.MUTE }}>
        {label}
      </span>
    </button>
  );
}

export default GlassCardFootAction;