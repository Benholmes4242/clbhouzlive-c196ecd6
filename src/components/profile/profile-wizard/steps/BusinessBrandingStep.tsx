/**
 * BusinessBrandingStep - Step 3: Logo and cover photo
 */
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';
import { BusinessBrandingSection } from '@/components/business/sections/BusinessBrandingSection';

interface BusinessBrandingStepProps {
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
  coverUrl: string | null;
  setCoverUrl: (url: string | null) => void;
  businessName: string;
}

export function BusinessBrandingStep({
  logoUrl,
  setLogoUrl,
  coverUrl,
  setCoverUrl,
  businessName,
}: BusinessBrandingStepProps) {
  return (
    <div className="space-y-4 px-4 pb-4 pt-2">
      <BusinessBrandingSection
        logoUrl={logoUrl}
        setLogoUrl={setLogoUrl}
        coverUrl={coverUrl}
        setCoverUrl={setCoverUrl}
        businessName={businessName}
      />
      <p className="text-[12px] text-muted-foreground text-center">
        You can always update these later from your business profile settings.
      </p>
    </div>
  );
}

export default BusinessBrandingStep;
