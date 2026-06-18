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
import { SectionEyebrow } from '@/components/ui/SectionEyebrow';
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

import { BIZ } from '@/components/business/businessTokens';
import { BUSINESS_CATEGORIES_WITH_ICONS } from '@/constants/businessCategories';
import { ClubSearchDropdown, SelectedClub } from '@/components/business/ClubSearchDropdown';
import { CollegeSearchDropdown, SelectedCollege } from '@/components/business/CollegeSearchDropdown';
import { AddressAutocomplete, AddressValue } from '@/components/business/AddressAutocomplete';
import { PinDropModal } from '@/components/business/PinDropModal';
import { PhoneInputWithDialCode, PhoneValue } from '@/components/business/PhoneInputWithDialCode';
import {
  CountrySelector,
  getCountryCode,
  getCountryDisplayName,
} from '@/components/business/CountrySelector';
import { MapPreview } from '@/components/map/MapPreview';
import { ImageCropModal } from '@/components/business/ImageCropModal';
import { RequestAccessModal } from '@/components/business/RequestAccessModal';
import { RequestClubModal } from '@/components/business/RequestClubModal';
import { getCountryCodeFromClub } from '@/utils/countryCodeMapping';

import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';

import type { Database } from '@/integrations/supabase/types';

/* ─────────────────────── constants ─────────────────────── */

const COVER_ASPECT_RATIO = 3.2;

const DAYS_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
type Day = typeof DAYS_ORDER[number];

interface OpeningHoursEntry {
  open: string;
  close: string;
  closed: boolean;
}
type OpeningHours = Record<string, OpeningHoursEntry>;

const DEFAULT_OPENING_HOURS: OpeningHours = {
  Mon: { open: '08:00', close: '18:00', closed: false },
  Tue: { open: '08:00', close: '18:00', closed: false },
  Wed: { open: '08:00', close: '18:00', closed: false },
  Thu: { open: '08:00', close: '18:00', closed: false },
  Fri: { open: '08:00', close: '18:00', closed: false },
  Sat: { open: '08:00', close: '18:00', closed: false },
  Sun: { open: '08:00', close: '18:00', closed: true },
};

const SOCIAL_PLATFORMS = [
  { field: 'instagram', label: 'Instagram', placeholder: '@yourhandle', icon: '📸' },
  { field: 'twitter', label: 'X / Twitter', placeholder: '@yourhandle', icon: '𝕏' },
  { field: 'facebook', label: 'Facebook', placeholder: 'facebook.com/…', icon: 'ƒ' },
  { field: 'youtube', label: 'YouTube', placeholder: 'youtube.com/c/…', icon: '▶' },
] as const;

const INPUT_CLASS =
  'w-full rounded-xl px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F7931E]/40 transition-colors';
const INPUT_STYLE = { background: '#ffffff', border: `1px solid ${BIZ.hair}` };
const LOCKED_CLASS =
  'flex items-center gap-2 rounded-xl px-4 py-3 text-[15px] text-muted-foreground';
const LOCKED_STYLE = {
  background: 'rgba(15,23,42,0.03)',
  border: `0.5px solid ${BIZ.hair}`,
};
const LABEL_CLASS = 'text-[13px] font-medium text-muted-foreground';
const HINT_CLASS = 'text-[12px] text-muted-foreground mt-1';

/* ─────────────────────── types ─────────────────────── */

type Mode = 'create' | 'edit';

interface SocialFields {
  instagram: string;
  twitter: string;
  facebook: string;
  youtube: string;
}

interface ImageState {
  url: string | null;
  pendingFile: File | null;
  pendingRemove: boolean;
  localPreview: string | null;
}

