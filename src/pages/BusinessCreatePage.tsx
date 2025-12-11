import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Building2, MapPin, Globe, Mail, Phone, Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BUSINESS_CATEGORIES } from '@/types/profile';
import { PageRoot } from '@/components/layout/PageRoot';
import { cn } from '@/lib/utils';

const BusinessCreatePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useSupabaseSession();
  const { data: profile } = useUserProfile(user?.id);
  
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
  });

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validation
  const isValid =
    formData.businessName.trim().length > 0 &&
    formData.businessLocation.trim().length > 0 &&
    (formData.businessWebsite.trim().length > 0 ||
      formData.businessContactEmail.trim().length > 0);

  const handleSubmit = async () => {
    if (!user?.id || !isValid) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          profile_type: 'business',
          display_name: formData.businessName,
          business_name: formData.businessName,
          business_category: formData.businessCategory || null,
          business_location: formData.businessLocation || null,
          business_website: formData.businessWebsite || null,
          business_contact_email: formData.businessContactEmail || null,
          business_contact_phone: formData.businessContactPhone || null,
          business_bio: formData.businessBio || null,
          is_business_verified: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Invalidate profile cache
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['user-profile'] });

      setSaveSuccess(true);
      
      toast.success('Business profile created!', {
        action: {
          label: 'View profile',
          onClick: () => navigate(`/profile/${profile?.username || user.id}`),
        },
      });

      // Navigate after success animation
      setTimeout(() => {
        navigate(`/profile/${profile?.username || user.id}`);
      }, 800);
    } catch (error) {
      console.error('Error creating business profile:', error);
      toast.error('Failed to create business profile');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (authLoading) {
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
        delay: i * 0.05,
        duration: 0.25,
        ease: 'easeOut' as const,
      },
    }),
  };

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
            <span>Back</span>
          </button>

          {/* Title */}
          <h1 className="text-xl font-semibold text-center">Create Business Profile</h1>
          <p className="text-sm text-muted-foreground text-center mt-0.5">
            Set up your golf club, academy, or brand
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl pb-28">
          {/* Info banner */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="px-4 py-4"
          >
            <div className="rounded-sq-md bg-gradient-to-br from-amber-50 to-amber-50/40 border border-amber-100/60 px-4 py-3">
              <p className="text-sm font-semibold text-amber-900">
                Business profiles get more visibility
              </p>
              <p className="mt-1 text-sm text-amber-900/70">
                Your business will appear in the directory and can receive reviews, messages,
                and follows from golfers.
              </p>
            </div>
          </motion.div>

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
              How your business appears on Clbhouz.
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
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="businessBio" className="text-xs text-muted-foreground">
                    About Your Business
                  </Label>
                  <span className="text-[11px] text-muted-foreground/70">
                    {formData.businessBio.length}/500
                  </span>
                </div>
                <Textarea
                  id="businessBio"
                  value={formData.businessBio}
                  onChange={(e) => handleInputChange('businessBio', e.target.value)}
                  placeholder="Tell golfers about your business – what makes it special, what you offer..."
                  className="min-h-[100px] resize-none"
                  maxLength={500}
                />
                <p className="text-[11px] text-muted-foreground">
                  Share what makes your business unique to golfers.
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
            <p className="text-xs text-muted-foreground mb-1">
              Help golfers find and reach you.
            </p>
            
            {!isValid && formData.businessName.trim().length > 0 && (
              <p className="text-xs text-amber-700 mb-4">
                Add a location and at least one contact method (website or email) to continue.
              </p>
            )}

            <div className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="businessLocation" className="text-xs text-muted-foreground">
                  Location <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="businessLocation"
                  value={formData.businessLocation}
                  onChange={(e) => handleInputChange('businessLocation', e.target.value)}
                  placeholder="City, Country"
                  className="h-10"
                />
                <p className="text-[11px] text-muted-foreground">
                  Helps golfers discover you when searching nearby.
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
                    placeholder="+1 (555) 000-0000"
                    className="h-10"
                  />
                </div>
              </div>
            </div>
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
            onClick={handleSubmit}
            disabled={saving || saveSuccess || !isValid}
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
                  Creating…
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
                  Created
                </motion.span>
              ) : (
                <motion.span
                  key="create"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Create Business
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </footer>
    </PageRoot>
  );
};

export default BusinessCreatePage;
