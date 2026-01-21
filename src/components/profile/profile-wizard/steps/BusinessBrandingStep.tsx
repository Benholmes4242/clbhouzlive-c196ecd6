/**
 * BusinessBrandingStep - Step 3: Logo and cover photo
 */
import { motion } from 'framer-motion';
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
    <div className="h-full overflow-y-auto">
      <div className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <BusinessBrandingSection
            logoUrl={logoUrl}
            setLogoUrl={setLogoUrl}
            coverUrl={coverUrl}
            setCoverUrl={setCoverUrl}
            businessName={businessName}
          />
        </motion.div>
      </div>
    </div>
  );
}

export default BusinessBrandingStep;
