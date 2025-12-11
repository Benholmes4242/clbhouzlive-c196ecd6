import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { uploadToR2Only } from '@/utils/r2OnlyUpload';
import { toast } from 'sonner';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Section components
import { HeaderPhotoCard } from '@/components/profile/edit-v2/HeaderPhotoCard';
import { ProfilePhotoCard } from '@/components/profile/edit-v2/ProfilePhotoCard';
import { IdentitySection } from '@/components/profile/edit-v2/IdentitySection';
import { GolfInfoSection } from '@/components/profile/edit-v2/GolfInfoSection';
import { BioWebsitesSection } from '@/components/profile/edit-v2/BioWebsitesSection';
import { PrivacySection } from '@/components/profile/edit-v2/PrivacySection';

const BIO_MAX_LENGTH = 150;

interface FormData {
  displayName: string;
  username: string;
  homeClub: string;
  homeClubId: string | null;
  handicap: string;
  bio: string;
  websites: string[];
  isPublic: boolean;
  profilePhoto: File | null;
  headerPhoto: File | null;
  profilePhotoPreview: string | null;
  headerPhotoPreview: string | null;
}

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    username: '',
    homeClub: '',
    homeClubId: null,
    handicap: '',
    bio: '',
    websites: [],
    isPublic: true,
    profilePhoto: null,
    headerPhoto: null,
    profilePhotoPreview: null,
    headerPhotoPreview: null,
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.display_name || '',
        username: profile.username || '',
        homeClub: profile.home_club || '',
        homeClubId: null, // We don't store club ID currently
        handicap: profile.eg_handicap_index?.toString() || '',
        bio: profile.bio || '',
        websites: profile.websites || [],
        isPublic: profile.is_public ?? true,
        profilePhoto: null,
        headerPhoto: null,
        profilePhotoPreview: null,
        headerPhotoPreview: null,
      });
    }
  }, [profile]);

  const isUsernameSet = profile?.username && profile.username.trim() !== '';

  // Handle field changes
  const handleFieldChange = useCallback((field: keyof FormData, value: any) => {
    if (field === 'bio' && typeof value === 'string' && value.length > BIO_MAX_LENGTH) {
      return;
    }
    if (field === 'username' && typeof value === 'string') {
      value = value.replace(/\s+/g, '').replace('@', '').toLowerCase();
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle photo changes
  const handlePhotoChange = useCallback((type: 'profilePhoto' | 'headerPhoto', file: File | null) => {
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      const previewKey = type === 'profilePhoto' ? 'profilePhotoPreview' : 'headerPhotoPreview';
      setFormData(prev => ({
        ...prev,
        [type]: file,
        [previewKey]: previewUrl,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [type]: null,
        [type === 'profilePhoto' ? 'profilePhotoPreview' : 'headerPhotoPreview']: null,
      }));
    }
  }, []);

  // Normalize websites
  const normalizeWebsites = useCallback((websites: string[]): string[] => {
    return websites
      .map(url => {
        const trimmed = url.trim();
        if (!trimmed) return '';
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          return `https://${trimmed}`;
        }
        return trimmed;
      })
      .filter(url => url.length > 0);
  }, []);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!user?.id) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      const updateData: any = {
        display_name: formData.displayName || null,
        home_club: formData.homeClub || null,
        eg_handicap_index: formData.handicap ? parseFloat(formData.handicap) : null,
        bio: formData.bio || null,
        websites: normalizeWebsites(formData.websites),
        is_public: formData.isPublic,
        updated_at: new Date().toISOString(),
      };

      // Only update username if not already set
      if (!isUsernameSet && formData.username) {
        updateData.username = formData.username;
      }

      // Handle profile photo upload
      if (formData.profilePhoto) {
        const fileExt = formData.profilePhoto.name.split('.').pop();
        const fileName = `${user.id}/profile-${Date.now()}.${fileExt}`;
        const uploadResult = await uploadToR2Only(formData.profilePhoto, 'clbhouz-profile-images', fileName);
        if (!uploadResult.success) throw new Error(uploadResult.error || 'Profile photo upload failed');
        updateData.profile_photo_url = uploadResult.publicUrl;
      }

      // Handle header photo upload
      if (formData.headerPhoto) {
        const fileExt = formData.headerPhoto.name.split('.').pop();
        const fileName = `${user.id}/header-${Date.now()}.${fileExt}`;
        const uploadResult = await uploadToR2Only(formData.headerPhoto, 'clbhouz-profile-images', fileName);
        if (!uploadResult.success) throw new Error(uploadResult.error || 'Header photo upload failed');
        updateData.header_photo_url = uploadResult.publicUrl;
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['user-profile'] });

      setSaveSuccess(true);
      toast.success('Profile updated successfully');

      // Navigate back after success animation
      setTimeout(() => {
        navigate('/profile');
      }, 600);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }, [user?.id, formData, isUsernameSet, normalizeWebsites, queryClient, navigate]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (formData.profilePhotoPreview) URL.revokeObjectURL(formData.profilePhotoPreview);
      if (formData.headerPhotoPreview) URL.revokeObjectURL(formData.headerPhotoPreview);
    };
  }, [formData.profilePhotoPreview, formData.headerPhotoPreview]);

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Section animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: 'easeOut' as const,
      },
    }),
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleCancel}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Edit Profile</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Section 1: Header Photo */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <HeaderPhotoCard
            currentUrl={profile?.header_photo_url}
            previewUrl={formData.headerPhotoPreview}
            onFileChange={(file) => handlePhotoChange('headerPhoto', file)}
          />
        </motion.div>

        {/* Section 2: Profile Photo */}
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <ProfilePhotoCard
            currentUrl={profile?.profile_photo_url}
            previewUrl={formData.profilePhotoPreview}
            onFileChange={(file) => handlePhotoChange('profilePhoto', file)}
          />
        </motion.div>

        {/* Section 3: Identity */}
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <IdentitySection
            displayName={formData.displayName}
            username={formData.username}
            isUsernameSet={isUsernameSet}
            onChange={handleFieldChange}
          />
        </motion.div>

        {/* Section 4: Golf Information */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <GolfInfoSection
            homeClub={formData.homeClub}
            handicap={formData.handicap}
            onChange={handleFieldChange}
          />
        </motion.div>

        {/* Section 5: Bio & Websites */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <BioWebsitesSection
            bio={formData.bio}
            websites={formData.websites}
            maxBioLength={BIO_MAX_LENGTH}
            onBioChange={(bio) => handleFieldChange('bio', bio)}
            onWebsitesChange={(websites) => handleFieldChange('websites', websites)}
          />
        </motion.div>

        {/* Section 6: Privacy */}
        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <PrivacySection
            isPublic={formData.isPublic}
            onChange={(isPublic) => handleFieldChange('isPublic', isPublic)}
          />
        </motion.div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 inset-x-0 z-50">
        <div className="bg-background/80 backdrop-blur-xl border-t border-border">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || saveSuccess}
              className={cn(
                'min-w-[140px] transition-all',
                saveSuccess && 'bg-emerald-500 hover:bg-emerald-500'
              )}
            >
              <AnimatePresence mode="wait">
                {saving ? (
                  <motion.span
                    key="saving"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </motion.span>
                ) : saveSuccess ? (
                  <motion.span
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      <Check className="w-4 h-4" />
                    </motion.div>
                    Saved
                  </motion.span>
                ) : (
                  <motion.span
                    key="save"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Save Changes
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfilePage;
