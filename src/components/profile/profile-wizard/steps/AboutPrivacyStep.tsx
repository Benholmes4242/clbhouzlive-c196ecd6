/**
 * AboutPrivacyStep - Step 3: Bio, websites, privacy settings
 */
import { motion } from 'framer-motion';
import { BioWebsitesSection } from '@/components/profile/edit-v2/BioWebsitesSection';
import { PrivacySection } from '@/components/profile/edit-v2/PrivacySection';

const BIO_MAX_LENGTH = 300;

interface AboutPrivacyStepProps {
  bio: string;
  websites: string[];
  isPublic: boolean;
  onBioChange: (value: string) => void;
  onWebsitesChange: (websites: string[]) => void;
  onIsPublicChange: (value: boolean) => void;
}

export function AboutPrivacyStep({
  bio,
  websites,
  isPublic,
  onBioChange,
  onWebsitesChange,
  onIsPublicChange,
}: AboutPrivacyStepProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 py-6 space-y-8">
        {/* Bio & Websites Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <BioWebsitesSection
            bio={bio}
            websites={websites}
            maxBioLength={BIO_MAX_LENGTH}
            onBioChange={onBioChange}
            onWebsitesChange={onWebsitesChange}
          />
        </motion.div>

        {/* Privacy Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PrivacySection
            isPublic={isPublic}
            onChange={onIsPublicChange}
          />
        </motion.div>
      </div>
    </div>
  );
}

export default AboutPrivacyStep;
