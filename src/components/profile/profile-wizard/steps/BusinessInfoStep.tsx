/**
 * BusinessInfoStep - Step 1: Category, name/club selection, description
 */
import { motion } from 'framer-motion';
import { BusinessInfoSection } from '@/components/business/sections/BusinessInfoSection';
import { SelectedClub } from '@/components/business/ClubSearchDropdown';
import { SelectedCollege } from '@/components/business/CollegeSearchDropdown';

interface BusinessInfoStepProps {
  category: string;
  setCategory: (category: string) => void;
  businessName: string;
  setBusinessName: (name: string) => void;
  selectedClub: SelectedClub | null;
  setSelectedClub: (club: SelectedClub | null) => void;
  selectedCollege: SelectedCollege | null;
  setSelectedCollege: (college: SelectedCollege | null) => void;
  description: string;
  setDescription: (desc: string) => void;
  existingBusinessForClub?: { id: string; name: string } | null;
  onRequestAccess?: () => void;
}

export function BusinessInfoStep({
  category,
  setCategory,
  businessName,
  setBusinessName,
  selectedClub,
  setSelectedClub,
  selectedCollege,
  setSelectedCollege,
  description,
  setDescription,
  existingBusinessForClub,
  onRequestAccess,
}: BusinessInfoStepProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <BusinessInfoSection
            category={category}
            setCategory={setCategory}
            businessName={businessName}
            setBusinessName={setBusinessName}
            selectedClub={selectedClub}
            setSelectedClub={setSelectedClub}
            selectedCollege={selectedCollege}
            setSelectedCollege={setSelectedCollege}
            description={description}
            setDescription={setDescription}
            existingBusinessForClub={existingBusinessForClub}
            onRequestAccess={onRequestAccess}
          />
        </motion.div>
      </div>
    </div>
  );
}

export default BusinessInfoStep;
