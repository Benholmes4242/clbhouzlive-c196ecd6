import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Building2, MapPin, Globe, Mail, Phone, Check, Loader2, GraduationCap, ShoppingBag, Briefcase, Flag, BadgeCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageRoot } from '@/components/layout/PageRoot';
import { cn } from '@/lib/utils';
import { LocationAutocomplete, LocationValue } from '@/components/business/LocationAutocomplete';
import { PhoneInputWithDialCode, PhoneValue } from '@/components/business/PhoneInputWithDialCode';

// Categories with icons
const BUSINESS_CATEGORIES_WITH_ICONS = [
  { value: 'Golf Club', label: 'Golf Club', icon: Flag },
  { value: 'Golf Academy', label: 'Golf Academy', icon: GraduationCap },
  { value: 'Coach / Instructor', label: 'Coach / Instructor', icon: GraduationCap },
  { value: 'Retailer / Pro Shop', label: 'Retailer / Pro Shop', icon: ShoppingBag },
  { value: 'Club Fitter', label: 'Club Fitter', icon: Briefcase },
  { value: 'Resort', label: 'Resort', icon: Building2 },
  { value: 'Brand / Manufacturer', label: 'Brand / Manufacturer', icon: Briefcase },
  { value: 'Other', label: 'Other', icon: Building2 },
];

/**
 * Screen 3: "Business details" (Step 2 of 2)
 * Reduced "gov form" feeling, clarified what's public, reduced anxiety
 */
const BusinessCreatePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useSupabaseSession();
  
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [phone, setPhone] = useState<PhoneValue | null>(null);
  const [formData, setFormData] = useState({
    businessName: '',
    businessCategory: '',
    businessWebsite: '',
    businessContactEmail: '',
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

  // Validation - require selected location (not just any string)
  const isValid =
    formData.businessName.trim().length > 0 &&
    location !== null &&
    (formData.businessWebsite.trim().length > 0 ||
      formData.businessContactEmail.trim().length > 0);

  const handleSubmit = async () => {
    // Validate location selection
    if (!location) {
      setLocationError('Please select a location from the list');
      return;
    }
    
    if (!user?.id || !isValid) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      // Format location as "City, Country" for cleaner display
      const formattedLocation = location.country 
        ? `${location.city}, ${location.country}`
        : location.label;

      // 1. Create the business account
      const { data: businessData, error: businessError } = await supabase
        .from('business_accounts')
        .insert({
          name: formData.businessName,
          category: formData.businessCategory || null,
          location: formattedLocation,
          website: formData.businessWebsite || null,
          email: formData.businessContactEmail || null,
          phone: phone?.fullNumber || null,
          description: formData.businessBio || null,
          is_verified: false,
        })
        .select('id')
        .single();

      if (businessError) throw businessError;

      const businessId = businessData.id;

      // 2. Add current user as owner
      const { error: memberError } = await supabase
        .from('business_members')
        .insert({
          business_id: businessId,
          user_profile_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      // Invalidate my-businesses cache
      await queryClient.invalidateQueries({ queryKey: ['my-businesses'] });

      setSaveSuccess(true);
      
      toast.success('Business profile created!');

      // Navigate to success screen with business details
      setTimeout(() => {
        navigate('/business/success', {
          state: {
            businessId: businessId,
            businessName: formData.businessName,
            category: formData.businessCategory || 'Business',
            location: formattedLocation,
            avatarUrl: undefined, // No avatar uploaded during creation
            username: undefined, // Business accounts don't have usernames in this flow
          },
        });
      }, 600);
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
          {/* Back link - slate color */}
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>

          {/* Step indicator - muted */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground/70">
              Step 2 of 2
            </span>
          </div>
          
          {/* Title */}
          <h1 className="text-xl font-semibold text-center mt-1 text-foreground">
            Set up your business profile
          </h1>
          
          {/* Subtitle */}
          <p className="text-sm text-muted-foreground text-center mt-1">
            This is how your business will appear to golfers on clbhouz.
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl pb-28">
          {/* Section: Business Identity */}
          <motion.section
            custom={0}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-5 bg-background border-b border-border/30"
          >
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Business identity</h2>
            </div>

            <div className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="businessName" className="text-xs text-muted-foreground">
                  Business Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="e.g., Royal Golf Club"
                  className="h-10 capitalize"
                  autoCapitalize="words"
                />
                <p className="text-[11px] text-muted-foreground">
                  This is shown publicly on your profile and in search.
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
                    {BUSINESS_CATEGORIES_WITH_ICONS.map((category) => {
                      const Icon = category.icon;
                      return (
                        <SelectItem key={category.value} value={category.value}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span>{category.label}</span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  This helps golfers find the right type of business.
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
                  className="min-h-[120px] resize-none rounded-[14px] leading-relaxed"
                  maxLength={500}
                />
                <p className="text-[11px] text-muted-foreground">
                  Tip: Mention what makes you different - facilities, coaching style, atmosphere, or events.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Section: Location & Contact */}
          <motion.section
            custom={1}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-5 bg-muted/30 border-b border-border/30"
          >
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Location & contact</h2>
            </div>
            
            {!isValid && formData.businessName.trim().length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Add a location and at least one contact method (website or email) to continue.
              </p>
            )}

            <div className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Location <span className="text-destructive">*</span>
                </Label>
                <LocationAutocomplete
                  value={location}
                  onChange={(val) => {
                    setLocation(val);
                    setLocationError(null);
                  }}
                  placeholder="Search for a city…"
                  error={locationError || undefined}
                />
                <p className="text-[11px] text-muted-foreground">
                  Choose your main base so golfers know where to find you.
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
                    Contact email
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
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    Phone
                  </Label>
                  <PhoneInputWithDialCode
                    value={phone}
                    onChange={setPhone}
                  />
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground pt-3">
                Your contact details are only shown on your business profile.
              </p>
            </div>
          </motion.section>

          {/* Verification callout - aspirational, not blocking */}
          <motion.section
            custom={2}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-5"
          >
            <div className="space-y-3">
              {/* Header with badge icon */}
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100">
                  <BadgeCheck className="h-3.5 w-3.5 text-slate-600" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Get verified on clbhouz</h3>
              </div>
              
              {/* Body */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                Once your profile is live, you can request verification to show golfers your business is authentic and trusted.
              </p>
              
              {/* How it works bullets */}
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground/60 mt-1.5">•</span>
                  <span>Submit a verification request from your business profile</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground/60 mt-1.5">•</span>
                  <span>We'll review your details</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground/60 mt-1.5">•</span>
                  <span>Approved profiles receive a verified badge</span>
                </li>
              </ul>
              
              {/* Optional helper */}
              <p className="text-[11px] text-muted-foreground/70">
                Verification is optional and not required to use clbhouz.
              </p>
            </div>
          </motion.section>
        </div>
      </main>

      {/* Sticky Footer */}
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border/40 bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
          {/* Secondary: text button */}
          <button
            type="button"
            onClick={handleBack}
            disabled={saving}
            className="flex-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2.5"
          >
            Cancel
          </button>

          {/* Primary: slate button */}
          <Button
            variant="secondary"
            onClick={handleSubmit}
            disabled={saving || saveSuccess || !isValid}
            className={cn(
              "flex-[1.5] h-11",
              saveSuccess && "bg-emerald-500 hover:bg-emerald-500 text-white"
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
                  Create business profile
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </footer>
    </PageRoot>
  );
};

export default BusinessCreatePage;
