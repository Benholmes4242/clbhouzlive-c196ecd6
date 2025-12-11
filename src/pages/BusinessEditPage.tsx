import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Building2, MapPin, Globe, Mail, Phone, Check, Loader2, GraduationCap, ShoppingBag, Briefcase, Flag, AlertCircle, Camera, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessImageUpload } from '@/hooks/useBusinessImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageRoot } from '@/components/layout/PageRoot';
import { cn } from '@/lib/utils';
import { LocationAutocomplete, LocationValue } from '@/components/business/LocationAutocomplete';
import { PhoneInputWithDialCode, PhoneValue } from '@/components/business/PhoneInputWithDialCode';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

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

const BusinessEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useSupabaseSession();
  
  const { data: business, isLoading: businessLoading, error: businessError } = useBusinessProfile(id);
  const { data: membership, isLoading: membershipLoading } = useBusinessMembership(id);
  const { uploadLogo, removeLogo, uploadCover, removeCover, uploadingLogo, uploadingCover } = useBusinessImageUpload(id);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
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

  // Populate form when business data loads
  useEffect(() => {
    if (business) {
      setFormData({
        businessName: business.name || '',
        businessCategory: business.category || '',
        businessWebsite: business.website || '',
        businessContactEmail: business.email || '',
        businessBio: business.description || '',
      });
      
      // Set location from existing data
      if (business.location) {
        const parts = business.location.split(',').map(p => p.trim());
        setLocation({
          label: business.location,
          city: parts[0] || '',
          country: parts[1] || '',
          countryCode: '', // Not stored, will be updated if user re-selects
        });
      }
      
      // Set phone from existing data
      if (business.phone) {
        setPhone({
          dialCode: '+44', // Default, would need to parse from stored data
          localNumber: business.phone.replace(/^\+\d+\s*/, ''),
          fullNumber: business.phone,
        });
      }
    }
  }, [business]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  // Check permissions - only owner/admin can edit
  const canEdit = membership?.canManage;
  
  useEffect(() => {
    if (!membershipLoading && membership && !canEdit) {
      toast.error('You do not have permission to edit this business');
      navigate(`/business/${id}`);
    }
  }, [membershipLoading, membership, canEdit, id, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validation
  const isValid =
    formData.businessName.trim().length > 0 &&
    location !== null &&
    (formData.businessWebsite.trim().length > 0 ||
      formData.businessContactEmail.trim().length > 0);

  const handleSubmit = async () => {
    if (!location) {
      setLocationError('Please select a location from the list');
      return;
    }
    
    if (!user?.id || !isValid || !id) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      // Format location as "City, Country" for cleaner display
      const formattedLocation = location.country 
        ? `${location.city}, ${location.country}`
        : location.label;

      const { error: updateError } = await supabase
        .from('business_accounts')
        .update({
          name: formData.businessName,
          category: formData.businessCategory || null,
          location: formattedLocation,
          website: formData.businessWebsite || null,
          email: formData.businessContactEmail || null,
          phone: phone?.fullNumber || null,
          description: formData.businessBio || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Invalidate caches
      await queryClient.invalidateQueries({ queryKey: ['my-businesses'] });
      await queryClient.invalidateQueries({ queryKey: ['business-profile', id] });

      setSaveSuccess(true);
      toast.success('Business profile updated');

      // Navigate back to business profile
      setTimeout(() => {
        navigate(`/business/${id}`);
      }, 600);
    } catch (error) {
      console.error('Error updating business profile:', error);
      toast.error('Unable to save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(`/business/${id}`);
  };

  if (authLoading || businessLoading || membershipLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (businessError || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">This business profile isn't available</h1>
          <p className="text-muted-foreground mb-6">
            It may have been removed or isn't visible to your account.
          </p>
          <Button onClick={() => navigate('/')}>
            Go home
          </Button>
        </div>
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
            <span>Back to profile</span>
          </button>

          <h1 className="text-xl font-semibold text-center">Edit business profile</h1>
          <p className="text-xs text-muted-foreground text-center mt-1">
            Update your business details to keep golfers informed and engaged.
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl pb-28">
          {/* Band 0: Images */}
          <motion.section
            custom={0}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-5 bg-background"
          >
            <div className="flex items-center gap-2 mb-1">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Images</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Your logo and cover photo help golfers recognize your business.
            </p>

            <div className="space-y-4">
              {/* Logo row */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {business?.logo_url ? (
                    <SquircleAvatar
                      src={business.logo_url}
                      alt={business.name}
                      size={64}
                      className="border-[2px] border-border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-sq-md bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground border-2 border-border">
                      {business?.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Logo</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="text-xs"
                    >
                      {uploadingLogo ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="h-3.5 w-3.5 mr-1.5" />
                          Change
                        </>
                      )}
                    </Button>
                    {business?.logo_url && (
                      <button
                        onClick={() => removeLogo()}
                        disabled={uploadingLogo}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) await uploadLogo(file);
                    if (logoInputRef.current) logoInputRef.current.value = '';
                  }}
                  className="hidden"
                />
              </div>

              {/* Cover photo row */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Cover photo</Label>
                <div className="relative w-full h-24 rounded-sq-md overflow-hidden border border-border">
                  {business?.cover_image_url ? (
                    <img
                      src={business.cover_image_url}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                    className="text-xs"
                  >
                    {uploadingCover ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Camera className="h-3.5 w-3.5 mr-1.5" />
                        Change
                      </>
                    )}
                  </Button>
                  {business?.cover_image_url && (
                    <button
                      onClick={() => removeCover()}
                      disabled={uploadingCover}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) await uploadCover(file);
                    if (coverInputRef.current) coverInputRef.current.value = '';
                  }}
                  className="hidden"
                />
              </div>
            </div>
          </motion.section>

          {/* Band A: Business Identity */}
          <motion.section
            custom={1}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-5 bg-background"
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
                  className="h-10 capitalize"
                  autoCapitalize="words"
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
              </div>
            </div>
          </motion.section>

          {/* Band B: Location & Contact */}
          <motion.section
            custom={2}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            className="px-4 py-5 bg-muted/30"
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
              "inline-flex h-11 flex-[1.5] items-center justify-center rounded-full px-5 text-sm font-semibold transition-all",
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
                  Save changes
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </footer>
    </PageRoot>
  );
};

export default BusinessEditPage;
