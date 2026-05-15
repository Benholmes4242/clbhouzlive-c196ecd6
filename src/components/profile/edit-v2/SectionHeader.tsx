/**
 * SectionHeader — backward-compat shim over the shared SectionEyebrow primitive.
 * Existing edit-v2 consumers (GolfInfoSection) keep working; new code should
 * import SectionEyebrow directly from @/components/ui/SectionEyebrow.
 */
import { SectionEyebrow } from '@/components/ui/SectionEyebrow';

interface Props {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  sectionType?: string;
}

export function SectionHeader({ title }: Props) {
  return (
    <div style={{ marginBottom: 12 }}>
      <SectionEyebrow label={title} />
    </div>
  );
}
