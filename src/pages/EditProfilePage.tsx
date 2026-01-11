import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { uploadToR2Only } from '@/utils/r2OnlyUpload';
import { toast } from 'sonner';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageRoot } from '@/components/layout/PageRoot';

// Section components
import { HeaderPhotoCard } from '@/components/profile/edit-v2/HeaderPhotoCard';
import { ProfilePhotoCard } from '@/components/profile/edit-v2/ProfilePhotoCard';
import { IdentitySection } from '@/components/profile/edit-v2/IdentitySection';
import { GolfInfoSection } from '@/components/profile/edit-v2/GolfInfoSection';
import { BioWebsitesSection } from '@/components/profile/edit-v2/BioWebsitesSection';
import { PrivacySection } from '@/components/profile/edit-v2/PrivacySection';
import { ProfileSnapshotPreview } from '@/components/profile/edit-v2/ProfileSnapshotPreview';
import { SectionJumpStrip } from '@/components/profile/edit-v2/SectionJumpStrip';
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
  homeClubId: string | null;  // Links to golf_clubs.id (primary_club_id)
  collegeNormalized: string | null;  // Links to college_media.normalized_name
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

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  // Section refs for scroll-to
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeSection, setActiveSection] = useState('photos');

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

  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    username: '',
    homeClub: '',
    homeClubId: null,
    collegeNormalized: null,
    handicap: '',
    bio: '',
    websites: [],
    isPublic: true,
    homeClubVisibility: 'public',
    additionalClubsVisibility: 'followers',
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
        homeClubId: profile.primary_club_id || null,  // Load from primary_club_id
        collegeNormalized: (profile as any).college_normalized || null,  // Load college
        handicap: profile.eg_handicap_index?.toString() || '',
        bio: profile.bio || '',
        websites: profile.websites || [],
        isPublic: profile.is_public ?? true,
        homeClubVisibility: (profile as any).home_club_visibility || 'public',
        additionalClubsVisibility: (profile as any).additional_clubs_visibility || 'followers',
        profilePhoto: null,
        headerPhoto: null,
        profilePhotoPreview: null,
        headerPhotoPreview: null,
      });
    }
  }, [profile]);

  const isUsernameSet = profile?.username && profile.username.trim() !== '';

  // Section order for sequential movement
  const sectionOrder = ['photos', 'basic', 'info', 'bio', 'links'];
  
  // Track if we're programmatically scrolling (from click)
  const isScrollingFromClick = useRef(false);

  // Intersection observer for active section (scrollspy)
  useEffect(() => {
    // Wait for profile to load so sections are rendered
    if (isLoading) return;

    // Small delay to ensure refs are populated after render
    const timeoutId = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          // Skip if we're scrolling from a click (let handleSectionClick control state)
          if (isScrollingFromClick.current) return;
          
          // Find the entry with highest intersection ratio that's visible
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

          if (visible) {
            const newSectionId = visible.target.id;
            if (newSectionId) {
              setActiveSection(prev => {
                const currentIndex = sectionOrder.indexOf(prev);
                const newIndex = sectionOrder.indexOf(newSectionId);
                
                // Only move to adjacent section (sequential movement)
                if (Math.abs(newIndex - currentIndex) <= 1 || currentIndex === -1) {
                  return newSectionId;
                }
                // If not adjacent, move one step toward the new section
                if (newIndex > currentIndex) {
                  return sectionOrder[currentIndex + 1];
                } else {
                  return sectionOrder[currentIndex - 1];
                }
              });
            }
          }
        },
        {
          root: null,
          threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
          rootMargin: '-120px 0px -40% 0px', // Account for sticky header
        }
      );

      Object.values(sectionRefs.current).forEach((ref) => {
        if (ref) observer.observe(ref);
      });

      // Store observer for cleanup
      (window as any).__editProfileObserver = observer;
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if ((window as any).__editProfileObserver) {
        (window as any).__editProfileObserver.disconnect();
      }
    };
  }, [isLoading]); // Re-run when loading state changes

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
        primary_club_id: formData.homeClubId || null,  // Store club ID from golf_clubs
        college_normalized: formData.collegeNormalized || null,  // Store college
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

  // Handle cancel/back
  const handleBack = useCallback(() => {
    navigate(getBackDestination());
  }, [navigate, location]);

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

  const hasProfilePhoto = !!(formData.profilePhotoPreview || profile?.profile_photo_url);

  return (
    <PageRoot className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="mx-auto w-full max-w-3xl px-4 pt-3 pb-2">
          {/* Back link */}
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-0.5 text-sm text-slate-500 hover:text-slate-400 mb-2"
          >
            ‹ {getBackLabel()}
          </button>
          
          {/* Title */}
          <h1 className="text-xl font-semibold text-center">Personalise your profile</h1>
          <p className="text-sm text-muted-foreground text-center mt-0.5">
            Update your photos, golf info and links in one place.
          </p>
          
          {/* Progress chip */}
          <div className="flex justify-center mt-2">
            <ProfileCompletenessChip
              displayName={formData.displayName}
              homeClub={formData.homeClub}
              handicap={formData.handicap}
              bio={formData.bio}
              hasProfilePhoto={hasProfilePhoto}
            />
          </div>
          
          {/* Section jump strip */}
          <div className="mt-3 flex justify-center">
            <SectionJumpStrip
              sections={SECTIONS}
              activeSection={activeSection}
              onSectionClick={handleSectionClick}
            />
          </div>
        </div>
      </header>

      {/* Scrollable content */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl pb-28">
          {/* Profile Snapshot Preview */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="px-4 py-4 bg-muted/20"
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

          {/* Band A: Photos */}
          <motion.section
            id="photos"
            ref={(el) => { sectionRefs.current.photos = el; }}
            custom={0}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-6 bg-slate-50 dark:bg-muted/30"
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

          {/* Band B: Basic Info */}
          <motion.section
            id="basic"
            ref={(el) => { sectionRefs.current.basic = el; }}
            custom={1}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-6"
          >
            <IdentitySection
              displayName={formData.displayName}
              username={formData.username}
              isUsernameSet={isUsernameSet}
              onChange={handleFieldChange}
            />
          </motion.section>

          {/* Band A: Golf Info */}
          <motion.section
            id="golf"
            ref={(el) => { sectionRefs.current.golf = el; }}
            custom={2}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-6 bg-slate-50 dark:bg-muted/30"
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

          {/* Band B: Bio & Websites */}
          <motion.section
            id="bio"
            ref={(el) => { sectionRefs.current.bio = el; }}
            custom={3}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-6"
          >
            <BioWebsitesSection
              bio={formData.bio}
              websites={formData.websites}
              maxBioLength={BIO_MAX_LENGTH}
              onBioChange={(bio) => handleFieldChange('bio', bio)}
              onWebsitesChange={(websites) => handleFieldChange('websites', websites)}
            />
          </motion.section>

          {/* Band A: Privacy */}
          <motion.section
            id="privacy"
            ref={(el) => { sectionRefs.current.privacy = el; }}
            custom={4}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-6 bg-slate-50 dark:bg-muted/30"
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
            onClick={handleBack}
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
              "bg-slate-900 text-white hover:bg-slate-800",
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
