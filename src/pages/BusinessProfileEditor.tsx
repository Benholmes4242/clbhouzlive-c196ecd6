/**
 * BusinessProfileEditor — unified create + edit surface for business profiles.
 *
 * Replaces the legacy 3-step wizards (BusinessProfileWizard, BusinessEditWizard)
 * with a single-page editor modelled on the personal EditProfile pattern:
 * sticky save header + stacked SectionCards. Mode is driven by the route:
 *   /business/create         → create mode (no :id)
 *   /business/:id/edit       → edit mode  (loads existing)
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessImageUpload } from '@/hooks/useBusinessImageUpload';
import { AppLog } from '@/lib/logger';

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
import { PageRoot } from '@/components/layout/PageRoot';
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';

import { BIZ } from '@/components/business/businessTokens';
import { SelectedClub } from '@/components/business/ClubSearchDropdown';
import { SelectedCollege } from '@/components/business/CollegeSearchDropdown';
import { AddressValue } from '@/components/business/AddressAutocomplete';
import { PinDropModal } from '@/components/business/PinDropModal';
import { PhoneValue } from '@/components/business/PhoneInputWithDialCode';
import { ImageCropModal } from '@/components/business/ImageCropModal';
import { RequestAccessModal } from '@/components/business/RequestAccessModal';
import { RequestClubModal } from '@/components/business/RequestClubModal';
import { getCountryCodeFromClub } from '@/utils/countryCodeMapping';

import { IdentitySection } from '@/components/business/editor/IdentitySection';
import { LocationContactSection } from '@/components/business/editor/LocationContactSection';
import { BrandingSection } from '@/components/business/editor/BrandingSection';
import { SocialSection } from '@/components/business/editor/SocialSection';
import {
  DEFAULT_OPENING_HOURS,
  OpeningHours,
  SocialFields,
  ImageState,
  emptyImage,
} from '@/components/business/editor/editorTypes';

import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';

import type { Database } from '@/integrations/supabase/types';

/* ─────────────────────── constants ─────────────────────── */

const COVER_ASPECT_RATIO = 3.2;

type Mode = 'create' | 'edit';


/* ─────────────────────── component ─────────────────────── */

