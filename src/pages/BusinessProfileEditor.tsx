/** BusinessProfileEditor — edit-only /business/:id/edit surface.
 * Immediate field saves, preview and Settings retain their existing behavior;
 * canonical business creation is owned by the separate BusinessCreate flow. */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { ManagePageSkeleton } from '@/components/skeletons/ManagePageSkeleton';
import { toast } from '@/lib/toast';

import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessImageUpload } from '@/hooks/useBusinessImageUpload';
import { SESSION_ENDED_MSG, logSaveFailure } from '@/features/business-create/creationErrors';
import { A } from '@/features/courses/components/holes/analytical/tokens';

import { PageRoot } from '@/components/layout/PageRoot';


import { BIZ } from '@/components/business/businessTokens';
import { AddressValue } from '@/components/business/AddressAutocomplete';
import { PhoneValue } from '@/components/business/PhoneInputWithDialCode';
import { BusinessEditWhereContact, type ContactSave, type ContactSheet } from '@/components/business/editor/BusinessEditWhereContact';
import { addressPayload, savedPhone } from '@/components/business/editor/businessContactRules';

import { BusinessEditFrame } from '@/components/business/editor/BusinessEditFrame';
import { Button } from '@/components/ui/button';
import { BusinessEditPreview, type BusinessIdentityField, type BusinessPhotoKind } from '@/components/business/editor/BusinessEditPreview';
import { BusinessEditProfileLinks, type ProfileLinkSave, type ProfileLinkSheet } from '@/components/business/editor/BusinessEditProfileLinks';
import type { BusinessCompletionKey } from '@/components/business/editor/businessCompletion';
import { BusinessEditSettings } from '@/components/business/editor/BusinessEditSettings';
import { canEditBusinessProfile, protectBusinessPayload } from '@/components/business/editor/editorPermissions';
import type { Json } from '@/integrations/supabase/types';
import {
  DEFAULT_OPENING_HOURS,
  OpeningHours,
  SocialFields,
  ImageState,
  emptyImage,
  PrimaryActionKey,
} from '@/components/business/editor/editorTypes';

import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';


/* ─────────────────────── component ─────────────────────── */

