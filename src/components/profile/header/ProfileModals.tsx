import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ProfileFormFields from "../ProfileFormFields";
import PostViewerModal from '../../posts/PostViewerModal';
import ImmersiveProfileModal from '../immersive/ImmersiveProfileModal';
import MediaManagerModal from '../immersive/MediaManagerModal';
import { useProfileForm } from "../hooks/useProfileForm";

interface UserProfile {
  id: string;
  display_name?: string;
  username?: string;
  user_type?: string;
}

interface ActivityPost {
  id: string;
  content: string;
  created_at: string;
  user: any;
  post_media: any[];
}

interface ProfileModalsProps {
  // Edit Dialog
  editDialogOpen: boolean;
  setEditDialogOpen: (open: boolean) => void;
  profile: UserProfile | null;
  user: any;
  onProfileUpdate: () => void;

  // Post Viewer
  isPostViewerOpen: boolean;
  currentPost: ActivityPost | null;
  allUserPosts: ActivityPost[];
  closePostViewer: () => void;

  // Compare Modal
  isCompareModalOpen: boolean;
  setIsCompareModalOpen: (open: boolean) => void;

  // Immersive Profile
  isImmersiveOpen: boolean;
  closeImmersive: () => void;
  handleMorphTransition: () => void;
  mediaItems: any[];
  currentMediaIndex: number;
  setCurrentMediaIndex: (index: number) => void;
  refetchMedia: () => void;

  // Media Manager
  mediaManagerOpen: boolean;
  setMediaManagerOpen: (open: boolean) => void;
}

const ProfileModals: React.FC<ProfileModalsProps> = ({
  editDialogOpen,
  setEditDialogOpen,
  profile,
  user,
  onProfileUpdate,
  isPostViewerOpen,
  currentPost,
  allUserPosts,
  closePostViewer,
  isCompareModalOpen,
  setIsCompareModalOpen,
  isImmersiveOpen,
  closeImmersive,
  handleMorphTransition,
  mediaItems,
  currentMediaIndex,
  setCurrentMediaIndex,
  refetchMedia,
  mediaManagerOpen,
  setMediaManagerOpen
}) => {
  const {
    formData,
    saving,
    isUsernameSet,
    handleInputChange,
    handleHandicapChange,
    handlePublicToggle,
    handleTextareaChange,
    handleSelectChange,
    handleFileChange,
    handleSave,
  } = useProfileForm(profile, user?.id || '', onProfileUpdate, () => setEditDialogOpen(false));

  return (
    <>
      {/* Custom Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          
          <ProfileFormFields
            formData={formData}
            isUsernameSet={isUsernameSet}
            userId={user?.id || ''}
            userType={profile?.user_type}
            profile={profile}
            onInputChange={handleInputChange}
            onTextareaChange={handleTextareaChange}
            onSelectChange={handleSelectChange}
            onHandicapChange={handleHandicapChange}
            onPublicToggle={handlePublicToggle}
            onFileChange={handleFileChange}
            onProfileUpdate={onProfileUpdate}
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Post Viewer Modal */}
      {currentPost && (
        <PostViewerModal
          isOpen={isPostViewerOpen}
          onClose={closePostViewer}
          initialPost={currentPost}
          allUserPosts={allUserPosts}
        />
      )}

      {/* Compare Progress Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setIsCompareModalOpen(false)}>
          <div className="bg-white p-4 rounded-lg">
            <h3>Compare Progress Modal</h3>
            <button onClick={() => setIsCompareModalOpen(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Immersive Profile Modal */}
      <ImmersiveProfileModal
        isOpen={isImmersiveOpen}
        onClose={closeImmersive}
        onMorphToHeader={handleMorphTransition}
        mediaItems={mediaItems.map(item => ({
          ...item,
          media_type: item.media_type as 'image' | 'video'
        }))}
        userId={profile?.id || ''}
        initialIndex={currentMediaIndex}
        onCurrentIndexChange={setCurrentMediaIndex}
        uploadMode={profile?.id === user?.id}
        onUploadComplete={() => refetchMedia()}
      />

      {/* Media Manager Modal */}
      <MediaManagerModal
        isOpen={mediaManagerOpen}
        onClose={() => setMediaManagerOpen(false)}
        userId={profile?.id || ''}
        mediaItems={mediaItems.map(item => ({
          ...item,
          media_type: item.media_type as 'image' | 'video'
        }))}
        onMediaUpdate={refetchMedia}
      />
    </>
  );
};

export default ProfileModals;