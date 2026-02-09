import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Building2, MapPin, Globe, Mail, Phone, 
  Check, Loader2, Flag, 
  AlertCircle, Camera, Trash2
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
import { AddressAutocomplete, AddressValue } from '@/components/business/AddressAutocomplete';
import { PinDropModal } from '@/components/business/PinDropModal';
import { PhoneInputWithDialCode, PhoneValue } from '@/components/business/PhoneInputWithDialCode';
import { CountrySelector, getCountryCode, getCountryDisplayName } from '@/components/business/CountrySelector';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { DeleteBusinessDialog } from '@/components/business/DeleteBusinessDialog';
import { SectionJumpStrip } from '@/components/profile/edit-v2/SectionJumpStrip';
import { MapPreview } from '@/components/map/MapPreview';
import { ImageCropModal } from '@/components/business/ImageCropModal';
import { BUSINESS_CATEGORIES_WITH_ICONS } from '@/constants/businessCategories';

// Cover aspect ratio: 1600x500 = 3.2:1
const COVER_ASPECT_RATIO = 3.2;

const SECTIONS = [
  { id: 'photos', label: 'Photos' },
  { id: 'identity', label: 'Business Identity' },
  { id: 'about', label: 'About' },
  { id: 'location', label: 'Location' },
];

// Categories imported from constants/businessCategories.ts (single source of truth)

// Section header component (no card - matches personal profile)
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

const BusinessEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useSupabaseSession();
  
  const { data: business, isLoading: businessLoading, error: businessError } = useBusinessProfile(id);
  const { data: membership, isLoading: membershipLoading } = useBusinessMembership(id);
  const { uploadLogo: doUploadLogo, removeLogo: doRemoveLogo, uploadCover: doUploadCover, removeCover: doRemoveCover, uploadingLogo, uploadingCover } = useBusinessImageUpload(id);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  // Section refs for scroll-to
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeSection, setActiveSection] = useState('photos');
  const isScrollingFromClick = useRef(false);
  
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPinDropModal, setShowPinDropModal] = useState(false);
  const [address, setAddress] = useState<AddressValue | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [countrySelection, setCountrySelection] = useState<string | null>(null); // Stores country name (e.g., "England")
  const [phone, setPhone] = useState<PhoneValue | null>(null);
  
  // Image crop modal state
  const [logoCropModalOpen, setLogoCropModalOpen] = useState(false);
  const [coverCropModalOpen, setCoverCropModalOpen] = useState(false);
  const [selectedLogoImage, setSelectedLogoImage] = useState<string | null>(null);
  const [selectedCoverImage, setSelectedCoverImage] = useState<string | null>(null);
  
  // Deferred photo state — files held locally until Save
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [localLogoPreview, setLocalLogoPreview] = useState<string | null>(null);
  const [localCoverPreview, setLocalCoverPreview] = useState<string | null>(null);
  const [pendingRemoveLogo, setPendingRemoveLogo] = useState(false);
  const [pendingRemoveCover, setPendingRemoveCover] = useState(false);
  
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
    address: AddressValue | null;
    countrySelection: string | null;
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
      
      // Set address from existing data
      let newAddress: AddressValue | null = null;
      
      if (business.address_label || business.location) {
        newAddress = {
          label: business.address_label || business.location || '',
          addressLine1: business.address_line1 || undefined,
          addressLine2: business.address_line2 || undefined,
          city: business.city || undefined,
          region: business.region || undefined,
          postcode: business.postcode || undefined,
          country: business.country || undefined,
          countryCode: business.country || undefined,
          lat: business.lat || undefined,
          lng: business.lng || undefined,
          mapboxPlaceId: business.mapbox_place_id || undefined,
          precision: business.location_precision || 'city',
        };
        setAddress(newAddress);
      }
      
      // Set country selection - try to infer from business.country
      let newCountrySelection: string | null = null;
      if (business.country) {
        // Map common country names to our selection values
        const countryNameMap: Record<string, string> = {
          'United Kingdom': 'England', // Default to England for UK
          'UK': 'England',
          'GB': 'England',
          'Ireland': 'Ireland',
          'IE': 'Ireland',
          'United States': 'United States',
          'US': 'United States',
          'USA': 'United States',
          'Canada': 'Canada',
          'CA': 'Canada',
          'Australia': 'Australia',
          'AU': 'Australia',
          // If business.country is already a valid selection name, use it
        };
        newCountrySelection = countryNameMap[business.country] || business.country;
      }
      setCountrySelection(newCountrySelection);
      
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
        address: newAddress,
        countrySelection: newCountrySelection,
        phone: newPhone,
      });
    }
  }, [business]);

  // Detect if form is dirty (includes deferred photo changes)
  const isDirty = useMemo(() => {
    if (!initialValues) return false;
    
    const formChanged = JSON.stringify(formData) !== JSON.stringify(initialValues.formData);
    const addressChanged = JSON.stringify(address) !== JSON.stringify(initialValues.address);
    const countryChanged = countrySelection !== initialValues.countrySelection;
    const phoneChanged = JSON.stringify(phone) !== JSON.stringify(initialValues.phone);
    const photosChanged = !!pendingLogoFile || !!pendingCoverFile || pendingRemoveLogo || pendingRemoveCover;
    
    return formChanged || addressChanged || countryChanged || phoneChanged || photosChanged;
  }, [formData, address, countrySelection, phone, initialValues, pendingLogoFile, pendingCoverFile, pendingRemoveLogo, pendingRemoveCover]);

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

  // Section order for sequential movement
  const sectionOrder = ['photos', 'identity', 'about', 'location'];

  // Intersection observer for active section (scrollspy)
  useEffect(() => {
    if (businessLoading) return;

    const timeoutId = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (isScrollingFromClick.current) return;
          
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

          if (visible) {
            const newSectionId = visible.target.id;
            if (newSectionId) {
              setActiveSection(prev => {
                const currentIndex = sectionOrder.indexOf(prev);
                const newIndex = sectionOrder.indexOf(newSectionId);
                
                if (Math.abs(newIndex - currentIndex) <= 1 || currentIndex === -1) {
                  return newSectionId;
                }
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
          rootMargin: '-120px 0px -40% 0px',
        }
      );

      Object.values(sectionRefs.current).forEach((ref) => {
        if (ref) observer.observe(ref);
      });

      (window as any).__businessEditObserver = observer;
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if ((window as any).__businessEditObserver) {
        (window as any).__businessEditObserver.disconnect();
      }
    };
  }, [businessLoading]);

  // Scroll to section
  const handleSectionClick = useCallback((sectionId: string) => {
    isScrollingFromClick.current = true;
    setActiveSection(sectionId);
    
    const ref = sectionRefs.current[sectionId];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    setTimeout(() => {
      isScrollingFromClick.current = false;
    }, 600);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validation
  const isValid =
    formData.businessName.trim().length > 0 &&
    address !== null &&
    (formData.businessWebsite.trim().length > 0 ||
      formData.businessContactEmail.trim().length > 0);

  const handleSubmit = async () => {
    if (!address) {
      setAddressError('Please select an address');
      return;
    }
    
    if (!user?.id || !isValid || !id) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      // Upload deferred photos first
      if (pendingRemoveLogo) {
        await doRemoveLogo();
      } else if (pendingLogoFile) {
        await doUploadLogo(pendingLogoFile);
      }
      
      if (pendingRemoveCover) {
        await doRemoveCover();
      } else if (pendingCoverFile) {
        await doUploadCover(pendingCoverFile);
      }

      const { error: updateError } = await supabase
        .from('business_accounts')
        .update({
          name: formData.businessName,
          category: formData.businessCategory || null,
          location: address.label,
          address_label: address.label,
          address_line1: address.addressLine1 || null,
          address_line2: address.addressLine2 || null,
          city: address.city || null,
          region: address.region || null,
          postcode: address.postcode || null,
          country: address.country || null,
          lat: address.lat || null,
          lng: address.lng || null,
          mapbox_place_id: address.mapboxPlaceId || null,
          location_precision: address.precision || null,
          location_updated_at: new Date().toISOString(),
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

      // Reset deferred photo state
      setPendingLogoFile(null);
      setPendingCoverFile(null);
      setPendingRemoveLogo(false);
      setPendingRemoveCover(false);
      if (localLogoPreview) URL.revokeObjectURL(localLogoPreview);
      if (localCoverPreview) URL.revokeObjectURL(localCoverPreview);
      setLocalLogoPreview(null);
      setLocalCoverPreview(null);

      // Update initial values so form is no longer dirty
      setInitialValues({
        formData: { ...formData },
        address,
        countrySelection,
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
    // Reset to initial values including photos
    if (initialValues) {
      setFormData(initialValues.formData);
      setAddress(initialValues.address);
      setCountrySelection(initialValues.countrySelection);
      setPhone(initialValues.phone);
    }
    // Clear pending photo changes
    if (localLogoPreview) URL.revokeObjectURL(localLogoPreview);
    if (localCoverPreview) URL.revokeObjectURL(localCoverPreview);
    setPendingLogoFile(null);
    setPendingCoverFile(null);
    setLocalLogoPreview(null);
    setLocalCoverPreview(null);
    setPendingRemoveLogo(false);
    setPendingRemoveCover(false);
  };

  // Handle pin drop confirmation
  const handlePinDropConfirm = (value: AddressValue) => {
    setAddress(value);
    setAddressError(null);
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

          <div className="text-center mb-4">
            <h1 className="text-xl font-semibold text-foreground">Edit business profile</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Everything golfers see about your business
            </p>
          </div>

          {/* Section Jump Strip */}
          <SectionJumpStrip
            sections={SECTIONS}
            activeSection={activeSection}
            onSectionClick={handleSectionClick}
          />
        </div>
      </header>

      {/* Content - no cards, directly on background like personal profile */}
      <main className="flex-1 pb-28">
        <div className="mx-auto w-full max-w-xl">
          
          {/* Section 1: Photos (alternating band A) */}
          <section 
            id="photos"
            ref={(el) => { sectionRefs.current['photos'] = el; }}
            className="px-4 py-6 bg-muted/30"
          >
            <SectionHeader 
              title="Brand & visuals" 
              subtitle="Your logo and cover photo help golfers recognise your business instantly."
            />
            <div className="space-y-6">
              {/* Logo */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 relative">
                    {(!pendingRemoveLogo && (localLogoPreview || business?.logo_url)) ? (
                      <SquircleAvatar
                        key={localLogoPreview || business?.logo_url}
                        src={localLogoPreview || business?.logo_url}
                        alt={business?.name || 'Business'}
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
                        className="text-xs h-8"
                      >
                        Change
                      </Button>
                      {(business?.logo_url || localLogoPreview) && !pendingRemoveLogo && (
                        <button
                          onClick={() => {
                            setPendingRemoveLogo(true);
                            setPendingLogoFile(null);
                            if (localLogoPreview) URL.revokeObjectURL(localLogoPreview);
                            setLocalLogoPreview(null);
                          }}
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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Create object URL for cropping
                        const imageUrl = URL.createObjectURL(file);
                        setSelectedLogoImage(imageUrl);
                        setLogoCropModalOpen(true);
                      }
                      if (logoInputRef.current) logoInputRef.current.value = '';
                    }}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Header photo */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-medium">Header photo</h2>
                    <p className="text-xs text-muted-foreground">
                      This image appears at the top of your profile. Use a wide, landscape photo.
                    </p>
                  </div>
                  {(!pendingRemoveCover && (localCoverPreview || business?.cover_image_url)) && (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingRemoveCover(true);
                          setPendingCoverFile(null);
                          if (localCoverPreview) URL.revokeObjectURL(localCoverPreview);
                          setLocalCoverPreview(null);
                        }}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="relative w-full aspect-[3.2/1] overflow-hidden rounded-xl border border-dashed border-border/70 bg-muted/40 flex items-center justify-center hover:bg-muted/60 transition-colors group"
                >
                  {(!pendingRemoveCover && (localCoverPreview || business?.cover_image_url)) ? (
                    <>
                      <img
                        key={localCoverPreview || business?.cover_image_url}
                        src={localCoverPreview || business?.cover_image_url}
                        alt="Header preview"
                        className="h-full w-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex items-center gap-2 text-white text-sm font-medium">
                          <Camera className="w-4 h-4" />
                          Change photo
                        </div>
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Tap to upload a header photo
                    </span>
                  )}
                </button>

                <p className="mt-2 text-[11px] text-muted-foreground">
                  Recommended: 1600×500px or larger. JPG, PNG, or WebP.
                </p>

                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Create object URL for cropping
                      const imageUrl = URL.createObjectURL(file);
                      setSelectedCoverImage(imageUrl);
                      setCoverCropModalOpen(true);
                    }
                    if (coverInputRef.current) coverInputRef.current.value = '';
                  }}
                  className="hidden"
                />
              </div>
            </div>

            {/* Logo Crop Modal */}
            {selectedLogoImage && (
              <ImageCropModal
                open={logoCropModalOpen}
                onOpenChange={(open) => {
                  if (!open && selectedLogoImage) {
                    URL.revokeObjectURL(selectedLogoImage);
                    setSelectedLogoImage(null);
                  }
                  setLogoCropModalOpen(open);
                }}
                imageSrc={selectedLogoImage}
                aspectRatio={1}
                onCropComplete={(croppedFile) => {
                  // Store file for deferred upload on Save
                  setPendingLogoFile(croppedFile);
                  setPendingRemoveLogo(false);
                  
                  // Show local preview
                  if (localLogoPreview) URL.revokeObjectURL(localLogoPreview);
                  setLocalLogoPreview(URL.createObjectURL(croppedFile));
                  
                  // Clean up the original selected image URL
                  if (selectedLogoImage) {
                    URL.revokeObjectURL(selectedLogoImage);
                    setSelectedLogoImage(null);
                  }
                }}
                title="Crop Logo"
              />
            )}

            {/* Cover Crop Modal */}
            {selectedCoverImage && (
              <ImageCropModal
                open={coverCropModalOpen}
                onOpenChange={(open) => {
                  if (!open && selectedCoverImage) {
                    URL.revokeObjectURL(selectedCoverImage);
                    setSelectedCoverImage(null);
                  }
                  setCoverCropModalOpen(open);
                }}
                imageSrc={selectedCoverImage}
                aspectRatio={COVER_ASPECT_RATIO}
                onCropComplete={(croppedFile) => {
                  setPendingCoverFile(croppedFile);
                  setPendingRemoveCover(false);
                  if (localCoverPreview) URL.revokeObjectURL(localCoverPreview);
                  setLocalCoverPreview(URL.createObjectURL(croppedFile));
                  if (selectedCoverImage) {
                    URL.revokeObjectURL(selectedCoverImage);
                    setSelectedCoverImage(null);
                  }
                }}
                title="Crop Cover Photo"
              />
            )}
          </section>

          {/* Section 2: Business Identity (band B) */}
          <section 
            id="identity"
            ref={(el) => { sectionRefs.current['identity'] = el; }}
            className="px-4 py-6"
          >
            <SectionHeader 
              title="Business identity" 
              subtitle={business?.club_id 
                ? "This profile is linked to a verified club record." 
                : "This appears across clbhouz wherever your business is shown."}
            />
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="businessName" className="text-xs text-muted-foreground">
                  Business name <span className="text-destructive">*</span>
                </Label>
                {business?.club_id ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2.5 border border-border rounded-sq-sm bg-muted/50">
                      <Flag className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-foreground">{formData.businessName}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Linked to a club record. Contact support to update.
                    </p>
                  </>
                ) : (
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="e.g., Royal Golf Club"
                    className="h-10"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="businessCategory" className="text-xs text-muted-foreground">
                  Category
                </Label>
                {business?.club_id ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 border border-border rounded-sq-sm bg-muted/50">
                    <Flag className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground">{formData.businessCategory || 'Golf Club'}</span>
                  </div>
                ) : (
                  <Select
                    value={formData.businessCategory}
                    onValueChange={(value) => handleInputChange('businessCategory', value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_CATEGORIES_WITH_ICONS.map((category) => {
                        const IconComp = category.icon;
                        return (
                          <SelectItem key={category.value} value={category.value}>
                            <span className="flex items-center gap-2">
                              <IconComp className="h-4 w-4 text-muted-foreground" />
                              <span>{category.label}</span>
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </section>

          {/* Section 3: About (band A) */}
          <section 
            id="about"
            ref={(el) => { sectionRefs.current['about'] = el; }}
            className="px-4 py-6 bg-muted/30"
          >
            <SectionHeader 
              title="About" 
              subtitle="Tell golfers what you do, who you help, and what makes you different."
            />
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="businessBio" className="text-xs text-muted-foreground">
                  Description
                </Label>
                <span className="text-[11px] text-muted-foreground/70">
                  {formData.businessBio.length}/2500
                </span>
              </div>
              <Textarea
                id="businessBio"
                value={formData.businessBio}
                onChange={(e) => handleInputChange('businessBio', e.target.value)}
                placeholder="Tell golfers about your business..."
                className="min-h-[140px] resize-none"
                maxLength={2500}
              />
            </div>
          </section>

          {/* Section 4: Location & Contact (band B) */}
          <section 
            id="location"
            ref={(el) => { sectionRefs.current['location'] = el; }}
            className="px-4 py-6"
          >
            <SectionHeader 
              title="Location & contact" 
              subtitle={business?.club_id 
                ? "Location is linked to the club record." 
                : "Where you are and how golfers reach you."}
            />
            <div className="space-y-4">
              {business?.club_id ? (
                /* Locked location for linked clubs */
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Location
                  </Label>
                  <div className="flex items-center gap-2 px-3 py-2.5 border border-border rounded-sq-sm bg-muted/50">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground">
                      {address?.label || business?.location || 'Location unavailable'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Contact support to update the location for this linked club.
                  </p>
                </div>
              ) : (
                <>
                  {/* Country selector */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Country <span className="text-destructive">*</span>
                    </Label>
                    <CountrySelector
                      value={countrySelection}
                      onChange={(name) => {
                        setCountrySelection(name);
                        // Clear address when country changes
                        if (address) {
                          setAddress(null);
                        }
                      }}
                    />
                  </div>
                  
                  {/* Business address */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Business address <span className="text-destructive">*</span>
                    </Label>
                    <AddressAutocomplete
                      value={address}
                      onChange={(val) => {
                        setAddress(val);
                        setAddressError(null);
                      }}
                      onDropPinClick={() => setShowPinDropModal(true)}
                      countryCode={getCountryCode(countrySelection)}
                      countryDisplayName={getCountryDisplayName(countrySelection)}
                      placeholder="Start typing street, postcode/ZIP, or area…"
                      error={addressError || undefined}
                    />
                  </div>

                  {/* Map preview - shows immediately when address selected */}
                  <div className="mt-3">
                    {address?.lat != null && address?.lng != null && Number.isFinite(address.lat) && Number.isFinite(address.lng) ? (
                      <div 
                        key={`preview-${address.lat}-${address.lng}`} 
                        className="rounded-sq-md border border-slate-200 overflow-hidden"
                      >
                        <MapPreview
                          lat={address.lat}
                          lng={address.lng}
                          name={formData.businessName || 'Business location'}
                          height={160}
                          zoom={14}
                          markerColor="#F7931E"
                          showExpandButton={false}
                        />
                        <div className="px-3 py-2.5 flex items-center justify-between bg-white border-t border-slate-100">
                          <div className="flex items-center gap-2 text-sm min-w-0">
                            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="truncate text-slate-700">{address.city && address.country ? `${address.city}, ${address.country}` : address.label}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowPinDropModal(true)}
                            className="text-xs text-primary hover:underline flex-shrink-0 ml-2"
                          >
                            Adjust pin
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-sq-md border border-dashed border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-sq-sm bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <MapPin className="h-5 w-5 text-slate-400" />
                          </div>
                          <p className="text-sm text-slate-500">Select an address to preview your map pin.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Contact info - always editable */}
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
          </section>

          {/* Section 5: Delete (Owner only, band A) */}
          {isOwner && (
            <section className="px-4 py-6 bg-muted/30">
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
            </section>
          )}
        </div>
      </main>

      {/* Sticky Save Bar - Always visible */}
      <footer
        className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur shadow-lg"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {isDirty ? 'Unsaved changes' : ''}
          </span>
          <div className="flex items-center gap-2">
            {isDirty && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={saving}
                className="h-9"
              >
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={saving || saveSuccess || !isValid || !isDirty}
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
                'Save'
              )}
            </Button>
          </div>
        </div>
      </footer>

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

      {/* Pin Drop Modal */}
      <PinDropModal
        open={showPinDropModal}
        onOpenChange={setShowPinDropModal}
        onConfirm={handlePinDropConfirm}
        initialCenter={address?.lat && address?.lng ? { lat: address.lat, lng: address.lng } : undefined}
      />
    </PageRoot>
  );
};

export default BusinessEditPage;
