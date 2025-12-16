import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Building2, MapPin, Globe, Mail, Phone, 
  Check, Loader2, GraduationCap, ShoppingBag, Briefcase, Flag, 
  AlertCircle, Camera, ImageIcon, Trash2
} from 'lucide-react';
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
import { DeleteBusinessDialog } from '@/components/business/DeleteBusinessDialog';

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

// Card-based section component
function EditSection({ 
  children, 
  title, 
  subtitle,
  icon: Icon,
  index = 0 
}: { 
  children: React.ReactNode; 
  title: string; 
  subtitle?: string;
  icon?: React.ElementType;
  index?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25, ease: 'easeOut' }}
      className="rounded-sq-lg bg-card border border-border/50 p-5 shadow-sm"
    >
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </motion.section>
  );
}

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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

  // Track initial values for dirty detection
  const [initialValues, setInitialValues] = useState<{
    formData: typeof formData;
    location: LocationValue | null;
    phone: PhoneValue | null;
  } | null>(null);

  // Populate form when business data loads
  useEffect(() => {
    if (business) {
      const newFormData = {
        businessName: business.name || '',
        businessCategory: business.category || '',
        businessWebsite: business.website || '',
        businessContactEmail: business.email || '',
        businessBio: business.description || '',
      };
      setFormData(newFormData);
      
      // Set location from existing data
      let newLocation: LocationValue | null = null;
      if (business.location) {
        const parts = business.location.split(',').map(p => p.trim());
        newLocation = {
          label: business.location,
          city: parts[0] || '',
          country: parts[1] || '',
          countryCode: '',
        };
        setLocation(newLocation);
      }
      
      // Set phone from existing data
      let newPhone: PhoneValue | null = null;
      if (business.phone) {
        newPhone = {
          dialCode: '+44',
          localNumber: business.phone.replace(/^\+\d+\s*/, ''),
          fullNumber: business.phone,
        };
        setPhone(newPhone);
      }

      // Store initial values for dirty detection
      setInitialValues({
        formData: newFormData,
        location: newLocation,
        phone: newPhone,
      });
    }
  }, [business]);

  // Detect if form is dirty
  const isDirty = useMemo(() => {
    if (!initialValues) return false;
    
    const formChanged = JSON.stringify(formData) !== JSON.stringify(initialValues.formData);
    const locationChanged = JSON.stringify(location) !== JSON.stringify(initialValues.location);
    const phoneChanged = JSON.stringify(phone) !== JSON.stringify(initialValues.phone);
    
    return formChanged || locationChanged || phoneChanged;
  }, [formData, location, phone, initialValues]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  // Check permissions - only owner/admin can edit
  const canEdit = membership?.canManage;
  const isOwner = membership?.role === 'owner';
  
  useEffect(() => {
    if (!membershipLoading && membership && !canEdit) {
      toast.error("You don't have permission to edit this business");
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
      const formattedLocation = location.country 
        ? `${location.city}, ${location.country}`
        : location.label;

      const { error: updateError } = await supabase
        .from('business_accounts')
        .update({
          name: formData.businessName,
          category: formData.businessCategory || null,
          location: formattedLocation,
          lat: location.lat || null,
          lng: location.lng || null,
          website: formData.businessWebsite || null,
          email: formData.businessContactEmail || null,
          phone: phone?.fullNumber || null,
          description: formData.businessBio || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      await queryClient.invalidateQueries({ queryKey: ['my-businesses'] });
      await queryClient.invalidateQueries({ queryKey: ['business-profile', id] });

      setSaveSuccess(true);
      toast.success('Changes saved');

      // Update initial values so form is no longer dirty
      setInitialValues({
        formData: { ...formData },
        location,
        phone,
      });

      setTimeout(() => {
        setSaveSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Error updating business profile:', error);
      toast.error('Unable to save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to initial values
    if (initialValues) {
      setFormData(initialValues.formData);
      setLocation(initialValues.location);
      setPhone(initialValues.phone);
    }
  };

  const handleBack = () => {
    navigate(`/business/${id}`);
  };

  if (authLoading || businessLoading || membershipLoading) {
    return (
      <PageRoot className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </PageRoot>
    );
  }

  if (businessError || !business) {
    return (
      <PageRoot className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Business not found</h1>
          <p className="text-muted-foreground mb-6">
            This business may have been removed or is no longer available.
          </p>
          <Button onClick={() => navigate(-1)}>Go back</Button>
        </div>
      </PageRoot>
    );
  }

  return (
    <PageRoot className="min-h-screen flex flex-col bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="mx-auto w-full max-w-xl px-4 py-4">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to profile</span>
          </button>

          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground">Edit business profile</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Everything golfers see about your business
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-28">
        <div className="mx-auto w-full max-w-xl px-4 py-6 space-y-4">
          
          {/* Section 1: Brand & Visuals */}
          <EditSection
            title="Brand & visuals"
            subtitle="Your logo and cover photo help golfers recognise your business instantly."
            icon={ImageIcon}
            index={0}
          >
            <div className="space-y-5">
              {/* Logo */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {business?.logo_url ? (
                      <SquircleAvatar
                        src={business.logo_url}
                        alt={business.name}
                        size={72}
                        className=""
                      />
                    ) : (
                      <div className="w-[72px] h-[72px] rounded-sq-md bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                        {business?.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="text-xs h-8"
                      >
                        {uploadingLogo ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          'Change'
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
                    <p className="text-[11px] text-muted-foreground">
                      Square image, minimum 500×500
                    </p>
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        await uploadLogo(file);
                        toast.success('Logo updated');
                      }
                      if (logoInputRef.current) logoInputRef.current.value = '';
                    }}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Cover photo */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Cover photo</Label>
                <div className="relative w-full h-28 rounded-sq-md overflow-hidden border border-border mb-2">
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
                    className="text-xs h-8"
                  >
                    {uploadingCover ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      'Change'
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
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Landscape image, 3:1 ratio recommended
                </p>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      await uploadCover(file);
                      toast.success('Cover photo updated');
                    }
                    if (coverInputRef.current) coverInputRef.current.value = '';
                  }}
                  className="hidden"
                />
              </div>
            </div>
          </EditSection>

          {/* Section 2: Business Identity */}
          <EditSection
            title="Business identity"
            subtitle="This appears across clbhouz wherever your business is shown."
            icon={Building2}
            index={1}
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="businessName" className="text-xs text-muted-foreground">
                  Business name <span className="text-destructive">*</span>
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
            </div>
          </EditSection>

          {/* Section 3: About */}
          <EditSection
            title="About"
            subtitle="Tell golfers what you do, who you help, and what makes you different."
            index={2}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="businessBio" className="text-xs text-muted-foreground">
                  Description
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
                className="min-h-[140px] resize-none"
                maxLength={500}
              />
            </div>
          </EditSection>

          {/* Section 4: Location & Contact */}
          <EditSection
            title="Location & contact"
            subtitle="Where you are and how golfers reach you."
            icon={MapPin}
            index={3}
          >
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
                {formData.businessWebsite && (
                  <a 
                    href={formData.businessWebsite.startsWith('http') ? formData.businessWebsite : `https://${formData.businessWebsite}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    {formData.businessWebsite}
                  </a>
                )}
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
                  {formData.businessContactEmail && (
                    <a 
                      href={`mailto:${formData.businessContactEmail}`}
                      className="text-xs text-primary hover:underline"
                    >
                      {formData.businessContactEmail}
                    </a>
                  )}
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
          </EditSection>

          {/* Section 5: Delete (Owner only) */}
          {isOwner && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.25, ease: 'easeOut' }}
              className="rounded-sq-lg border border-destructive/30 bg-destructive/5 p-5"
            >
              <div className="flex items-start gap-3">
                <Trash2 className="w-5 h-5 text-destructive/70 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Delete business profile
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    This permanently removes the business from clbhouz. This cannot be undone.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  >
                    Delete business profile
                  </Button>
                </div>
              </div>
            </motion.section>
          )}
        </div>
      </main>

      {/* Sticky Save Bar - Only shows when dirty */}
      <AnimatePresence>
        {isDirty && (
          <motion.footer
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur shadow-lg"
          >
            <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm text-muted-foreground">Unsaved changes</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={saving}
                  className="h-9"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={saving || saveSuccess || !isValid}
                  className={cn(
                    "h-9 min-w-[100px]",
                    saveSuccess && "bg-emerald-500 hover:bg-emerald-500"
                  )}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving…
                    </span>
                  ) : saveSuccess ? (
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Saved
                    </span>
                  ) : (
                    'Save changes'
                  )}
                </Button>
              </div>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>

      {/* Delete Dialog */}
      {id && user?.id && (
        <DeleteBusinessDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          businessId={id}
          businessName={business?.name || ''}
          userId={user.id}
        />
      )}
    </PageRoot>
  );
};

export default BusinessEditPage;
