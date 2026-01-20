import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { uploadToR2Only } from '@/utils/r2OnlyUpload';
import { toast } from 'sonner';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageRoot } from '@/components/layout/PageRoot';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Section components
import { HeaderPhotoCard } from '@/components/profile/edit-v2/HeaderPhotoCard';
import { ProfilePhotoCard } from '@/components/profile/edit-v2/ProfilePhotoCard';
import { IdentitySection } from '@/components/profile/edit-v2/IdentitySection';
import { GolfInfoSection } from '@/components/profile/edit-v2/GolfInfoSection';
import { BioWebsitesSection } from '@/components/profile/edit-v2/BioWebsitesSection';
import { PrivacySection } from '@/components/profile/edit-v2/PrivacySection';
import { ProfileSnapshotPreview } from '@/components/profile/edit-v2/ProfileSnapshotPreview';
import { ProfileCompletenessChip } from '@/components/profile/edit-v2/ProfileCompletenessChip';

const BIO_MAX_LENGTH = 300;

const SECTIONS = [
  { id: 'photos', label: 'Photos' },
  { id: 'basic', label: 'Basic info' },
  { id: 'golf', label: 'Golf info' },
  { id: 'bio', label: 'Bio & links' },
  { id: 'privacy', label: 'Privacy' },
];

import { VisibilityValue } from '@/components/profile/edit-v2/VisibilityDropdown';

interface FormData {
  displayName: string;
  username: string;
  homeClub: string;
  homeClubId: string | null;
  collegeNormalized: string | null;
  handicap: string;
  bio: string;
  websites: string[];
  isPublic: boolean;
  homeClubVisibility: VisibilityValue;
  additionalClubsVisibility: VisibilityValue;
  profilePhoto: File | null;
  headerPhoto: File | null;
  profilePhotoPreview: string | null;
  headerPhotoPreview: string | null;
}

