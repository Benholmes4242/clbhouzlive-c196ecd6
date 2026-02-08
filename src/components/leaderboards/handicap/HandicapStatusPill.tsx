import { cn } from '@/lib/utils';

// Modern Country Club palette colors - matches getHandicapStatusLabel
const PILL_COLORS: Record<string, { bg: string; text: string }> = {
  'Plus Figure': { bg: 'rgba(193, 168, 76, 0.1)', text: '#C1A84C' },     // Chartreus gold
  'Scratch': { bg: 'rgba(193, 168, 76, 0.1)', text: '#C1A84C' },         // Chartreus gold
  'Single Figure': { bg: 'rgba(51, 78, 61, 0.1)', text: '#334E3D' },     // Emerald
  'Improving': { bg: 'rgba(51, 78, 61, 0.1)', text: '#334E3D' },         // Emerald
  'Active': { bg: 'rgba(229, 208, 161, 0.2)', text: '#92702b' },         // Pale lime / darker text
};

interface HandicapStatusPillProps {
  label: string;
  className?: string;
}

export function HandicapStatusPill({ label, className }: HandicapStatusPillProps) {
  const colors = PILL_COLORS[label] || { bg: 'rgba(100, 116, 139, 0.1)', text: 'hsl(var(--muted-foreground))' };
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium',
        className
      )}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      {label}
    </span>
  );
}