export default function BusinessProfileEditor() {
  const { id } = useParams<{ id: string }>();
  const mode: Mode = id ? 'edit' : 'create';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useSupabaseSession();

  useHideBottomNav();
  useHideHeader();

  /* ── edit-mode data load ────────────────────────────── */
  const { data: business, isLoading: businessLoading, error: businessError } =
    useBusinessProfile(mode === 'edit' ? id : undefined);
  const { data: membership, isLoading: membershipLoading } = useBusinessMembership(
    mode === 'edit' ? id : undefined
  );
  const canEdit = mode === 'create' || membership?.canManage;

  /* ── identity ─────────────────────────────────────── */
  const [category, setCategory] = useState(
    searchParams.get('category') === 'golf_club' ? 'Golf Club' : ''
  );
  const [selectedClub, setSelectedClub] = useState<SelectedClub | null>(null);
  const [selectedCollege, setSelectedCollege] = useState<SelectedCollege | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [foundedYear, setFoundedYear] = useState('');

  /* ── contact / location ───────────────────────────── */
  const [address, setAddress] = useState<AddressValue | null>(null);
  const [countrySelection, setCountrySelection] = useState<string | null>(null);
  const [phone, setPhone] = useState<PhoneValue | null>(null);
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');
  const [openingHours, setOpeningHours] = useState<OpeningHours>({ ...DEFAULT_OPENING_HOURS });
  const [showPinDropModal, setShowPinDropModal] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  /* ── branding ─────────────────────────────────────── */
  const [logo, setLogo] = useState<ImageState>(emptyImage);
  const [cover, setCover] = useState<ImageState>(emptyImage);
  const [logoCropOpen, setLogoCropOpen] = useState(false);
  const [coverCropOpen, setCoverCropOpen] = useState(false);
  const [logoCropSrc, setLogoCropSrc] = useState<string | null>(null);
  const [coverCropSrc, setCoverCropSrc] = useState<string | null>(null);

  /* ── social ───────────────────────────────────────── */
  const [social, setSocial] = useState<SocialFields>({
    instagram: '',
    twitter: '',
    facebook: '',
    youtube: '',
  });

  /* ── flow state ───────────────────────────────────── */
  const [saving, setSaving] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [existingBusinessForClub, setExistingBusinessForClub] = useState<
    { id: string; name: string } | null
  >(null);
  const [showRequestAccessModal, setShowRequestAccessModal] = useState(false);
  const [showRequestClubModal, setShowRequestClubModal] = useState(false);
  const [clubSearchQuery] = useState('');

  /* ── prefilled club from URL params (Claim this course) ── */
  const prefilledClubId = searchParams.get('clubId');
  const prefilledClubName = searchParams.get('clubName');
  useEffect(() => {
    if (mode === 'create' && prefilledClubId && prefilledClubName && !selectedClub) {
      setSelectedClub({
        id: prefilledClubId,
        name: prefilledClubName,
        club_key: null,
        country: null,
        sub_country: null,
        region: null,
        latitude: null,
        longitude: null,
      } as SelectedClub);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledClubId, prefilledClubName, mode]);

  /* ── auth gate ────────────────────────────────────── */
  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  /* ── permission gate (edit) ───────────────────────── */
  useEffect(() => {
    if (mode === 'edit' && !membershipLoading && membership && !membership.canManage) {
      toast.error("You don't have permission to edit this business");
      navigate(`/business/${id}`);
    }
  }, [mode, membershipLoading, membership, id, navigate]);

  /* ── populate from existing business ──────────────── */
  const initialSnapshotRef = useRef<string | null>(null);
  useEffect(() => {
    if (mode !== 'edit' || !business || initialSnapshotRef.current) return;

    setCategory(business.category || '');
    setBusinessName(business.name || '');
    setDescription(business.description || '');
    setFoundedYear(business.founded_year ? String(business.founded_year) : '');
    setWebsite(business.website || '');
    setEmail(business.email || '');
    setBookingUrl(business.booking_url || '');

    if (business.address_label || business.location) {
      setAddress({
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
      });
    }

    if (business.country) {
      const map: Record<string, string> = {
        'United Kingdom': 'England',
        UK: 'England',
        GB: 'England',
        Ireland: 'Ireland',
        IE: 'Ireland',
        'United States': 'United States',
        US: 'United States',
        USA: 'United States',
        Canada: 'Canada',
        CA: 'Canada',
        Australia: 'Australia',
        AU: 'Australia',
      };
      setCountrySelection(map[business.country] || business.country);
    }

    if (business.phone) {
      setPhone({
        dialCode: '',
        localNumber: business.phone.replace(/^\+\d+\s*/, ''),
        fullNumber: business.phone,
      });
    }

    setOpeningHours(business.opening_hours ? { ...business.opening_hours } : { ...DEFAULT_OPENING_HOURS });

    const sl = business.social_links || {};
    setSocial({
      instagram: sl.instagram || '',
      twitter: sl.twitter || '',
      facebook: sl.facebook || '',
      youtube: sl.youtube || '',
    });

    setLogo({ ...emptyImage, url: business.logo_url || null });
    setCover({ ...emptyImage, url: business.cover_image_url || null });

    // snapshot for dirty detection (stringify a stable subset)
    initialSnapshotRef.current = JSON.stringify({
      n: business.name, d: business.description, fy: business.founded_year,
      w: business.website, e: business.email, p: business.phone, b: business.booking_url,
      oh: business.opening_hours, sl, addr: business.address_label, loc: business.location,
    });
  }, [mode, business]);

  /* ── club-linked & duplicate-check ────────────────── */
  const isClubLinked = mode === 'edit' ? !!business?.club_id : false;
  const isGolfClub = category === 'Golf Club';
  const isUniversity = category === 'University / College';

  useEffect(() => {
    if (mode !== 'create' || !selectedClub?.id) {
      setExistingBusinessForClub(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('business_accounts')
          .select('id, name')
          .eq('club_id', selectedClub.id)
          .eq('is_deleted', false)
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        setExistingBusinessForClub(data);
        if (!data && selectedClub) {
          const locationLabel = [selectedClub.sub_country, selectedClub.region, selectedClub.country]
            .filter(Boolean)
            .join(', ');
          setAddress({
            label: locationLabel,
            city: selectedClub.sub_country || selectedClub.region || '',
            region: selectedClub.region || undefined,
            country: selectedClub.sub_country || selectedClub.country || '',
            countryCode: getCountryCodeFromClub(selectedClub) || '',
            lat: selectedClub.latitude || undefined,
            lng: selectedClub.longitude || undefined,
            precision: 'city',
          });
        }
      } catch (e) {
        AppLog.error('[BusinessProfileEditor]', 'club dup check failed', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, selectedClub?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── resolved name + validation ───────────────────── */
  const resolvedName = useMemo(() => {
    if (isGolfClub && selectedClub) return selectedClub.name;
    if (isUniversity && selectedCollege) return selectedCollege.college_name;
    return businessName.trim();
  }, [isGolfClub, isUniversity, selectedClub, selectedCollege, businessName]);

  const isValid = useMemo(() => {
    if (mode === 'create') {
      if (!category) return false;
      if (isGolfClub) return !!selectedClub && !existingBusinessForClub;
      if (isUniversity) return !!selectedCollege;
      return resolvedName.length > 0;
    }
    // edit: always require a name (club-linked is always set)
    return resolvedName.length > 0 || isClubLinked;
  }, [mode, category, isGolfClub, isUniversity, selectedClub, selectedCollege, existingBusinessForClub, resolvedName, isClubLinked]);

  /* ── dirty (edit mode) ────────────────────────────── */
  const currentSnapshot = useMemo(() => {
    if (mode !== 'edit') return '';
    return JSON.stringify({
      n: businessName, d: description, fy: foundedYear ? parseInt(foundedYear, 10) : null,
      w: website, e: email, p: phone?.fullNumber || null, b: bookingUrl,
      oh: openingHours, sl: social,
      addr: address?.label || null, loc: address?.label || null,
    });
  }, [mode, businessName, description, foundedYear, website, email, phone, bookingUrl, openingHours, social, address]);

  const isDirty = useMemo(() => {
    if (mode === 'create') {
      return !!(category || businessName || selectedClub || selectedCollege || description);
    }
    if (!initialSnapshotRef.current) return false;
    const fieldsDirty = currentSnapshot !== initialSnapshotRef.current;
    const imagesDirty =
      !!logo.pendingFile || !!cover.pendingFile || logo.pendingRemove || cover.pendingRemove;
    return fieldsDirty || imagesDirty;
  }, [mode, category, businessName, selectedClub, selectedCollege, description, currentSnapshot, logo, cover]);

  /* ── image handlers ──────────────────────────────── */
  const onLogoFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setLogoCropSrc(url);
    setLogoCropOpen(true);
  };
  const onLogoCropped = (file: File) => {
    if (logo.localPreview) URL.revokeObjectURL(logo.localPreview);
    setLogo({
      ...logo,
      pendingFile: file,
      pendingRemove: false,
      localPreview: URL.createObjectURL(file),
    });
    if (logoCropSrc) URL.revokeObjectURL(logoCropSrc);
    setLogoCropSrc(null);
  };
  const onLogoRemove = () => {
    if (logo.localPreview) URL.revokeObjectURL(logo.localPreview);
    setLogo({ ...logo, pendingFile: null, pendingRemove: true, localPreview: null });
  };
  const onCoverFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setCoverCropSrc(url);
    setCoverCropOpen(true);
  };
  const onCoverCropped = (file: File) => {
    if (cover.localPreview) URL.revokeObjectURL(cover.localPreview);
    setCover({
      ...cover,
      pendingFile: file,
      pendingRemove: false,
      localPreview: URL.createObjectURL(file),
    });
    if (coverCropSrc) URL.revokeObjectURL(coverCropSrc);
    setCoverCropSrc(null);
  };
  const onCoverRemove = () => {
    if (cover.localPreview) URL.revokeObjectURL(cover.localPreview);
    setCover({ ...cover, pendingFile: null, pendingRemove: true, localPreview: null });
  };
  const effectiveLogoUrl = logo.pendingRemove ? null : logo.localPreview || logo.url;
  const effectiveCoverUrl = cover.pendingRemove ? null : cover.localPreview || cover.url;




  /* ── close handling ──────────────────────────────── */
  const exitTo = mode === 'edit' && id ? `/business/${id}` : -1;
  const handleClose = () => {
    if (isDirty) setShowCloseConfirm(true);
    else (exitTo === -1 ? navigate(-1) : navigate(exitTo as string));
  };
  const confirmClose = () => {
    setShowCloseConfirm(false);
    if (logo.localPreview) URL.revokeObjectURL(logo.localPreview);
    if (cover.localPreview) URL.revokeObjectURL(cover.localPreview);
    exitTo === -1 ? navigate(-1) : navigate(exitTo as string);
  };

  /* ── save: edit mode uses this hook (needs id) ───── */
  const { uploadLogo, removeLogo, uploadCover, removeCover } = useBusinessImageUpload(
    mode === 'edit' ? id : undefined
  );

  const handleSave = useCallback(async () => {
    if (!user?.id) return;
    if (!isValid) return;
    setSaving(true);
    try {
      const socialLinks = {
        instagram: social.instagram || null,
        twitter: social.twitter || null,
        facebook: social.facebook || null,
        youtube: social.youtube || null,
      };
      const hasSocial = Object.values(socialLinks).some(Boolean);

      if (mode === 'create') {
        const insertData: Database['public']['Tables']['business_accounts']['Insert'] = {
          name: resolvedName,
          category,
          description: description || null,
          founded_year: foundedYear ? parseInt(foundedYear, 10) : null,
          website: website.trim() || null,
          email: email.trim() || null,
          phone: phone?.fullNumber || null,
          booking_url: bookingUrl.trim() || null,
          opening_hours: openingHours as any,
          social_links: hasSocial ? (socialLinks as any) : null,
          is_verified: false,
        };


        if (isGolfClub && selectedClub) {
          insertData.club_id = selectedClub.id;
          insertData.club_key = selectedClub.club_key || null;
          insertData.lat = selectedClub.latitude || null;
          insertData.lng = selectedClub.longitude || null;
          insertData.country = selectedClub.country || null;
        }

        if (address) {
          insertData.location = address.label;
          insertData.address_label = address.label;
          insertData.address_line1 = address.addressLine1 || null;
          insertData.address_line2 = address.addressLine2 || null;
          insertData.city = address.city || null;
          insertData.region = address.region || null;
          insertData.postcode = address.postcode || null;
          if (!insertData.country) insertData.country = address.country || null;
          if (insertData.lat == null) insertData.lat = address.lat ?? null;
          if (insertData.lng == null) insertData.lng = address.lng ?? null;
          insertData.mapbox_place_id = address.mapboxPlaceId || null;
          insertData.location_precision = address.precision || null;
        }

        const { data: row, error: insertErr } = await supabase
          .from('business_accounts')
          .insert(insertData)
          .select('id, slug')
          .single();
        if (insertErr) throw insertErr;
        const newId = row.id;

        // images after insert
        let logoUrl: string | null = null;
        let coverUrlVal: string | null = null;
        if (logo.pendingFile) {
          // direct upload path — useBusinessImageUpload requires id, so call it directly via a transient hook is awkward.
          // Instead inline the same supabase update once we have the id.
          // Simpler: use a one-off uploader by calling the same hook signature via a helper.
          logoUrl = await uploadImageDirect(newId, logo.pendingFile, 'logo');
        }
        if (cover.pendingFile) {
          coverUrlVal = await uploadImageDirect(newId, cover.pendingFile, 'cover');
        }
        if (logoUrl || coverUrlVal) {
          const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
          if (logoUrl) patch.logo_url = logoUrl;
          if (coverUrlVal) patch.cover_image_url = coverUrlVal;
          await supabase.from('business_accounts').update(patch).eq('id', newId);
        }

        // owner row
        const { error: memberErr } = await supabase.from('business_members').insert({
          business_id: newId,
          user_profile_id: user.id,
          role: 'owner',
        });
        if (memberErr) throw memberErr;

        await queryClient.invalidateQueries({
          predicate: (query) => {
            const k = query.queryKey;
            if (!Array.isArray(k) || typeof k[0] !== 'string') return false;
            const key = k[0];
            return (
              key === 'my-businesses' ||
              key === 'business-profile' ||
              key === 'business-directory' ||
              key === 'suggestedBusinesses' ||
              key.startsWith('business-')
            );
          },
        });
        toast.success('Business created');
        navigate(`/business/${row.slug || newId}`);
        return;
      }

      // EDIT
      if (!id) throw new Error('Missing business id');

      // deferred image ops first
      if (logo.pendingRemove) await removeLogo();
      else if (logo.pendingFile) await uploadLogo(logo.pendingFile);
      if (cover.pendingRemove) await removeCover();
      else if (cover.pendingFile) await uploadCover(cover.pendingFile);

      const updatePayload: Record<string, unknown> = {
        description: description || null,
        founded_year: foundedYear ? parseInt(foundedYear, 10) : null,
        website: website || null,
        email: email || null,
        phone: phone?.fullNumber || null,
        booking_url: bookingUrl || null,
        opening_hours: openingHours as any,
        social_links: hasSocial ? (socialLinks as any) : null,

        updated_at: new Date().toISOString(),
      };
      if (!isClubLinked) {
        updatePayload.name = businessName;
      }
      if (!isClubLinked && address) {
        Object.assign(updatePayload, {
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
        });
      }

      const { error: updateErr } = await supabase
        .from('business_accounts')
        .update(updatePayload)
        .eq('id', id);
      if (updateErr) throw updateErr;

      await queryClient.invalidateQueries({
        predicate: (query) => {
          const k = query.queryKey;
          if (!Array.isArray(k) || typeof k[0] !== 'string') return false;
          const key = k[0];
          return (
            key === 'my-businesses' ||
            key === 'business-profile' ||
            key === 'business-directory' ||
            key === 'suggestedBusinesses' ||
            key.startsWith('business-')
          );
        },
      });

      if (logo.localPreview) URL.revokeObjectURL(logo.localPreview);
      if (cover.localPreview) URL.revokeObjectURL(cover.localPreview);

      toast.success('Changes saved');
      navigate(`/business/${id}`);
    } catch (e) {
      AppLog.error('[BusinessProfileEditor]', 'save failed', e);
      toast.error(mode === 'create' ? 'Failed to create business profile' : 'Unable to save your changes.');
    } finally {
      setSaving(false);
    }
  }, [
    mode, user?.id, id, isValid, resolvedName, category, description, foundedYear, website, email,
    phone, bookingUrl, openingHours, social, address, businessName, isClubLinked, isGolfClub,
    selectedClub, logo, cover, queryClient, navigate, uploadLogo, removeLogo, uploadCover, removeCover,
  ]);

  /* ── loading / error states (edit) ──────────────── */
  if (authLoading || (mode === 'edit' && (businessLoading || membershipLoading))) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: BIZ.pageBg }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: BIZ.amber }} />
      </div>
    );
  }
  if (mode === 'edit' && (businessError || !business)) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: BIZ.pageBg }}>
        <div className="max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-[16px] font-bold text-foreground mb-2">Business not found</h1>
          <p className="text-[13px] text-muted-foreground mb-6">This business may have been removed.</p>
          <button onClick={() => navigate(-1)} className="text-[14px] font-semibold" style={{ color: BIZ.amber }}>
            Go back
          </button>
        </div>
      </div>
    );
  }
  if (mode === 'edit' && !canEdit) return null;

  /* ── save button enabled ─────────────────────────── */
  const saveEnabled =
    isValid && !saving && (mode === 'create' ? true : isDirty);

  /* ── render ──────────────────────────────────────── */
  return (
    <PageRoot className="md:!max-w-[440px]">
      <div className="min-h-screen flex flex-col w-full" style={{ background: BIZ.pageBg }}>
        {/* Sticky save header */}
        <div
          className="sticky top-0 z-10 backdrop-blur-xl"
          style={{
            background: 'rgba(248,250,252,0.97)',
            borderBottom: `0.5px solid ${BIZ.hair}`,
            paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
          }}
        >
          <div className="flex items-center gap-2 px-3 py-2.5">
            <button
              onClick={handleClose}
              aria-label="Close"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-[0.97] transition-transform"
              style={{ color: BIZ.ink }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0 text-center">
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: BIZ.ink,
                  letterSpacing: '-0.01em',
                }}
              >
                {mode === 'create' ? 'Create business' : 'Edit business'}
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={!saveEnabled}
              className="min-h-[36px] px-4 rounded-full text-[13px] font-bold transition-opacity active:opacity-90"
              style={{
                background: saveEnabled ? BIZ.amber : 'rgba(15,23,42,0.06)',
                color: saveEnabled ? '#fff' : 'rgba(15,23,42,0.45)',
              }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pt-3 pb-12">
          <IdentitySection
            mode={mode}
            category={category}
            setCategory={setCategory}
            isGolfClub={isGolfClub}
            isUniversity={isUniversity}
            selectedClub={selectedClub}
            setSelectedClub={setSelectedClub}
            selectedCollege={selectedCollege}
            setSelectedCollege={setSelectedCollege}
            businessName={businessName}
            setBusinessName={setBusinessName}
            isClubLinked={isClubLinked}
            existingBusinessForClub={existingBusinessForClub}
            onRequestAccess={() => setShowRequestAccessModal(true)}
            onRequestClub={() => setShowRequestClubModal(true)}
            description={description}
            setDescription={setDescription}
            foundedYear={foundedYear}
            setFoundedYear={setFoundedYear}
          />

          <LocationContactSection
            mode={mode}
            isClubLinked={isClubLinked}
            isGolfClub={isGolfClub}
            selectedClub={selectedClub}
            address={address}
            setAddress={setAddress}
            addressError={addressError}
            setAddressError={setAddressError}
            countrySelection={countrySelection}
            setCountrySelection={setCountrySelection}
            phone={phone}
            setPhone={setPhone}
            email={email}
            setEmail={setEmail}
            website={website}
            setWebsite={setWebsite}
            bookingUrl={bookingUrl}
            setBookingUrl={setBookingUrl}
            openingHours={openingHours}
            setOpeningHours={setOpeningHours}
            resolvedName={resolvedName}
            onOpenPinDrop={() => setShowPinDropModal(true)}
            businessLocationFallback={business?.location ?? null}
          />

          <BrandingSection
            effectiveLogoUrl={effectiveLogoUrl}
            effectiveCoverUrl={effectiveCoverUrl}
            resolvedName={resolvedName}
            onLogoFile={onLogoFile}
            onLogoRemove={onLogoRemove}
            onCoverFile={onCoverFile}
            onCoverRemove={onCoverRemove}
          />

          <SocialSection social={social} setSocial={setSocial} />
        </div>
      </div>


      {/* Close confirm */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. They will be lost if you leave now.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmClose}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pin drop */}
      <PinDropModal
        open={showPinDropModal}
        onOpenChange={setShowPinDropModal}
        onConfirm={(val) => {
          setAddress(val);
          setAddressError(null);
        }}
        initialCenter={address?.lat && address?.lng ? { lat: address.lat, lng: address.lng } : undefined}
      />

      {/* Request access (already-claimed club) */}
      {existingBusinessForClub && user && (
        <RequestAccessModal
          open={showRequestAccessModal}
          onOpenChange={setShowRequestAccessModal}
          businessId={existingBusinessForClub.id}
          businessName={existingBusinessForClub.name}
          userId={user.id}
        />
      )}

      {/* Request missing course */}
      <RequestClubModal
        open={showRequestClubModal}
        onOpenChange={setShowRequestClubModal}
        initialName={clubSearchQuery}
      />

      {/* Crop modals */}
      {logoCropSrc && (
        <ImageCropModal
          open={logoCropOpen}
          onOpenChange={(open) => {
            if (!open && logoCropSrc) {
              URL.revokeObjectURL(logoCropSrc);
              setLogoCropSrc(null);
            }
            setLogoCropOpen(open);
          }}
          imageSrc={logoCropSrc}
          aspectRatio={1 / 1.05}
          onCropComplete={onLogoCropped}
          title="Crop Logo"
        />
      )}
      {coverCropSrc && (
        <ImageCropModal
          open={coverCropOpen}
          onOpenChange={(open) => {
            if (!open && coverCropSrc) {
              URL.revokeObjectURL(coverCropSrc);
              setCoverCropSrc(null);
            }
            setCoverCropOpen(open);
          }}
          imageSrc={coverCropSrc}
          aspectRatio={COVER_ASPECT_RATIO}
          onCropComplete={onCoverCropped}
          title="Crop Cover Photo"
        />
      )}
    </PageRoot>
  );
}

/* ─────────────────────── helpers ─────────────────────── */

// Inline image uploader for create mode — mirrors useBusinessImageUpload but
// works against a freshly-inserted business id without requiring the hook to
// re-bind.
async function uploadImageDirect(
  businessId: string,
  file: File,
  kind: 'logo' | 'cover'
): Promise<string | null> {
  const { uploadToR2Only } = await import('@/utils/r2OnlyUpload');
  const bucket = kind === 'logo' ? 'clbhouz-club-logos' : 'clbhouz-profile-banners';
  const ext = file.name.split('.').pop();
  const path = `${businessId}/${kind}-${Date.now()}.${ext}`;
  const result = await uploadToR2Only(file, bucket, path);
  if (!result.success) {
    AppLog.error('[BusinessProfileEditor]', `${kind} upload failed`, result.error);
    return null;
  }
  return result.publicUrl || null;
}