// Initial form state factory
const createInitialFormData = (profile: any): FormData => ({
  displayName: profile?.display_name || '',
  username: profile?.username || '',
  homeClub: profile?.home_club || '',
  homeClubId: profile?.primary_club_id || null,
  collegeNormalized: profile?.college_normalized || null,
  handicap: profile?.eg_handicap_index?.toString() || '',
  bio: profile?.bio || '',
  websites: profile?.websites || [],
  isPublic: profile?.is_public ?? true,
  homeClubVisibility: profile?.home_club_visibility || 'public',
  additionalClubsVisibility: profile?.additional_clubs_visibility || 'followers',
  profilePhoto: null,
  headerPhoto: null,
  profilePhotoPreview: null,
  headerPhotoPreview: null,
});

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  // Section refs for scroll-to
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeSection, setActiveSection] = useState('photos');

  // Unsaved changes confirmation dialog
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const pendingNavigationRef = useRef<string | null>(null);

  // Determine back destination
  const getBackDestination = () => {
    const state = location.state as { from?: string } | null;
    if (state?.from) return state.from;
    return '/profile';
  };

  const getBackLabel = () => {
    const dest = getBackDestination();
    if (dest.includes('top-100') || dest.includes('top100')) return 'Back to Top 100';
    if (dest.includes('settings')) return 'Back to Settings';
    return 'Back to profile';
  };

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

  const [formData, setFormData] = useState<FormData>(createInitialFormData(null));
  const [initialFormData, setInitialFormData] = useState<FormData | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      const initial = createInitialFormData(profile);
      setFormData(initial);
      setInitialFormData(initial);
    }
  }, [profile]);

  const isUsernameSet = profile?.username && profile.username.trim() !== '';

  // Check if form has unsaved changes (dirty state)
  const isDirty = useMemo(() => {
    if (!initialFormData) return false;
    
    // Check text fields
    if (formData.displayName !== initialFormData.displayName) return true;
    if (formData.username !== initialFormData.username) return true;
    if (formData.homeClub !== initialFormData.homeClub) return true;
    if (formData.homeClubId !== initialFormData.homeClubId) return true;
    if (formData.collegeNormalized !== initialFormData.collegeNormalized) return true;
    if (formData.handicap !== initialFormData.handicap) return true;
    if (formData.bio !== initialFormData.bio) return true;
    if (formData.isPublic !== initialFormData.isPublic) return true;
    if (formData.homeClubVisibility !== initialFormData.homeClubVisibility) return true;
    if (formData.additionalClubsVisibility !== initialFormData.additionalClubsVisibility) return true;
    
    // Check arrays
    if (JSON.stringify(formData.websites) !== JSON.stringify(initialFormData.websites)) return true;
    
    // Check file uploads
    if (formData.profilePhoto !== null) return true;
    if (formData.headerPhoto !== null) return true;
    
    return false;
  }, [formData, initialFormData]);

  // Section order for scroll-spy
  const sectionOrder = ['photos', 'basic', 'golf', 'bio', 'privacy'];
  
  // Track if we're programmatically scrolling (from click)
  const isScrollingFromClick = useRef(false);

  // Scroll-spy: update active tab based on scroll position
  useEffect(() => {
    if (isLoading) return;

    const handleScroll = () => {
      // Skip if we're scrolling from a tab click
      if (isScrollingFromClick.current) return;

      const scrollPosition = window.scrollY + 200; // Offset for sticky header

      // Find which section is currently in view
      for (const sectionId of sectionOrder) {
        const section = sectionRefs.current[sectionId];
        if (section) {
          const { offsetTop, offsetHeight } = section;

          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isLoading]);

  // Scroll to section
  const handleSectionClick = useCallback((sectionId: string) => {
    // Mark that we're scrolling from a click (disables sequential constraint)
    isScrollingFromClick.current = true;
    
    // Immediately update active state for instant feedback
    setActiveSection(sectionId);
    
    const ref = sectionRefs.current[sectionId];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Re-enable observer after scroll animation completes
    setTimeout(() => {
      isScrollingFromClick.current = false;
    }, 600);
  }, []);

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

  // Handle visibility changes
  const handleVisibilityChange = useCallback((field: 'homeClubVisibility' | 'additionalClubsVisibility', value: VisibilityValue) => {
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

    // Minimum requirements check: display_name is required to complete onboarding
    const meetsMinimumRequirements = formData.displayName.trim().length > 0;

    // If minimum requirements not met, show warning and don't proceed
    if (!meetsMinimumRequirements) {
      toast.error('Please add a display name to continue');
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      const updateData: any = {
        display_name: formData.displayName || null,
        home_club: formData.homeClub || null,
        primary_club_id: formData.homeClubId || null,
        college_normalized: formData.collegeNormalized || null,
        eg_handicap_index: formData.handicap ? parseFloat(formData.handicap) : null,
        bio: formData.bio || null,
        websites: normalizeWebsites(formData.websites),
        is_public: formData.isPublic,
        home_club_visibility: formData.homeClubVisibility,
        additional_clubs_visibility: formData.additionalClubsVisibility,
        updated_at: new Date().toISOString(),
        // Mark onboarding as complete when minimum requirements are met
        has_completed_onboarding: true,
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

      // Invalidate queries - including discovery for home club changes
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      await queryClient.invalidateQueries({ queryKey: ['home-clubs-map'] });
      await queryClient.invalidateQueries({ queryKey: ['user-home-clubs', user.id] });
      // Invalidate discovery queries so Home Club tab updates immediately
      await queryClient.invalidateQueries({ queryKey: ['golfers-filtered'] });
      await queryClient.invalidateQueries({ queryKey: ['search-golfers'] });

      setSaveSuccess(true);
      
      // Show toast with View profile CTA
      toast.success('Profile updated', {
        action: {
          label: 'View profile',
          onClick: () => navigate('/profile'),
        },
      });

      // Navigate back after success animation
      setTimeout(() => {
        navigate('/profile');
      }, 800);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }, [user?.id, formData, isUsernameSet, normalizeWebsites, queryClient, navigate]);

  // Handle cancel/back with dirty check
  const handleBack = useCallback(() => {
    const destination = getBackDestination();
    
    if (isDirty) {
      pendingNavigationRef.current = destination;
      setShowDiscardDialog(true);
    } else {
      navigate(destination);
    }
  }, [navigate, isDirty, getBackDestination]);

  // Handle discard confirmation
  const handleDiscardConfirm = useCallback(() => {
    setShowDiscardDialog(false);
    if (pendingNavigationRef.current) {
      navigate(pendingNavigationRef.current);
      pendingNavigationRef.current = null;
    }
  }, [navigate]);

  const handleDiscardCancel = useCallback(() => {
    setShowDiscardDialog(false);
    pendingNavigationRef.current = null;
  }, []);

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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#64748b]" />
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

  const hasProfilePhoto = !!(formData.profilePhotoPreview || profile?.profile_photo_url);

  return (
    <PageRoot className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Header - Full width with back arrow */}
      <header className="sticky top-0 z-20 bg-[#F8FAFC]/95 backdrop-blur border-b border-[#e2e8f0]">
        <div className="w-full px-4 pt-3 pb-3">
          {/* Header row with back arrow */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="w-10 h-10 flex items-center justify-center -ml-2"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-[#64748b]" />
            </button>
            
            {/* Progress chip centered */}
            <ProfileCompletenessChip
              displayName={formData.displayName}
              homeClub={formData.homeClub}
              handicap={formData.handicap}
              bio={formData.bio}
              hasProfilePhoto={hasProfilePhoto}
            />
            
            {/* Spacer for balance */}
            <div className="w-10" />
          </div>
        </div>
      </header>

      {/* Scrollable content - Full width */}
      <main className="flex-1">
        <div className="w-full pb-28">
          {/* Profile Snapshot Preview */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="px-4 py-4 bg-[#F8FAFC] dark:bg-muted/30"
          >
            <ProfileSnapshotPreview
              displayName={formData.displayName}
              homeClub={formData.homeClub}
              handicap={formData.handicap}
              bio={formData.bio}
              profilePhotoUrl={profile?.profile_photo_url}
              profilePhotoPreview={formData.profilePhotoPreview}
            />
          </motion.div>

          {/* Band A: Photos - Light blue background */}
          <motion.section
            id="photos"
            ref={(el) => { sectionRefs.current.photos = el; }}
            custom={0}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-6 bg-white dark:bg-background"
          >
            <div className="space-y-6">
              <HeaderPhotoCard
                currentUrl={profile?.header_photo_url}
                previewUrl={formData.headerPhotoPreview}
                onFileChange={(file) => handlePhotoChange('headerPhoto', file)}
              />
              <ProfilePhotoCard
                currentUrl={profile?.profile_photo_url}
                previewUrl={formData.profilePhotoPreview}
                onFileChange={(file) => handlePhotoChange('profilePhoto', file)}
              />
            </div>
          </motion.section>

          {/* Band B: Basic Info - White background */}
          <motion.section
            id="basic"
            ref={(el) => { sectionRefs.current.basic = el; }}
            custom={1}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-6 bg-[#F8FAFC] dark:bg-muted/30"
          >
            <IdentitySection
              displayName={formData.displayName}
              username={formData.username}
              isUsernameSet={isUsernameSet}
              onChange={handleFieldChange}
            />
          </motion.section>

          {/* Band A: Bio & Websites - Light blue background (moved above golf) */}
          <motion.section
            id="bio"
            ref={(el) => { sectionRefs.current.bio = el; }}
            custom={2}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-6 bg-white dark:bg-background"
          >
            <BioWebsitesSection
              bio={formData.bio}
              websites={formData.websites}
              maxBioLength={BIO_MAX_LENGTH}
              onBioChange={(bio) => handleFieldChange('bio', bio)}
              onWebsitesChange={(websites) => handleFieldChange('websites', websites)}
            />
          </motion.section>

          {/* Band B: Golf Info - White background */}
          <motion.section
            id="golf"
            ref={(el) => { sectionRefs.current.golf = el; }}
            custom={3}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-6 bg-[#F8FAFC] dark:bg-muted/30"
          >
            <GolfInfoSection
              homeClub={formData.homeClub}
              homeClubId={formData.homeClubId}
              collegeNormalized={formData.collegeNormalized}
              handicap={formData.handicap}
              userId={user?.id}
              homeClubVisibility={formData.homeClubVisibility}
              additionalClubsVisibility={formData.additionalClubsVisibility}
              handicapSyncInterest={(profile as any)?.handicap_sync_interest ?? false}
              onChange={handleFieldChange}
              onVisibilityChange={handleVisibilityChange}
            />
          </motion.section>

          {/* Band A: Privacy - Light blue background */}
          <motion.section
            id="privacy"
            ref={(el) => { sectionRefs.current.privacy = el; }}
            custom={4}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-6 bg-white dark:bg-background"
          >
            <PrivacySection
              isPublic={formData.isPublic}
              onChange={(isPublic) => handleFieldChange('isPublic', isPublic)}
            />
          </motion.section>
        </div>
      </main>

      {/* Sticky Footer - Full width */}
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-[#e2e8f0] bg-white/95 backdrop-blur shadow-lg">
        <div className="flex w-full items-center justify-between gap-4 px-4 py-4 pb-safe">
          <button
            type="button"
            onClick={handleBack}
            disabled={saving}
            className="text-sm font-medium text-[#64748b] hover:text-[#1e293b] transition-colors px-4 py-2"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || saveSuccess || !isDirty}
            className={cn(
              "inline-flex items-center justify-center rounded-full px-8 h-12 text-sm font-semibold transition-all",
              isDirty && !saving && !saveSuccess
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:scale-[1.02]"
                : "bg-[#e2e8f0] text-slate-500",
              saveSuccess && "bg-emerald-500 text-white",
              "disabled:cursor-not-allowed disabled:hover:scale-100"
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
                  Save Changes
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </footer>

      {/* Discard Changes Confirmation Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardCancel}>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageRoot>
  );
};

export default EditProfilePage;
