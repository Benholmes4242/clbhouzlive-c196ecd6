import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { uploadToR2Only } from '@/utils/r2OnlyUpload';
import { toast } from 'sonner';
import { ChevronLeft, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageRoot } from '@/components/layout/PageRoot';

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
        homeClubId: null,
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Section animation variants
  const sectionVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.04,
        duration: 0.25,
        ease: 'easeOut' as const,
      },
    }),
  };

  return (
    <PageRoot className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold">Edit profile</h1>
          {/* Spacer to balance */}
          <div className="w-9" />
        </div>
      </header>

      {/* Scrollable content */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-3">
          {/* Section 1: Header Photo */}
          <motion.section
            custom={0}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="py-4 border-b border-border/60"
          >
            <HeaderPhotoCard
              currentUrl={profile?.header_photo_url}
              previewUrl={formData.headerPhotoPreview}
              onFileChange={(file) => handlePhotoChange('headerPhoto', file)}
            />
          </motion.section>

          {/* Section 2: Profile Photo */}
          <motion.section
            custom={1}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="py-4 border-b border-border/60"
          >
            <ProfilePhotoCard
              currentUrl={profile?.profile_photo_url}
              previewUrl={formData.profilePhotoPreview}
              onFileChange={(file) => handlePhotoChange('profilePhoto', file)}
            />
          </motion.section>

          {/* Section 3: Identity */}
          <motion.section
            custom={2}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="py-4 border-b border-border/60"
          >
            <IdentitySection
              displayName={formData.displayName}
              username={formData.username}
              isUsernameSet={isUsernameSet}
              onChange={handleFieldChange}
            />
          </motion.section>

          {/* Section 4: Golf Information */}
          <motion.section
            custom={3}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="py-4 border-b border-border/60"
          >
            <GolfInfoSection
              homeClub={formData.homeClub}
              handicap={formData.handicap}
              onChange={handleFieldChange}
            />
          </motion.section>

          {/* Section 5: Bio & Websites */}
          <motion.section
            custom={4}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="py-4 border-b border-border/60"
          >
            <BioWebsitesSection
              bio={formData.bio}
              websites={formData.websites}
              maxBioLength={BIO_MAX_LENGTH}
              onBioChange={(bio) => handleFieldChange('bio', bio)}
              onWebsitesChange={(websites) => handleFieldChange('websites', websites)}
            />
          </motion.section>

          {/* Section 6: Privacy */}
          <motion.section
            custom={5}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="py-4"
          >
            <PrivacySection
              isPublic={formData.isPublic}
              onChange={(isPublic) => handleFieldChange('isPublic', isPublic)}
            />
          </motion.section>
        </div>
      </main>

      {/* Sticky Footer */}
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-end gap-3 px-4 py-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || saveSuccess}
            className={cn(
              "inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition-all",
              "bg-primary text-primary-foreground",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              saveSuccess && "bg-emerald-500"
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
                  Saving…
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
                  Save
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </footer>
    </PageRoot>
  );
};

export default EditProfilePage;
