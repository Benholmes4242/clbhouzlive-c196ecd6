/**
 * SectionHeader — backward-compatible stub for old edit-v2 components
 */
interface Props {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  sectionType?: string;
}

export function SectionHeader({ title, icon }: Props) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h3 className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted-foreground">
        {title}
      </h3>
    </div>
  );
}
