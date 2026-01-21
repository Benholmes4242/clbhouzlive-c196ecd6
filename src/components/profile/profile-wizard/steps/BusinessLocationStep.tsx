/**
 * BusinessLocationStep - Step 2: Location, website, email, phone
 */
import { motion } from 'framer-motion';
import { BusinessLocationSection } from '@/components/business/sections/BusinessLocationSection';
import { LocationValue } from '@/components/business/LocationAutocomplete';
import { PhoneValue } from '@/components/business/PhoneInputWithDialCode';

interface BusinessLocationStepProps {
  location: LocationValue | null;
  setLocation: (location: LocationValue | null) => void;
  website: string;
  setWebsite: (website: string) => void;
  email: string;
  setEmail: (email: string) => void;
  phone: PhoneValue | null;
  setPhone: (phone: PhoneValue | null) => void;
  isGolfClub: boolean;
  clubLocation?: string;
}

export function BusinessLocationStep({
  location,
  setLocation,
  website,
  setWebsite,
  email,
  setEmail,
  phone,
  setPhone,
  isGolfClub,
  clubLocation,
}: BusinessLocationStepProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <BusinessLocationSection
            location={location}
            setLocation={setLocation}
            website={website}
            setWebsite={setWebsite}
            email={email}
            setEmail={setEmail}
            phone={phone}
            setPhone={setPhone}
            isGolfClub={isGolfClub}
            clubLocation={clubLocation}
          />
        </motion.div>
      </div>
    </div>
  );
}

export default BusinessLocationStep;
