/**
 * PhotosIdentityStep - Step 1: Profile photo, header photo, name, username
 */
import { motion } from 'framer-motion';
import { HeaderPhotoCard } from '@/components/profile/edit-v2/HeaderPhotoCard';
import { ProfilePhotoCard } from '@/components/profile/edit-v2/ProfilePhotoCard';
import { IdentitySection } from '@/components/profile/edit-v2/IdentitySection';

interface PhotosIdentityStepProps {
  // Photo state
  profilePhotoUrl?: string | null;
  headerPhotoUrl?: string | null;
  profilePhotoPreview?: string | null;
  headerPhotoPreview?: string | null;
  onProfilePhotoChange: (file: File | null) => void;
  onHeaderPhotoChange: (file: File | null) => void;
  onProfilePhotoRemove: () => void;
  onHeaderPhotoRemove: () => void;
  
  // Identity state
  displayName: string;
  username: string;
  isUsernameSet: boolean;
  onChange: (field: string, value: string) => void;
}

export function PhotosIdentityStep({
  profilePhotoUrl,
  headerPhotoUrl,
  profilePhotoPreview,
  headerPhotoPreview,
  onProfilePhotoChange,
  onHeaderPhotoChange,
  onProfilePhotoRemove,
  onHeaderPhotoRemove,
  displayName,
  username,
  isUsernameSet,
  onChange,
}: PhotosIdentityStepProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 py-6 space-y-8">
        {/* Photos Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-1">Your Photos</h2>
            <p className="text-xs text-muted-foreground">Add a profile photo to help golfers recognise you</p>
          </div>
          
          <div className="space-y-4">
            <ProfilePhotoCard
              currentUrl={profilePhotoUrl}
              previewUrl={profilePhotoPreview}
              onFileChange={onProfilePhotoChange}
              onRemove={onProfilePhotoRemove}
            />
            <HeaderPhotoCard
              currentUrl={headerPhotoUrl}
              previewUrl={headerPhotoPreview}
              onFileChange={onHeaderPhotoChange}
              onRemove={onHeaderPhotoRemove}
            />
          </div>
        </motion.div>

        {/* Identity Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <IdentitySection
            displayName={displayName}
            username={username}
            isUsernameSet={isUsernameSet}
            onChange={onChange}
          />
        </motion.div>
      </div>
    </div>
  );
}

export default PhotosIdentityStep;
