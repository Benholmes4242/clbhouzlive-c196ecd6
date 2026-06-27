/**
 * SectionHeader — backward-compat shim over the canonical SectionHeader primitive.
 * Existing edit-v2 consumers (GolfInfoSection) keep working; new code should
 * import SectionHeader directly from @/components/ui/SectionHeader.
 */
import { SectionHeader as CanonicalSectionHeader } from '@/components/ui/SectionHeader';

interface Props {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  sectionType?: string;
}

export function SectionHeader({ title }: Props) {
  return <CanonicalSectionHeader tier="standard" kicker={title} />;
}
