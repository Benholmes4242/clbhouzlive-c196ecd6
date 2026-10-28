/** BC5: single creation transaction path; editor and guided flow retain the same
 * insert, post-insert uploads, owner safeguard, claim and refresh boundaries.
 * An uploader's null result is retained (not reinterpreted) for editor compatibility. */
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';
import type { QueryClient } from '@tanstack/react-query';
import type { Database, Json } from '@/integrations/supabase/types';
import { clubInsertFields } from '@/features/business/claimClub';
import { dbLocationPrecision } from '@/components/business/AddressAutocomplete';
import { AppLog } from '@/lib/logger';
import type { BusinessCreateDraft } from './createRules';
import type { OwnerlessNotice } from './BusinessCreationNotices';
import { SaveStepError, logSaveFailure } from './creationErrors';

export type CreateBusinessDraft = Omit<BusinessCreateDraft, 'category'> & { category: string };
export interface CreateBusinessResult { id: string; slug: string | null; partials: string[]; claim: 'none' | 'filed' | 'failed'; claimError?: string; ownerless?: OwnerlessNotice; savedImages?: { logo: string | null; cover: string | null } }
export async function createBusiness(draft: CreateBusinessDraft, { userId, sourceCourseId, queryClient }: { userId: string; sourceCourseId?: string | null; queryClient: QueryClient }): Promise<CreateBusinessResult> {
  const { category, selectedClub, selectedCollege, businessName, description, foundedYear, website, email, phone, bookingUrl, openingHours, social, amenities, primaryAction, showOpeningHours, address, logo, cover, claimProofNote } = draft;
  const name = category === 'Golf Club' && selectedClub ? selectedClub.name : category === 'University / College' && selectedCollege ? selectedCollege.college_name : businessName.trim();
  const isGolfClub = category === 'Golf Club';
  const mode = 'create';
  const user = { id: userId };
  const socialLinks = { instagram: social.instagram || null, tiktok: social.tiktok || null, twitter: social.twitter || null, facebook: social.facebook || null, youtube: social.youtube || null };
  const hasSocial = Object.values(socialLinks).some(Boolean);
        const insertData: Database['public']['Tables']['business_accounts']['Insert'] = {
          name: name,
          category,
          description: description || null,
          founded_year: foundedYear ? parseInt(foundedYear, 10) : null,
          website: website.trim() || null,
          email: email.trim() || null,
          phone: phone?.fullNumber || null,
          booking_url: bookingUrl.trim() || null,
          opening_hours: openingHours as unknown as Json,
          social_links: hasSocial ? (socialLinks as unknown as Json) : null,
          is_verified: false,
          amenities,
          primary_action: primaryAction || null,
          show_opening_hours: showOpeningHours,
        };




        if (isGolfClub && selectedClub) {
          // NOTE: club_id / club_key are intentionally NOT written here.
          // Ownership of the course is granted only when an admin approves a
          // course_claim_request (filed below after the business is created).
          // Display fields (lat/lng/country) are safe to populate up-front.
          const fromClub = clubInsertFields(selectedClub);
          insertData.club_name = fromClub.club_name;
          insertData.lat = fromClub.lat;
          insertData.lng = fromClub.lng;
          insertData.country = fromClub.country;
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
          insertData.location_precision = dbLocationPrecision(address.precision);
        }

        const { data: row, error: insertErr } = await supabase
          .from('business_accounts')
          .insert(insertData)
          .select('id, slug')
          .single();
        if (insertErr) throw new SaveStepError('insert', insertErr);
        const newId = row.id;

        // images after insert
        const partials: string[] = [];
        let logoUrl: string | null = null;
        let coverUrlVal: string | null = null;
        if (logo.pendingFile) {
          // direct upload path — useBusinessImageUpload requires id, so call it directly via a transient hook is awkward.
          // Instead inline the same supabase update once we have the id.
          // Simpler: use a one-off uploader by calling the same hook signature via a helper.
          try { logoUrl = await uploadImageDirect(newId, logo.pendingFile, 'logo'); }
          catch (e) { logSaveFailure('logo upload', e, { category, mode, businessId: newId }); partials.push('logo'); }
        }
        if (cover.pendingFile) {
          try { coverUrlVal = await uploadImageDirect(newId, cover.pendingFile, 'cover'); }
          catch (e) { logSaveFailure('cover upload', e, { category, mode, businessId: newId }); partials.push('cover photo'); }
        }
        let imagesPatched = false;
        if (logoUrl || coverUrlVal) {
          const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
          if (logoUrl) patch.logo_url = logoUrl;
          if (coverUrlVal) patch.cover_image_url = coverUrlVal;
          const { error: patchErr } = await supabase.from('business_accounts').update(patch).eq('id', newId);
          if (patchErr) {
            logSaveFailure('image patch', patchErr, { category, mode, businessId: newId });
            partials.push('photos');
          } else imagesPatched = true;
        }

        // owner row. A DB trigger is believed to auto-create the owner
        // membership, but that trigger is NOT in this repo's migrations, so
        // this upsert may be the only writer. A failure leaves an ownerless
        // business: data damage, not a warning. It is reported loudly (fatal
        // severity) but the business is NOT deleted — a known half-created
        // business is recoverable; a deleted one with uploaded images is not.
        const { error: memberErr } = await supabase
          .from('business_members')
          .upsert(
            { business_id: newId, user_profile_id: user.id, role: 'owner' },
            { onConflict: 'business_id,user_profile_id', ignoreDuplicates: true },
          );
        if (memberErr) {
          logSaveFailure('members upsert (FATAL: ownerless business)', memberErr, {
            severity: 'fatal', category, mode, businessId: newId, businessName: name,
          });
          // Persistent, acknowledged panel — navigation happens on dismiss.
          return { id: newId, slug: row.slug, partials, claim: 'none', ownerless: { name, id: newId, target: `/business/${row.slug || newId}` } };
        }

        // For golf-club businesses: file a course-claim request for admin review.
        // The business is already created; the claim links club ownership only on approval.
        // Do NOT hard-fail the save if the claim submit errors — surface softly.
        let claimFiled = false;
        let claimError: string | null = null;
        if (isGolfClub && selectedClub) {
          const { error: claimErr } = await supabase.functions.invoke('request-course-claim', {
            body: {
              business_id: newId,
              club_id: selectedClub.id,
              club_key: selectedClub.club_key || null,
              // Editor path may be a whole-club claim or originate from a course page.
              source_course_id: sourceCourseId || null,
              proof_note: claimProofNote.trim() || null,
            },
          });
          if (claimErr) {
            // FunctionsHttpError's `.message` is generic ("non-2xx status code").
            // The real message lives in the JSON response body.
            let msg = 'This club may already be claimed or under review.';
            if (claimErr instanceof FunctionsHttpError) {
              try {
                const body = await claimErr.context.json();
                if (body?.error) msg = body.error;
                else if (body?.message) msg = body.message;
              } catch {
                /* keep fallback */
              }
            } else if (claimErr.message) {
              msg = claimErr.message;
            }
            claimError = msg;
            logSaveFailure('claim invoke', claimErr, { category, mode, businessId: newId, body: msg });
          } else {
            claimFiled = true;
          }
        }

        // The business exists from here on. A refresh failure must never reach
        // the outer catch and report a failed create (which invites a duplicate).
        try {
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
        } catch (e) {
          logSaveFailure('query refresh after create', e, { category, mode, businessId: newId });
        }

  return { id: newId, slug: row.slug, partials, claim: claimFiled ? 'filed' : claimError ? 'failed' : 'none', claimError: claimError ?? undefined, savedImages: { logo: imagesPatched ? logoUrl : null, cover: imagesPatched ? coverUrlVal : null } };
}

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