const emptyImage: ImageState = {
  url: null,
  pendingFile: null,
  pendingRemove: false,
  localPreview: null,
};

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
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
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

  /* ── opening hours helpers ───────────────────────── */
  const updateDay = (day: Day, patch: Partial<OpeningHoursEntry>) => {
    setOpeningHours({ ...openingHours, [day]: { ...openingHours[day], ...patch } });
  };
  const setAllDays = (entry: OpeningHoursEntry) => {
    const updated = {} as OpeningHours;
    DAYS_ORDER.forEach((d) => {
      updated[d] = { ...entry };
    });
    setOpeningHours(updated);
  };
  const firstOpenDay = DAYS_ORDER.find((d) => !openingHours[d]?.closed);

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

        await queryClient.invalidateQueries({ queryKey: ['my-businesses'] });
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

      await queryClient.invalidateQueries({ queryKey: ['my-businesses'] });
      await queryClient.invalidateQueries({ queryKey: ['business-profile'] });

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
          {/* ── Section 1: Identity ─────────────────────── */}
          <div className="px-4 mb-2">
            <SectionEyebrow label="IDENTITY" color="amber" />
          </div>
          <div className="space-y-4 px-4 pb-4">
            {/* Category */}
            <SectionCard>
              <div className="space-y-1.5">
                <label className={LABEL_CLASS}>
                  Category {mode === 'create' && <span className="text-destructive">*</span>}
                </label>
                {mode === 'edit' ? (
                  <>
                    <div className={LOCKED_CLASS} style={LOCKED_STYLE}>
                      <Lock className="w-4 h-4 flex-shrink-0" />
                      {category || 'Not set'}
                    </div>
                    <p className={HINT_CLASS}>Category cannot be changed after creation.</p>
                  </>
                ) : (
                  <>
                    <select
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        setBusinessName('');
                        setSelectedClub(null);
                        setSelectedCollege(null);
                      }}
                      className={`${INPUT_CLASS} appearance-none cursor-pointer`}
                      style={{
                        ...INPUT_STYLE,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 16px center',
                      }}
                    >
                      <option value="">Select a category</option>
                      {BUSINESS_CATEGORIES_WITH_ICONS.map(({ value, label, subtitle }) => (
                        <option key={value} value={value}>
                          {label}
                          {subtitle ? ` — ${subtitle}` : ''}
                        </option>
                      ))}
                    </select>
                    <p className={HINT_CLASS}>Category cannot be changed after creation.</p>
                  </>
                )}
              </div>
            </SectionCard>

            {/* Already-claimed warning */}
            {mode === 'create' && existingBusinessForClub && (
              <SectionCard className="border-destructive/30 bg-destructive/5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-foreground">
                      This club already has a business profile
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      "{existingBusinessForClub.name}" is managed by someone else.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowRequestAccessModal(true)}
                      className="text-[13px] font-semibold mt-2"
                      style={{ color: BIZ.amber }}
                    >
                      Request access to manage this profile
                    </button>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Name / search */}
            <SectionCard>
              <div className="space-y-1.5">
                <label className={LABEL_CLASS}>
                  Business Name <span className="text-destructive">*</span>
                </label>
                {isGolfClub && (mode === 'create' || !isClubLinked) ? (
                  <>
                    <ClubSearchDropdown
                      value={selectedClub}
                      onChange={setSelectedClub}
                      placeholder="Search for your golf club..."
                      disabled={!category}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRequestClubModal(true)}
                      className="text-[12px] font-medium mt-1"
                      style={{ color: BIZ.amber }}
                    >
                      Can't find your course? Request we add it
                    </button>
                  </>
                ) : isClubLinked ? (
                  <>
                    <div className={LOCKED_CLASS} style={LOCKED_STYLE}>
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      {businessName}
                    </div>
                    <p className={HINT_CLASS}>
                      Linked to a club record. Contact support to update.
                    </p>
                  </>
                ) : isUniversity ? (
                  <CollegeSearchDropdown
                    value={selectedCollege}
                    onChange={setSelectedCollege}
                    placeholder="Search for your college or university..."
                    disabled={!category}
                  />
                ) : (
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={
                      mode === 'create' && !category
                        ? 'Select a category first'
                        : 'e.g., Royal Golf Club'
                    }
                    disabled={mode === 'create' && !category}
                    className={`${INPUT_CLASS} disabled:opacity-50`}
                    style={INPUT_STYLE}
                  />
                )}
                <p className={HINT_CLASS}>Shown publicly on your profile and in search.</p>
              </div>
            </SectionCard>

            {/* About */}
            <SectionCard>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={LABEL_CLASS}>About</label>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {description.length}/2500
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 2500))}
                  placeholder="Tell golfers about your business…"
                  rows={5}
                  className={`${INPUT_CLASS} resize-none`}
                  style={INPUT_STYLE}
                />
                <p className={HINT_CLASS}>
                  Mention facilities, coaching style, atmosphere, events, or what makes you different.
                </p>
              </div>
            </SectionCard>

            {/* Founded year */}
            <SectionCard>
              <div className="space-y-1.5">
                <label className={LABEL_CLASS}>Year Established</label>
                <input
                  type="number"
                  value={foundedYear}
                  onChange={(e) => setFoundedYear(e.target.value)}
                  placeholder="e.g., 1985"
                  min={1800}
                  max={new Date().getFullYear()}
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                />
                <p className={HINT_CLASS}>Shown on your About tab.</p>
              </div>
            </SectionCard>
          </div>

          {/* ── Section 2: Location & contact ───────────── */}
          <div className="px-4 mt-2 mb-2">
            <SectionEyebrow label="LOCATION & CONTACT" />
          </div>
          <div className="space-y-4 px-4 pb-4">
            <SectionCard>
              <div className="space-y-3">
                {isClubLinked ? (
                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Location</label>
                    <div className={LOCKED_CLASS} style={LOCKED_STYLE}>
                      <Lock className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 truncate">
                        {address?.label || business?.location || 'Location unavailable'}
                      </span>
                      <span className="text-[11px] text-muted-foreground/70">From club data</span>
                    </div>
                    <p className={HINT_CLASS}>
                      Contact support to update the location for this linked club.
                    </p>
                  </div>
                ) : isGolfClub && mode === 'create' && selectedClub ? (
                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Location</label>
                    <div className={LOCKED_CLASS} style={LOCKED_STYLE}>
                      <Lock className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 truncate">{address?.label || 'From club data'}</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className={LABEL_CLASS}>Country</label>
                      <CountrySelector
                        value={countrySelection}
                        onChange={(name) => {
                          setCountrySelection(name);
                          if (address) setAddress(null);
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={LABEL_CLASS}>Business address</label>
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
                    {address?.lat != null &&
                    address?.lng != null &&
                    Number.isFinite(address.lat) &&
                    Number.isFinite(address.lng) ? (
                      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${BIZ.hair}` }}>
                        <MapPreview
                          lat={address.lat}
                          lng={address.lng}
                          name={resolvedName || 'Business location'}
                          height={160}
                          zoom={14}
                          markerColor={BIZ.amber}
                          showExpandButton={false}
                        />
                        <div
                          className="px-3 py-2.5 flex items-center justify-between"
                          style={{ background: '#ffffff', borderTop: `0.5px solid ${BIZ.hair}` }}
                        >
                          <div className="flex items-center gap-2 text-[13px] min-w-0">
                            <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: BIZ.amber }} />
                            <span className="truncate text-foreground">
                              {address.city && address.country
                                ? `${address.city}, ${address.country}`
                                : address.label}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowPinDropModal(true)}
                            className="text-[13px] font-medium flex-shrink-0 ml-2"
                            style={{ color: BIZ.amber }}
                          >
                            Adjust pin
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </SectionCard>

            {/* Contact */}
            <SectionCard>
              <div className="space-y-3">
                <p className="text-[14px] font-semibold text-foreground">Contact Details</p>
                <div className="space-y-1.5">
                  <label className={LABEL_CLASS}>Phone</label>
                  <PhoneInputWithDialCode value={phone} onChange={setPhone} />
                </div>
                <div style={{ height: '0.5px', background: BIZ.hair, margin: '12px 0' }} />
                <div className="space-y-1.5">
                  <label className={LABEL_CLASS}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@business.com"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>
                <div style={{ height: '0.5px', background: BIZ.hair, margin: '12px 0' }} />
                <div className="space-y-1.5">
                  <label className={LABEL_CLASS}>Website</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>
                <div style={{ height: '0.5px', background: BIZ.hair, margin: '12px 0' }} />
                <div className="space-y-1.5">
                  <label className={LABEL_CLASS}>Booking link</label>
                  <input
                    type="url"
                    value={bookingUrl}
                    onChange={(e) => setBookingUrl(e.target.value)}
                    placeholder="https://bookings.yourgolfclub.com"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                  <p className={HINT_CLASS}>
                    If you use an online tee sheet, paste the booking URL here.
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* Opening hours */}
            <SectionCard>
              <div className="space-y-3">
                <div>
                  <p className="text-[14px] font-semibold text-foreground">Opening Hours</p>
                  <p className={HINT_CLASS} style={{ marginTop: 2 }}>
                    Displayed on your profile so golfers know when to visit.
                  </p>
                </div>
                <div className="space-y-1">
                  {DAYS_ORDER.map((day) => {
                    const entry =
                      openingHours[day] ?? { open: '08:00', close: '18:00', closed: false };
                    return (
                      <div key={day} className="flex items-center gap-2 min-h-[44px]">
                        <span className="w-10 text-[13px] font-medium text-foreground flex-shrink-0">
                          {day}
                        </span>
                        {entry.closed ? (
                          <span className="flex-1 text-[13px] text-muted-foreground">Closed</span>
                        ) : (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="time"
                              value={entry.open}
                              onChange={(e) => updateDay(day, { open: e.target.value })}
                              className="flex-1 h-9 rounded-lg px-2 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-[#F7931E]/40"
                              style={{ background: 'rgba(15,23,42,0.03)', border: `0.5px solid ${BIZ.hair}` }}
                            />
                            <span className="text-muted-foreground text-xs">–</span>
                            <input
                              type="time"
                              value={entry.close}
                              onChange={(e) => updateDay(day, { close: e.target.value })}
                              className="flex-1 h-9 rounded-lg px-2 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-[#F7931E]/40"
                              style={{ background: 'rgba(15,23,42,0.03)', border: `0.5px solid ${BIZ.hair}` }}
                            />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => updateDay(day, { closed: !entry.closed })}
                          className="text-[12px] font-semibold flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-end"
                          style={{ color: entry.closed ? BIZ.amber : '#94A3B8' }}
                        >
                          {entry.closed ? 'Open' : 'Close'}
                        </button>
                      </div>
                    );
                  })}
                </div>
                {firstOpenDay && (
                  <button
                    type="button"
                    onClick={() => setAllDays(openingHours[firstOpenDay])}
                    className="text-[13px] font-semibold"
                    style={{ color: BIZ.amber }}
                  >
                    + Apply first day to all days
                  </button>
                )}
              </div>
            </SectionCard>
          </div>

          {/* ── Section 3: Branding ──────────────────── */}
          <div className="px-4 mt-2 mb-2">
            <SectionEyebrow label="BRANDING" />
          </div>
          <div className="space-y-4 px-4 pb-4">
            <SectionCard>
              <div className="space-y-3">
                <label className={LABEL_CLASS}>Logo</label>
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <SquircleAvatar
                      key={effectiveLogoUrl || 'empty'}
                      src={effectiveLogoUrl || undefined}
                      fallback={resolvedName?.[0] || 'B'}
                      size={96}
                    />
                    <label
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full text-white flex items-center justify-center cursor-pointer shadow-sm"
                      style={{ backgroundColor: BIZ.amber }}
                    >
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) onLogoFile(f);
                          if (logoInputRef.current) logoInputRef.current.value = '';
                        }}
                        className="hidden"
                      />
                      <Plus className="w-4 h-4" />
                    </label>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground">
                      {effectiveLogoUrl ? 'Change Logo' : 'Upload Logo'}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                      Square image recommended. PNG or JPG.
                    </p>
                    {effectiveLogoUrl && (
                      <button
                        type="button"
                        onClick={onLogoRemove}
                        className="text-[12px] font-medium text-destructive mt-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard>
              <div className="space-y-3">
                <label className={LABEL_CLASS}>Cover Photo</label>
                <label className="block cursor-pointer">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onCoverFile(f);
                      if (coverInputRef.current) coverInputRef.current.value = '';
                    }}
                    className="hidden"
                  />
                  {effectiveCoverUrl ? (
                    <div className="relative aspect-[3.2/1] rounded-xl overflow-hidden group">
                      <img
                        src={effectiveCoverUrl}
                        alt="Cover preview"
                        className="w-full h-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="w-6 h-6 text-background" />
                      </div>
                    </div>
                  ) : (
                    <div
                      className="aspect-[3.2/1] rounded-xl border-2 border-dashed flex flex-col items-center justify-center"
                      style={{ borderColor: BIZ.hairDashed, background: 'rgba(15,23,42,0.03)' }}
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                        style={{ background: 'rgba(15,23,42,0.05)', border: `1px solid ${BIZ.hair}` }}
                      >
                        <Camera className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <p className="text-[13px] font-medium text-foreground">Upload cover photo</p>
                      <p className="text-[12px] text-muted-foreground">
                        Recommended: 1600×500px • JPG, PNG, WebP
                      </p>
                    </div>
                  )}
                </label>
                {effectiveCoverUrl && (
                  <button
                    type="button"
                    onClick={onCoverRemove}
                    className="text-[12px] font-medium text-destructive"
                  >
                    Remove
                  </button>
                )}
              </div>
            </SectionCard>
          </div>

          {/* ── Section 4: Social ────────────────────── */}
          <div className="px-4 mt-2 mb-2">
            <SectionEyebrow label="SOCIAL" />
          </div>
          <div className="space-y-4 px-4 pb-4">
            <SectionCard>
              <div className="space-y-3">
                <p className={HINT_CLASS} style={{ marginTop: 0 }}>
                  Link your social media so golfers can follow you off the course.
                </p>
                {SOCIAL_PLATFORMS.map(({ field, label, placeholder, icon }) => (
                  <div key={field} className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 text-lg"
                      style={{ background: 'rgba(15,23,42,0.04)', border: `1px solid ${BIZ.hair}` }}
                    >
                      {icon}
                    </div>
                    <input
                      type="text"
                      value={social[field as keyof SocialFields]}
                      onChange={(e) => setSocial({ ...social, [field]: e.target.value })}
                      placeholder={placeholder}
                      aria-label={label}
                      className="flex-1 h-10 rounded-[10px] px-3 text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F7931E]/40"
                      style={{ background: '#ffffff', border: `1px solid ${BIZ.hair}` }}
                    />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
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
