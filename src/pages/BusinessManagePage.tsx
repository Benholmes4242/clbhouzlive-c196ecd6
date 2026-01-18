import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Building2, MapPin, Globe, Mail, Phone, 
  Check, Loader2, BarChart3, Image, Eye, Users, ShieldCheck,
  Camera
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BUSINESS_CATEGORIES } from '@/types/profile';
import { PageRoot } from '@/components/layout/PageRoot';
import { cn } from '@/lib/utils';
import VerificationStatusBar from '@/components/business/VerificationStatusBar';
import VerificationSection from '@/components/business/VerificationSection';

const BusinessManagePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useSupabaseSession();
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessCategory: '',
    businessLocation: '',
    businessWebsite: '',
    businessContactEmail: '',
    businessContactPhone: '',
    businessBio: '',
    isPublic: true,
    allowReviews: true,
    allowMessages: true,
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        businessName: profile.business_name || '',
        businessCategory: profile.business_category || '',
        businessLocation: profile.business_location || '',
        businessWebsite: profile.business_website || '',
        businessContactEmail: profile.business_contact_email || '',
        businessContactPhone: profile.business_contact_phone || '',
        businessBio: profile.business_bio || '',
        isPublic: profile.is_public ?? true,
        allowReviews: true, // Future field
        allowMessages: true, // Future field
      });
    }
  }, [profile]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  // Redirect if not a business profile
  useEffect(() => {
    if (!profileLoading && profile && profile.profile_type !== 'business' && !profile.business_name) {
      navigate('/business/create');
    }
  }, [profileLoading, profile, navigate]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    if (!formData.businessName.trim()) {
      toast.error('Business name is required');
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: formData.businessName,
          business_name: formData.businessName,
          business_category: formData.businessCategory || null,
          business_location: formData.businessLocation || null,
          business_website: formData.businessWebsite || null,
          business_contact_email: formData.businessContactEmail || null,
          business_contact_phone: formData.businessContactPhone || null,
          business_bio: formData.businessBio || null,
          is_public: formData.isPublic,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Invalidate profile cache
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['user-profile'] });

      setSaveSuccess(true);
      
      toast.success('Changes saved!', {
        action: {
          label: 'View profile',
          onClick: () => navigate(`/profile/${profile?.username || user.id}`),
        },
      });

      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error updating business profile:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(`/profile/${profile?.username || user?.id}`);
  };

  // Section animation variants
  const sectionVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.25,
        ease: 'easeOut' as const,
      },
    }),
  };

  if (authLoading || profileLoading) {
    return (
      <PageRoot className="min-h-screen bg-muted/40 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </PageRoot>
    );
  }

  const isVerified = profile?.is_business_verified === true;

  return (
    <PageRoot className="min-h-screen flex flex-col bg-muted/40">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4 pt-3 pb-3">
          {/* Back link */}
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to business profile</span>
          </button>

          {/* Title row */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-center">Business settings</p>
              <h1 className="text-xl font-semibold text-center mt-0.5">Manage Business Profile</h1>
            </div>
            
            {/* Right CTA - only for verified */}
            {isVerified && user?.id && (
              <button
                onClick={() => navigate(`/business/${user.id}/insights`)}
                className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                View Insights
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl pb-28">
          {/* Verification Status Bar */}
          {profile && (
            <VerificationStatusBar profile={profile} />
          )}

          {/* Band A: Business Identity */}
          <motion.section
            custom={0}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-6 bg-background"
          >
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Business identity</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              How your business appears across clbhouz.
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="businessName" className="text-xs text-muted-foreground">
                  Business Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="e.g., Royal Golf Club"
                  className="h-10"
                />
                <p className="text-[11px] text-muted-foreground">
                  Use your official business name as golfers know it.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="businessCategory" className="text-xs text-muted-foreground">
                  Category
                </Label>
                <Select
                  value={formData.businessCategory}
                  onValueChange={(value) => handleInputChange('businessCategory', value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Helps golfers find the right type of business.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="businessBio" className="text-xs text-muted-foreground">
                    About your business
                  </Label>
                  <span className="text-[11px] text-muted-foreground/70">
                    {formData.businessBio.length}/500
                  </span>
                </div>
                <Textarea
                  id="businessBio"
                  value={formData.businessBio}
                  onChange={(e) => handleInputChange('businessBio', e.target.value)}
                  placeholder="Tell golfers about your business..."
                  className="min-h-[100px] resize-none"
                  maxLength={2000}
                />
                <p className="text-[11px] text-muted-foreground">
                  This appears on your business profile. Keep it friendly and useful.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Band B: Location & Contact */}
          <motion.section
            custom={1}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-6 bg-muted/30"
          >
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Location & contact</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Where you are and how golfers reach you.
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="businessLocation" className="text-xs text-muted-foreground">
                  Location
                </Label>
                <Input
                  id="businessLocation"
                  value={formData.businessLocation}
                  onChange={(e) => handleInputChange('businessLocation', e.target.value)}
                  placeholder="City, Country"
                  className="h-10"
                />
                <p className="text-[11px] text-muted-foreground">
                  Use your main operating location.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="businessWebsite" className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Website
                </Label>
                <Input
                  id="businessWebsite"
                  value={formData.businessWebsite}
                  onChange={(e) => handleInputChange('businessWebsite', e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="h-10"
                />
                <p className="text-[11px] text-muted-foreground">
                  Your booking or information site works best.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="businessContactEmail" className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    Contact Email
                  </Label>
                  <Input
                    id="businessContactEmail"
                    type="email"
                    value={formData.businessContactEmail}
                    onChange={(e) => handleInputChange('businessContactEmail', e.target.value)}
                    placeholder="contact@business.com"
                    className="h-10"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Used for enquiries and golfer messages.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="businessContactPhone" className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    Phone
                  </Label>
                  <Input
                    id="businessContactPhone"
                    type="tel"
                    value={formData.businessContactPhone}
                    onChange={(e) => handleInputChange('businessContactPhone', e.target.value)}
                    placeholder="+44 20 0000 0000"
                    className="h-10"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Include your country code.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Band A: Photos & Media */}
          <motion.section
            custom={2}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-6 bg-background"
          >
            <div className="flex items-center gap-2 mb-1">
              <Image className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Photos & Media</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Show golfers what your business looks like.
            </p>

            <div className="space-y-4">
              {/* Business Photo */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Business Photo</Label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-sq-md bg-muted flex items-center justify-center overflow-hidden">
                    {profile?.profile_photo_url ? (
                      <img 
                        src={profile.profile_photo_url} 
                        alt="Business" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Camera className="h-6 w-6 text-muted-foreground/50" />
                    )}
                  </div>
                  <button className="text-xs text-primary hover:underline">
                    Change photo
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Square images work best. JPG, PNG, or WebP.
                </p>
              </div>

              {/* Header Photo */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Header Photo</Label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-28 rounded-sq-md bg-muted flex items-center justify-center overflow-hidden">
                    {profile?.header_photo_url ? (
                      <img 
                        src={profile.header_photo_url} 
                        alt="Header" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Camera className="h-6 w-6 text-muted-foreground/50" />
                    )}
                  </div>
                  <button className="text-xs text-primary hover:underline">
                    Change photo
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Wide landscape images work best (1600×600px+).
                </p>
              </div>
            </div>
          </motion.section>

          {/* Band B: Visibility */}
          <motion.section
            custom={3}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-6 bg-muted/30"
          >
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Visibility</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Choose how your business appears across clbhouz.
            </p>

            <div className="space-y-4">
              {/* Public Profile Toggle */}
              <div className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Public Profile</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    When enabled, golfers can view your business, leave reviews, and follow you.
                  </p>
                </div>
                <Switch
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
                />
              </div>

              {/* Allow Reviews Toggle */}
              <div className="flex items-center justify-between py-2 border-t border-border/40">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Allow reviews</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Let golfers leave reviews and ratings for your business.
                  </p>
                </div>
                <Switch
                  checked={formData.allowReviews}
                  onCheckedChange={(checked) => handleInputChange('allowReviews', checked)}
                />
              </div>

              {/* Enable DMs Toggle */}
              <div className="flex items-center justify-between py-2 border-t border-border/40">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Enable direct messages</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Allow golfers to send your business messages.
                  </p>
                </div>
                <Switch
                  checked={formData.allowMessages}
                  onCheckedChange={(checked) => handleInputChange('allowMessages', checked)}
                />
              </div>
            </div>
          </motion.section>

          {/* Band A: Team & Ownership */}
          <motion.section
            custom={4}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-6 bg-background"
          >
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Team & ownership</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Manage who can edit this business profile.
            </p>

            <div className="space-y-4">
              {/* Primary Owner */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Primary Owner</p>
                <p className="text-xs text-muted-foreground">
                  The person who created this business on clbhouz.
                </p>
                <div className="flex items-center gap-3 py-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {profile?.profile_photo_url ? (
                      <img 
                        src={profile.profile_photo_url} 
                        alt={profile.display_name || 'Owner'} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        {profile?.display_name?.charAt(0) || 'O'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{profile?.display_name || 'Owner'}</p>
                    <p className="text-xs text-muted-foreground">@{profile?.username}</p>
                  </div>
                </div>
                <button className="text-xs text-muted-foreground hover:text-foreground">
                  Transfer ownership
                </button>
              </div>

              {/* Admins */}
              <div className="space-y-2 pt-4 border-t border-border/40">
                <p className="text-xs font-medium text-foreground">Admins</p>
                <p className="text-xs text-muted-foreground">
                  Admins can edit the business profile and respond to messages.
                </p>
                <p className="text-xs text-muted-foreground/70 py-2">
                  No admins added yet.
                </p>
                <button className="text-xs text-primary hover:underline">
                  Add admin
                </button>
              </div>
            </div>
          </motion.section>

          {/* Band B: Verification */}
          <motion.section
            custom={5}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-6 bg-muted/30"
          >
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Verification</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Confirm your business identity to build trust.
            </p>

            {profile && (
              <VerificationSection profile={profile} />
            )}
          </motion.section>
        </div>
      </main>

      {/* Sticky Footer */}
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={saving}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || saveSuccess || !formData.businessName.trim()}
            className={cn(
              "inline-flex h-10 flex-[1.5] items-center justify-center rounded-full px-4 text-sm font-semibold transition-all",
              "bg-amber-500 text-white shadow-sm",
              "hover:bg-amber-600 active:scale-[0.99]",
              "disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-amber-300",
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
                  Save Changes
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </footer>
    </PageRoot>
  );
};

export default BusinessManagePage;
