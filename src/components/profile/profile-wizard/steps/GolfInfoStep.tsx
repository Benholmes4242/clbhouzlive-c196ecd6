/**
 * GolfInfoStep - Step 2: Home club, handicap, college
 */
import { motion } from 'framer-motion';
import { GolfInfoSection } from '@/components/profile/edit-v2/GolfInfoSection';
import { VisibilityValue } from '@/components/profile/edit-v2/VisibilityDropdown';

interface DeferredClub {
  id: string;
  name: string;
  country: string | null;
}

interface GolfInfoStepProps {
  homeClub: string;
  homeClubId: string | null;
  collegeNormalized: string | null;
  handicap: string;
  userId?: string;
  homeClubVisibility: VisibilityValue;
  additionalClubsVisibility: VisibilityValue;
  onChange: (field: string, value: string | null) => void;
  onVisibilityChange: (field: 'homeClubVisibility' | 'additionalClubsVisibility', value: VisibilityValue) => void;
  // Deferred club operations
  addedClubs: DeferredClub[];
  removedClubIds: string[];
  onAddClub: (club: DeferredClub) => void;
  onRemoveClub: (clubId: string) => void;
}

export function GolfInfoStep({
  homeClub,
  homeClubId,
  collegeNormalized,
  handicap,
  userId,
  homeClubVisibility,
  additionalClubsVisibility,
  onChange,
  onVisibilityChange,
  addedClubs,
  removedClubIds,
  onAddClub,
  onRemoveClub,
}: GolfInfoStepProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GolfInfoSection
            homeClub={homeClub}
            homeClubId={homeClubId}
            collegeNormalized={collegeNormalized}
            handicap={handicap}
            userId={userId}
            homeClubVisibility={homeClubVisibility}
            additionalClubsVisibility={additionalClubsVisibility}
            onChange={onChange}
            onVisibilityChange={onVisibilityChange}
            deferredAddedClubs={addedClubs}
            deferredRemovedClubIds={removedClubIds}
            onDeferredAddClub={onAddClub}
            onDeferredRemoveClub={onRemoveClub}
          />
        </motion.div>
      </div>
    </div>
  );
}

export default GolfInfoStep;