export default function BusinessProfileEditor() {
  const { id } = useParams<{ id: string }>();
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

  /* ── edit data load ────────────────────────────── */
  const { data: business, isLoading: businessLoading, error: businessError, refetch: refetchBusiness } =
    useBusinessProfile(id);
  const { data: membership, isLoading: membershipLoading } = useBusinessMembership(
    id
  );
  // CB78: editors may edit the profile. The live guard_business_protected_fields
  // trigger refuses name/slug/category/club/notification_preferences for anyone
  // but owners and admins, so editors see those read-only and never send them.
  const isEditor = membership?.role === 'editor';
  const canEditProfile = canEditBusinessProfile(membership?.role);
  const canEdit = canEditProfile;

  /* ── identity ─────────────────────────────────────── */
  const [category, setCategory] = useState('');
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

  const [partialStatus, setPartialStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const partialRetry = useRef<(() => Promise<boolean>) | null>(null);
  const partialBusy = useRef(false);
  const [profileRequest, setProfileRequest] = useState<{ kind: ProfileLinkSheet; serial: number } | null>(null);

  /* ── auth gate ────────────────────────────────────── */
  const sessionSeenRef = useRef(false);
  useEffect(() => {
    // eslint-disable-next-line settled/no-not-loading-empty-check -- authLoading is the session flag, not a React Query.
    if (!authLoading && !user) {
      // Session ended while the editor was open: say so before the redirect
      // takes the member away, so the lost form is never a silent mystery.
      if (sessionSeenRef.current) {
        logSaveFailure('session ended (redirect)', new Error('no signed-in user'), { category, mode: 'edit' });
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
    if (!membershipLoading && membership && !canEditBusinessProfile(membership.role)) {
      toast.error("You don't have permission to edit this business");
      navigate(`/business/${id}`);
    }
  }, [membershipLoading, membership, id, navigate]);

  /* ── populate from existing business ──────────────── */
  const populated = useRef(false);
  useEffect(() => {
    if (!business || populated.current) return;

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
  }, [business]);

  /* ── club-linked & duplicate-check ────────────────── */
  const isClubLinked = !!business?.club_id;
  const handleClose = () => { if (id) navigate(`/business/${id}`); else navigate(-1); };


  /* ── save: edit uses this hook (needs id) ───── */
  const { uploadLogo, removeLogo, uploadCover, removeCover } = useBusinessImageUpload(
    id, { role: membership?.role }
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
      : save.kind === 'hours' ? { show_opening_hours: save.shown, opening_hours: save.value as unknown as Json }
      : save.kind === 'facilities' ? { amenities: save.value }
      : { social_links: links && Object.values(links).some(Boolean) ? links : null };
    const { error } = await supabase.from('business_accounts').update(protectBusinessPayload(payload, membership?.role)).eq('id', id ?? '');
    if (error) throw error;
    if (save.kind === 'main') setPrimaryAction(save.value);
    else if (save.kind === 'hours') { setOpeningHours(save.value); setShowOpeningHours(save.shown); }
    else if (save.kind === 'facilities') setAmenities(save.value);
    else setSocial(save.value);
  });


  /* ── loading / error states (edit) ──────────────── */
  if (authLoading || businessLoading || membershipLoading) {
    return <ManagePageSkeleton />;
  }
  if ((businessError || !business)) {
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
  if (!canEdit) return null;


  /* ── render ──────────────────────────────────────── */
  return (
    <>
      <BusinessEditFrame
        editing tab={tab} onTab={onTab}
        onBack={handleClose}
        settings={business ? <BusinessEditSettings business={business} role={membership?.role} userId={user?.id ?? ''} /> : null}
      >
        <div className="flex-1 overflow-y-auto" style={{ background: BIZ.pageBg }}>

          <BusinessEditPreview name={businessName} category={category} city={business?.city || business?.location || ''} primaryAction={primaryAction} actionData={{ category, primary_action: primaryAction, booking_url: bookingUrl, phone: phone?.fullNumber, email, website, location: address?.label || business?.location, lat: address?.lat, lng: address?.lng }}
            completion={{ logo: logo.url, cover: cover.url, description, foundedYear, lat: address?.lat, lng: address?.lng, phone: phone?.fullNumber || '', website, showOpeningHours, openingHours }}
            clubLinked={isClubLinked} editor={isEditor} busy={partialStatus === 'saving'} onSave={saveIdentity} onPhoto={savePhoto} onFocusLegacy={openCompletionSheet} />
          <BusinessEditWhereContact address={address} country={countrySelection} phone={phone?.fullNumber || ''} email={email} website={website} clubLinked={isClubLinked} busy={partialStatus === 'saving'} requested={contactRequest} onSave={saveContact} />

          <BusinessEditProfileLinks action={{ category, primary_action: primaryAction, booking_url: bookingUrl, website, phone: phone?.fullNumber, email, location: address?.label || business?.location, lat: address?.lat, lng: address?.lng }} street={address?.addressLine1} town={address?.city || business?.city || business?.location || ''} hours={openingHours} shown={showOpeningHours} amenities={amenities} social={social} busy={partialStatus === 'saving'} requested={profileRequest} onSave={saveProfileLink} />

          <div className="be4-status"><Button type="button" variant="ghost" className="ep-saved be2-saved" data-state={partialStatus} aria-live="polite" onClick={() => { if (partialStatus === 'error') void partialRetry.current?.(); }}>{partialStatus === 'saving' ? 'Saving…' : partialStatus === 'error' ? "Couldn't save. Try again." : 'All changes saved'}</Button></div>

        </div>
      </BusinessEditFrame>

    </>
  );
}

