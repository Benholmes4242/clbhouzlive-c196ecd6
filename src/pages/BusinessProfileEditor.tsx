import { useTranslation } from 'react-i18next';
/**
 * BusinessProfileEditor — unified create + edit surface for business profiles.
 *
 * Replaces the legacy 3-step wizards (BusinessProfileWizard, BusinessEditWizard)
 * with a single-page editor modelled on the personal EditProfile pattern:
 * sticky save header + stacked SectionCards. Mode is driven by the route:
 *   /business/create         → create mode (no :id)
 *   /business/:id/edit       → edit mode  (loads existing)
 */
import { fetchGolfClub, clubRowToSelected } from '@/features/business/claimClub';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { ManagePageSkeleton } from '@/components/skeletons/ManagePageSkeleton';
import { toast } from '@/lib/toast';

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
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';


import { BIZ } from '@/components/business/businessTokens';
import { SelectedClub } from '@/components/business/ClubSearchDropdown';
import { SelectedCollege } from '@/components/business/CollegeSearchDropdown';
import { dbLocationPrecision, AddressValue } from '@/components/business/AddressAutocomplete';
import { PinDropModal } from '@/components/business/PinDropModal';
import { PhoneValue } from '@/components/business/PhoneInputWithDialCode';
import { HeaderPhotoCard } from '@/components/profile/edit-v2/HeaderPhotoCard';
import { BUSINESS_COVER_ASPECT, BUSINESS_COVER_ASPECT_CSS } from '@/lib/tokens/coverAspect';
import { CoverGuidance } from '@/components/profile/edit-v2/CoverGuidance';
import { ProfilePhotoCard } from '@/components/profile/edit-v2/ProfilePhotoCard';
import { RequestAccessModal } from '@/components/business/RequestAccessModal';
import { RequestClubModal } from '@/components/business/RequestClubModal';
import { getCountryCodeFromClub } from '@/utils/countryCodeMapping';

import { IdentitySection } from '@/components/business/editor/IdentitySection';
import { LocationContactSection } from '@/components/business/editor/LocationContactSection';
import { BusinessEditWhereContact, type ContactSave, type ContactSheet } from '@/components/business/editor/BusinessEditWhereContact';
import { addressPayload, savedPhone } from '@/components/business/editor/businessContactRules';

import { FacilitiesSection } from '@/components/business/editor/FacilitiesSection';
import { PrimaryActionSection } from '@/components/business/editor/PrimaryActionSection';
import { OpeningHoursSection } from '@/components/business/editor/OpeningHoursSection';
import { SocialSection } from '@/components/business/editor/SocialSection';
import { BusinessEditFrame } from '@/components/business/editor/BusinessEditFrame';
import { Button } from '@/components/ui/button';
import { BusinessEditPreview, type BusinessIdentityField, type BusinessPhotoKind } from '@/components/business/editor/BusinessEditPreview';
import { BusinessEditProfileLinks, type ProfileLinkSave, type ProfileLinkSheet } from '@/components/business/editor/BusinessEditProfileLinks';
import type { BusinessCompletionKey } from '@/components/business/editor/businessCompletion';
import { BusinessEditSettings } from '@/components/business/editor/BusinessEditSettings';
import { canEditBusinessProfile, protectBusinessPayload } from '@/components/business/editor/editorPermissions';
import {
  DEFAULT_OPENING_HOURS,
  OpeningHours,
  SocialFields,
  ImageState,
  emptyImage,
  PrimaryActionKey,
} from '@/components/business/editor/editorTypes';

import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';

import type { Json } from '@/integrations/supabase/types';
import { Check } from 'lucide-react';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { FIELD_LABEL, FIELD_INPUT_CLASS, FIELD_INPUT_STYLE, FIELD_PLACEHOLDER_CLASS } from '@/components/manage/fieldTreatment';

