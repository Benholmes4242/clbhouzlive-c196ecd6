/**
 * SectionHeader — backward-compatible stub for old edit-v2 components
 */
interface Props {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  sectionType?: string;
}

export function SectionHeader({ title }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
      <div style={{ width: 3, height: 10, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
      <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
        {title}
      </span>
    </div>
  );
}