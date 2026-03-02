import { type LucideIcon } from 'lucide-react';

interface ToolButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  label: string;
}

export function ToolButton({ icon: Icon, onClick, label }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-11 h-11 rounded-[10px] flex items-center justify-center transition-all active:scale-[0.88]"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <Icon className="w-6 h-6" style={{ color: '#f59e0b' }} />
    </button>
  );
}