import { createBusiness } from '@/features/business-create/createBusiness';
import { BusinessOwnerlessNotice } from '@/features/business-create/BusinessCreationNotices';
import { SaveStepError, pgFields, errorText, SESSION_ENDED_MSG, isAuthError, logSaveFailure } from '@/features/business-create/creationErrors';
/** Mirrors public.normalize_club_key(): lower(trim(name)) with non [a-z0-9] removed. */
function normalizeClubKey(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}


/* ─────────────────────── constants ─────────────────────── */



type Mode = 'create' | 'edit';


/* ─────────────────────── component ─────────────────────── */

export default function BusinessProfileEditor() {
  const { t } = useTranslation('profile');
  const { id } = useParams<{ id: string }>();
  const mode: Mode = id ? 'edit' : 'create';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'settings' ? 'settings' : 'profile';
  const onTab = (value: 'profile' | 'settings') => {
    const next = new URLSearchParams(searchParams);
    if (value === 'profile') next.delete('tab'); else next.set('tab', value);
    setSearchParams(next, { replace: true });
  };
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useSupabaseSession();

  useHideBottomNav();

  /* ── edit-mode data load ────────────────────────────── */
  const { data: business, isLoading: businessLoading, error: businessError, refetch: refetchBusiness } =
    useBusinessProfile(mode === 'edit' ? id : undefined);
  const { data: membership, isLoading: membershipLoading } = useBusinessMembership(
    mode === 'edit' ? id : undefined
  );
  // CB78: editors may edit the profile. The live guard_business_protected_fields
  // trigger refuses name/slug/category/club/notification_preferences for anyone
  // but owners and admins, so editors see those read-only and never send them.
  const isEditor = mode === 'edit' && membership?.role === 'editor';
  const canEditProfile = canEditBusinessProfile(membership?.role);
  const canEdit = mode === 'create' || canEditProfile;

  /* ── identity ─────────────────────────────────────── */
  const [category, setCategory] = useState(
    searchParams.get('category') === 'golf_club' ? 'Golf Club' : ''
  );
  const [selectedClub, setSelectedClub] = useState<SelectedClub | null>(null);
  const [selectedCollege, setSelectedCollege] = useState<SelectedCollege | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [foundedYear, setFoundedYear] = useState('');
  /** Optional proof note included with a course-claim request (create-mode, golf-club only). */
  const [claimProofNote, setClaimProofNote] = useState('');

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
  const [contactRequest, setContactRequest] = useState<{ kind: ContactSheet; serial: number } | null>(null);

  /* ── branding ─────────────────────────────────────── */
  const [logo, setLogo] = useState<ImageState>(emptyImage);
  const [cover, setCover] = useState<ImageState>(emptyImage);

  /* ── social ───────────────────────────────────────── */
  const [social, setSocial] = useState<SocialFields>({
    instagram: '',
    tiktok: '',
    twitter: '',
    facebook: '',
    youtube: '',
  });

  /* ── new: facilities, primary action, opening-hours toggle ── */
  const [amenities, setAmenities] = useState<string[]>([]);
  const [primaryAction, setPrimaryAction] = useState<PrimaryActionKey | null>(null);
  const [showOpeningHours, setShowOpeningHours] = useState(false);

  /* ── flow state ───────────────────────────────────── */
  const [saving, setSaving] = useState(false);
  const [partialStatus, setPartialStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const partialRetry = useRef<(() => Promise<boolean>) | null>(null);
  const partialBusy = useRef(false);
  const [profileRequest, setProfileRequest] = useState<{ kind: ProfileLinkSheet; serial: number } | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  /* Ownerless-business notice: must be acknowledged, never times out. The
   * business id is the only way support can recover it. */
  const [ownerlessNotice, setOwnerlessNotice] = useState<{ name: string; id: string; target: string } | null>(null);
  const [existingBusinessForClub, setExistingBusinessForClub] = useState<
    { id: string; name: string } | null
  >(null);
  const [clubClaimPending, setClubClaimPending] = useState(false);
  const [showRequestAccessModal, setShowRequestAccessModal] = useState(false);
  const [showRequestClubModal, setShowRequestClubModal] = useState(false);
  const [clubSearchQuery] = useState('');

  /* ── prefilled club from URL params (Claim this course) ── */
  const prefilledClubId = searchParams.get('clubId');
  // The name and geography are READ from golf_clubs by id — never carried in
  // the URL (a course name once travelled there and became the business name).
  useEffect(() => {
    if (mode !== 'create' || !prefilledClubId || selectedClub) return;
    let cancelled = false;
    fetchGolfClub(prefilledClubId)
      .then((row) => { if (!cancelled && row) setSelectedClub(clubRowToSelected(row)); })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledClubId, mode]);

  /* ── auth gate ────────────────────────────────────── */
  const sessionSeenRef = useRef(false);
  useEffect(() => {
    // eslint-disable-next-line settled/no-not-loading-empty-check -- authLoading is the session flag, not a React Query.
    if (!authLoading && !user) {
      // Session ended while the editor was open: say so before the redirect
      // takes the member away, so the lost form is never a silent mystery.
      if (sessionSeenRef.current) {
        logSaveFailure('session ended (redirect)', new Error('no signed-in user'), { category, mode });
        toast.error(SESSION_ENDED_MSG);
      }
      navigate('/auth');
    } else if (user) {
      sessionSeenRef.current = true;
    }
  }, [authLoading, user, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── permission gate (edit) ───────────────────────── */
  useEffect(() => {
    // eslint-disable-next-line settled/no-not-loading-empty-check -- the branch requires membership to be present before reading its role.
    if (mode === 'edit' && !membershipLoading && membership && !canEditBusinessProfile(membership.role)) {
      toast.error("You don't have permission to edit this business");
      navigate(`/business/${id}`);
    }
  }, [mode, membershipLoading, membership, id, navigate]);

  /* ── populate from existing business ──────────────── */
  const populated = useRef(false);
  useEffect(() => {
    if (mode !== 'edit' || !business || populated.current) return;

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
        lat: business.lat ?? undefined,
        lng: business.lng ?? undefined,
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
      setPhone(savedPhone(business.phone, business.country || null));
    }

    setShowOpeningHours(!!business.show_opening_hours);
    setOpeningHours(business.opening_hours ? { ...business.opening_hours } : { ...DEFAULT_OPENING_HOURS });

    setAmenities(Array.isArray(business.amenities) ? business.amenities : []);
    setPrimaryAction((business.primary_action as PrimaryActionKey | null) || null);

    const sl = business.social_links || {};
    setSocial({
      instagram: sl.instagram || '',
      tiktok:    sl.tiktok    || '',
      twitter:   sl.twitter   || '',
      facebook:  sl.facebook  || '',
      youtube:   sl.youtube   || '',
    });

    setLogo({ ...emptyImage, url: business.logo_url || null });
    setCover({ ...emptyImage, url: business.cover_image_url || null });

    populated.current = true;
  }, [mode, business]);

  /* ── club-linked & duplicate-check ────────────────── */
  const isClubLinked = mode === 'edit' ? !!business?.club_id : false;
  const isGolfClub = category === 'Golf Club';
  const isUniversity = category === 'University / College';

  /* COLLEGE guard — EXCLUDES deleted businesses, on purpose. There is no
   * unique index on this path at all, so this is a courtesy check only and a
   * deleted business is not a real obstacle. (The club guard below differs
   * deliberately.) It matches on NAME because business_accounts has no column
   * for the college id; create writes selectedCollege.college_name verbatim,
   * so it only catches businesses created through the college picker. */
  useEffect(() => {
    if (mode !== 'create' || category !== 'University / College' || !selectedCollege) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('business_accounts')
        .select('id, name')
        .eq('category', 'University / College')
        .eq('name', selectedCollege.college_name)
        .eq('is_deleted', false)
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (error) AppLog.error('BusinessProfileEditor', 'college dup check failed', pgFields(error));
      setExistingBusinessForClub(data ?? null);
    })();
    return () => { cancelled = true; };
  }, [mode, category, selectedCollege?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (category === 'University / College') {
      if (!selectedCollege) setExistingBusinessForClub(null);
      return;
    }
    if (mode !== 'create' || !selectedClub?.id) {
      setExistingBusinessForClub(null);
      setClubClaimPending(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        // CLUB guard — INCLUDES deleted businesses, on purpose (unlike the
        // college guard above): ux_business_accounts_club_key is not filtered
        // on is_deleted, so a deleted row still collides at the database level
        // and the insert really would fail.
        // club_id is never written at create (granted on claim approval), so
        // the guard reads what ux_business_accounts_club_key actually protects:
        // club_key, derived by trg_business_set_club_key from club_name via
        // normalize_club_key(). The index is not filtered on is_deleted, so a
        // deleted row still collides and is matched here too.
        const { data } = await supabase
          .from('business_accounts')
          .select('id, name')
          .eq('club_key', normalizeClubKey(selectedClub.name))
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        setExistingBusinessForClub(data);

        // Also detect an in-flight claim on this club (no owner yet, but
        // someone has filed and it's pending admin review).
        if (!data) {
          const { data: pendingClaim } = await supabase
            .from('course_claim_requests')
            .select('id')
            .eq('club_id', selectedClub.id)
            .in('status', ['pending', 'needs_more_info'])
            .limit(1)
            .maybeSingle();
          if (cancelled) return;
          setClubClaimPending(!!pendingClaim);
        } else {
          setClubClaimPending(false);
        }

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
            lat: selectedClub.latitude ?? undefined,
            lng: selectedClub.longitude ?? undefined,
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
      if (isGolfClub) return !!selectedClub && !existingBusinessForClub && !clubClaimPending;
      if (isUniversity) return !!selectedCollege && !existingBusinessForClub;
      return resolvedName.length > 0;
    }
    // edit: always require a name (club-linked is always set)
    return resolvedName.length > 0 || isClubLinked;
  }, [mode, category, isGolfClub, isUniversity, selectedClub, selectedCollege, existingBusinessForClub, clubClaimPending, resolvedName, isClubLinked]);

  // Only the retained create branch has deferred fields and a departure guard.
  const isDirty = mode === 'create' && !!(category || businessName || selectedClub || selectedCollege || description);

  /* ── image handlers ──────────────────────────────── */
  const onLogoFile = (file: File) => {
    if (logo.localPreview) URL.revokeObjectURL(logo.localPreview);
    setLogo({
      ...logo,
      pendingFile: file,
      pendingRemove: false,
      localPreview: URL.createObjectURL(file),
    });
  };
  const onLogoRemove = () => {
    if (logo.localPreview) URL.revokeObjectURL(logo.localPreview);
    setLogo({ ...logo, pendingFile: null, pendingRemove: true, localPreview: null });
  };
  const onCoverFile = (file: File) => {
    if (cover.localPreview) URL.revokeObjectURL(cover.localPreview);
    setCover({
      ...cover,
      pendingFile: file,
      pendingRemove: false,
      localPreview: URL.createObjectURL(file),
    });
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
    else if (exitTo === -1) navigate(-1);
    else navigate(exitTo as string);
  };
  const confirmClose = () => {
    setShowCloseConfirm(false);
    if (logo.localPreview) URL.revokeObjectURL(logo.localPreview);
    if (cover.localPreview) URL.revokeObjectURL(cover.localPreview);
    if (exitTo === -1) navigate(-1);
    else navigate(exitTo as string);
  };

  /* ── save: edit mode uses this hook (needs id) ───── */
  const { uploadLogo, removeLogo, uploadCover, removeCover } = useBusinessImageUpload(
    mode === 'edit' ? id : undefined, mode === 'edit' ? { role: membership?.role } : undefined
  );

  const invalidateBusiness = () => queryClient.invalidateQueries({ predicate: query => {
    const key = query.queryKey[0];
    return typeof key === 'string' && (key === 'my-businesses' || key === 'business-profile' || key === 'business-directory' || key === 'suggestedBusinesses' || key.startsWith('business-'));
  } });
  const runPartial = async (operation: () => Promise<void>): Promise<boolean> => {
    if (partialBusy.current || !id || !user?.id || !canEditProfile) return false;
    partialBusy.current = true; setPartialStatus('saving');
    partialRetry.current = () => runPartial(operation);
    try { await operation(); await invalidateBusiness(); setPartialStatus('saved'); partialRetry.current = null; return true; }
    catch { setPartialStatus('error'); return false; }
    finally { partialBusy.current = false; }
  };
  const saveIdentity = (key: BusinessIdentityField, value: string | number | null) => runPartial(async () => {
    if (key === 'name' && (isClubLinked || isEditor)) throw new Error('Name is read-only');
    const { error } = await supabase.from('business_accounts').update(protectBusinessPayload({ [key]: value }, membership?.role)).eq('id', id ?? '');
    if (error) throw error;
    if (key === 'name') setBusinessName(String(value ?? ''));
    else if (key === 'description') setDescription(String(value ?? ''));
    else setFoundedYear(value == null ? '' : String(value));
  });
  const savePhoto = (kind: BusinessPhotoKind, file: File | null) => runPartial(async () => {
    let url: string | null = null;
    if (file) {
      const result = await (kind === 'logo' ? uploadLogo(file) : uploadCover(file));
      if (!result) throw new Error('Photo did not save');
      url = result;
    } else await (kind === 'logo' ? removeLogo() : removeCover());
    (kind === 'logo' ? setLogo : setCover)({ ...emptyImage, url });
  });
  // Edit sheets write only their own fields; no deferred edit baseline.
  const saveContact = (save: ContactSave) => runPartial(async () => {
    if (save.kind === 'address' && isClubLinked) throw new Error('Address is read-only');
    const payload = save.kind === 'address' ? addressPayload(save.value)
      : save.kind === 'phone' ? { phone: save.value?.fullNumber || null }
      : { [save.kind]: save.value || null };
    const { error } = await supabase.from('business_accounts').update(protectBusinessPayload(payload, membership?.role)).eq('id', id ?? '');
    if (error) throw error;
    if (save.kind === 'address') { setAddress(save.value); setCountrySelection(save.value?.country || countrySelection); }
    else if (save.kind === 'phone') setPhone(save.value);
    else if (save.kind === 'email') setEmail(save.value);
    else setWebsite(save.value);
  });
  const openCompletionSheet = (key: BusinessCompletionKey) => {
    if (key === 'address' || key === 'phone' || key === 'website') {
      setContactRequest(previous => ({ kind: key, serial: (previous?.serial ?? 0) + 1 }));
    } else if (key === 'hours') setProfileRequest(previous => ({ kind: 'hours', serial: (previous?.serial ?? 0) + 1 }));
  };
  const saveProfileLink = (save: ProfileLinkSave) => runPartial(async () => {
    const links = save.kind === 'socials' ? Object.fromEntries(Object.entries(save.value).map(([key, value]) => [key, value || null])) : null;
    const payload = save.kind === 'main' ? { primary_action: save.value }
      : save.kind === 'hours' ? { show_opening_hours: save.shown, opening_hours: save.value }
      : save.kind === 'facilities' ? { amenities: save.value }
      : { social_links: links && Object.values(links).some(Boolean) ? links : null };
    const { error } = await supabase.from('business_accounts').update(protectBusinessPayload(payload, membership?.role)).eq('id', id ?? '');
    if (error) throw error;
    if (save.kind === 'main') setPrimaryAction(save.value);
    else if (save.kind === 'hours') { setOpeningHours(save.value); setShowOpeningHours(save.shown); }
    else if (save.kind === 'facilities') setAmenities(save.value);
    else setSocial(save.value);
  });

  const handleSave = useCallback(async () => {
    if (!user?.id) {
      // Never a silent no-op: the form is kept, the member is told why.
      logSaveFailure('session ended (no user at submit)', new Error('no signed-in user'), { category, mode });
      toast.error(SESSION_ENDED_MSG);
      return;
    }
    if (!isValid) return;
    setSaving(true);
    try {
      if (mode === 'create') {
        const result = await createBusiness({ category, selectedClub, selectedCollege, businessName, description, foundedYear, claimProofNote, address, countrySelection, phone, email, website, bookingUrl, openingHours, showOpeningHours, logo, cover, social, amenities, primaryAction }, { userId: user.id, sourceCourseId: searchParams.get('sourceCourseId'), queryClient });
        if (result.ownerless) { setOwnerlessNotice(result.ownerless); return; }
        const { partials, claimError } = result;
        const claimFiled = result.claim === 'filed';
        if (partials.length) {
          toast.warning(`Your ${partials.join(' and ')} didn't save. You can add ${partials.length > 1 ? 'them' : 'it'} in Edit.`);
        }
        if (claimError) {
          toast.error(`Business created, but the club claim didn't save: ${claimError}. You can file it again from Edit.`);
        } else {
          toast.success(
            claimFiled
              ? 'Business created — your club claim has been submitted for review.'
              : 'Business created',
          );
        }
        navigate(`/business/${result.slug || result.id}`);
        return;
      }

    } catch (e) {
      const step = e instanceof SaveStepError ? e.step : mode === 'create' ? 'create' : 'edit';
      const cause = e instanceof SaveStepError ? e.cause : e;
      logSaveFailure(step, cause, { category, mode });
      const text = errorText(cause);
      if (isAuthError(cause)) {
        toast.error(`${SESSION_ENDED_MSG} (${text})`);
        return;
      }
      const lead = mode === 'create' ? "Couldn't create the business" : "Couldn't save your changes";
      toast.error(text ? `${lead}: ${text}` : lead);
    } finally {
      setSaving(false);
    }
  }, [
    mode, user?.id, id, isValid, resolvedName, category, description, foundedYear, website, email,
    phone, bookingUrl, openingHours, social, address, businessName, isClubLinked, isGolfClub,
    selectedClub, claimProofNote, logo, cover, queryClient, navigate, uploadLogo, removeLogo, uploadCover, removeCover,
    amenities, primaryAction, showOpeningHours, isEditor, membership?.role,
  ]);

  /* ── loading / error states (edit) ──────────────── */
  if (authLoading || (mode === 'edit' && (businessLoading || membershipLoading))) {
    return <ManagePageSkeleton />;
  }
  if (mode === 'edit' && (businessError || !business)) {
    // Sentinel from useBusinessProfile — keep in sync.
    const isNotFound =
      (businessError instanceof Error && businessError.message === 'Business not found') ||
      (!businessError && !business);
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: BIZ.pageBg }}>
        <div className="max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-[16px] font-bold text-foreground mb-2">
            {isNotFound ? 'Business not found' : "Couldn't load this business"}
          </h1>
          <p className="text-[13px] text-muted-foreground mb-6">
            {isNotFound ? 'This business may have been removed.' : 'Check your connection and try again.'}
          </p>
          {!isNotFound && (
            <button
              onClick={() => refetchBusiness()}
              className="inline-flex items-center justify-center h-11 px-6 rounded-[10px] text-[14px] font-semibold mb-3"
              style={{ background: A.INK, color: A.CANVAS }}
            >
              Retry
            </button>
          )}
          <div>
            <button onClick={() => navigate(-1)} className="text-[14px] font-semibold" style={{ color: A.INK }}>
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (mode === 'edit' && !canEdit) return null;

  /* ── save button enabled ─────────────────────────── */
  const saveEnabled =
    isValid && !saving && partialStatus !== 'saving' && (mode === 'create' ? true : isDirty);

  /* ── render ──────────────────────────────────────── */
  return (
    <>
      <BusinessEditFrame
        editing={mode === 'edit'} tab={tab} onTab={onTab}
        onBack={handleClose}
        settings={mode === 'edit' && business ? <BusinessEditSettings business={business} role={membership?.role} userId={user?.id ?? ''} /> : null}
      >
        <div className="flex-1 overflow-y-auto" style={{ background: BIZ.pageBg }}>

          {mode === 'edit' ? <BusinessEditPreview name={businessName} category={category} city={business?.city || business?.location || ''} primaryAction={primaryAction} actionData={{ category, primary_action: primaryAction, booking_url: bookingUrl, phone: phone?.fullNumber, email, website, location: address?.label || business?.location, lat: address?.lat, lng: address?.lng }}
            completion={{ logo: logo.url, cover: cover.url, description, foundedYear, lat: address?.lat, lng: address?.lng, phone: phone?.fullNumber || '', website, showOpeningHours, openingHours }}
            clubLinked={isClubLinked} editor={isEditor} busy={partialStatus === 'saving'} onSave={saveIdentity} onPhoto={savePhoto} onFocusLegacy={openCompletionSheet} /> : <>
          {/* 1. HERO — cover + squircle logo at top (matches personal edit-v2) */}
          <div className="px-4 pt-2 pb-4">
            <div
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                background: BIZ.card,
                border: `1px solid ${BIZ.hair}`,
              }}
            >
              <HeaderPhotoCard
                aspectRatio={BUSINESS_COVER_ASPECT}
                aspectCss={BUSINESS_COVER_ASPECT_CSS}
                currentUrl={effectiveCoverUrl}
                onFileChange={(file) => { if (file) onCoverFile(file); }}
                onRemove={onCoverRemove}
              />
              <div style={{ position: 'relative', padding: '0 16px 12px', marginTop: -34 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
                  <div style={{ flexShrink: 0 }}>
                    <ProfilePhotoCard
                      variant="bare"
                      currentUrl={effectiveLogoUrl}
                      onFileChange={(file) => { if (file) onLogoFile(file); }}
                      onRemove={onLogoRemove}
                    />
                  </div>
                  <CoverGuidance text={t('profile:hero.coverGuidanceBusiness', 'Recommended: 1500x1500px, 1:1 - JPG, PNG or WebP')} />
                </div>
              </div>

            </div>
          </div>

          {/* 2. IDENTITY */}
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
            nameLocked={isEditor}
            existingSubject={isUniversity ? 'college' : 'club'}
            existingBusinessForClub={existingBusinessForClub}
            onRequestAccess={() => setShowRequestAccessModal(true)}
            onRequestClub={() => setShowRequestClubModal(true)}
            description={description}
            setDescription={setDescription}
            foundedYear={foundedYear}
            setFoundedYear={setFoundedYear}
          />

          </>}

          {/* Inline notice — a claim for this club is already under review. */}
          {mode === 'create' && isGolfClub && selectedClub && !existingBusinessForClub && clubClaimPending && (
            <div
              role="status"
              style={{
                margin: '8px 16px 16px',
                padding: '12px 14px',
                borderRadius: 10,
                background: BIZ.amberTint,
                border: `1px solid ${BIZ.amberHair}`,
                color: A.INK,
                fontSize: 13,
                lineHeight: 1.45,
              }}
            >
              <strong style={{ fontWeight: 700 }}>A claim for this club is already under review.</strong>{' '}
              You can't submit another claim right now. We'll let you know once it's been processed.
            </div>
          )}

          {mode === 'create' && isGolfClub && selectedClub && !existingBusinessForClub && !clubClaimPending && (
            <div style={{ padding: '0 16px', marginTop: 8, marginBottom: 16 }}>
              <label
                htmlFor="claim-proof-note"
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: BIZ.ink,
                  marginBottom: 6,
                }}
              >
                Tell us your connection to this club{' '}
                <span style={{ color: A.MUTE, fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                id="claim-proof-note"
                value={claimProofNote}
                onChange={(e) => setClaimProofNote(e.target.value.slice(0, 500))}
                placeholder="e.g. I'm the General Manager, work email on the club domain, happy to send a verification email."
                rows={3}
                maxLength={500}
                className={`${FIELD_INPUT_CLASS} ${FIELD_PLACEHOLDER_CLASS} rounded-[8px]`}
                style={{
                  ...FIELD_INPUT_STYLE,
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
              <p style={{ marginTop: 6, fontSize: 11, color: A.MUTE, lineHeight: 1.4 }}>
                Helps admins verify your claim faster. Your club link is pending until approval.
              </p>
            </div>
          )}

          {mode === 'edit' && <BusinessEditWhereContact address={address} country={countrySelection} phone={phone?.fullNumber || ''} email={email} website={website} clubLinked={isClubLinked} busy={partialStatus === 'saving'} requested={contactRequest} onSave={saveContact} />}

          {mode === 'edit' && <BusinessEditProfileLinks action={{ category, primary_action: primaryAction, booking_url: bookingUrl, website, phone: phone?.fullNumber, email, location: address?.label || business?.location, lat: address?.lat, lng: address?.lng }} street={address?.addressLine1} town={address?.city || business?.city || business?.location || ''} hours={openingHours} shown={showOpeningHours} amenities={amenities} social={social} busy={partialStatus === 'saving'} requested={profileRequest} onSave={saveProfileLink} />}

          {mode === 'create' && <>
          {/* 3. FACILITIES (category-aware) */}
          <FacilitiesSection
            category={category}
            amenities={amenities}
            setAmenities={setAmenities}
          />

          {/* 4. LOCATION & CONTACT */}
          {mode === 'create' && <div><LocationContactSection
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

          </div>}
          {/* 5. PRIMARY BUTTON */}
          <PrimaryActionSection value={primaryAction} onChange={setPrimaryAction} />

          

          {/* 7. OPENING HOURS with master toggle */}
          <div><OpeningHoursSection
            enabled={showOpeningHours}
            setEnabled={setShowOpeningHours}
            openingHours={openingHours}
            setOpeningHours={setOpeningHours}
          />

          </div>
          {/* 8. SOCIAL */}
          <SocialSection social={social} setSocial={setSocial} />





          {/*
            THE SAVE CONTROL SPLITS IN TWO, same as the personal editor: a
            completion state is not a control. Edit mode with nothing dirty
            renders a line, never a dead slab. What SAVES is unchanged.
          */}
          <div className="px-4 pt-6 pb-2">
              <button
                onClick={handleSave}
                disabled={!saveEnabled}
                className="w-full border-0 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 active:opacity-90 transition-opacity flex items-center justify-center"
                style={{
                  minHeight: 50,
                  borderRadius: 999,
                  fontSize: 14.5,
                  fontWeight: 700,
                  // Enabled = near-white fill with CANVAS-dark ink, the
                  // inverse of the disabled state. The label was left a literal
                  // when the fill was migrated, so enabled read white-on-white.
                  background: (saveEnabled || saving) ? A.INK : 'rgba(255,255,255,0.08)',
                  color: (saveEnabled || saving) ? A.CANVAS : 'rgba(248,250,252,0.38)',
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" /> Saving...
                  </>
                ) : (
                  'Create business'
                )}
              </button>
          </div>
          </>}
          {mode === 'edit' && <div className="be4-status"><Button type="button" variant="ghost" className="ep-saved be2-saved" data-state={partialStatus} aria-live="polite" onClick={() => { if (partialStatus === 'error') void partialRetry.current?.(); }}>{partialStatus === 'saving' ? 'Saving…' : partialStatus === 'error' ? "Couldn't save. Try again." : 'All changes saved'}</Button></div>}

        </div>
      </BusinessEditFrame>



      <BusinessOwnerlessNotice notice={ownerlessNotice} onDismiss={() => { const target = ownerlessNotice?.target; setOwnerlessNotice(null); if (target) navigate(target); }} />

      {/* Close confirm */}
      {mode === 'create' && <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
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
      </AlertDialog>}

      {/* Pin drop */}
      {mode === 'create' && <PinDropModal
        open={showPinDropModal}
        onOpenChange={setShowPinDropModal}
        onConfirm={(val) => {
          setAddress(val);
          setAddressError(null);
        }}
        initialCenter={address?.lat && address?.lng ? { lat: address.lat, lng: address.lng } : undefined}
      />}

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

    </>
  );
}

