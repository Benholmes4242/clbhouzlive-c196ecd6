/**
 * BC2 step 2, every category except Golf Club and University / College
 * (panels 2F–2G of biz-c2-find.html). Name, then address with the country
 * defaulted from the member's profile; the golf-area card appears once the
 * address has coordinates, for ALL categories in this branch (not only
 * NEARBY_CATEGORIES). The name check is a debounced (400ms) exact,
 * case-insensitive, non-deleted business match. Nothing is saved — the draft
 * carries the name, address and country.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AddressAutocomplete, type AddressValue } from '@/components/business/AddressAutocomplete';
import { CountrySelector, getCountryCode, getCountryDisplayName } from '@/components/business/CountrySelector';
import { PinDropModal } from '@/components/business/PinDropModal';
import { RequestAccessModal } from '@/components/business/RequestAccessModal';
import { milesLabel } from '@/components/business/BusinessNearbyCourses';
import { countryNameToCode } from '@/utils/countryCodeMapping';
import { formatNumber } from '@/i18n/format';
import { AppLog } from '@/lib/logger';
import { nameInitials } from './step2Rules';
import { Field } from './step2Bits';
import type { BusinessCreateDraft } from './createRules';

interface Props {
  draft: BusinessCreateDraft;
  setDraft: (fn: (d: BusinessCreateDraft) => BusinessCreateDraft) => void;
  userId: string;
  onContinue: () => void;
}

interface NameMatch { id: string; name: string; category: string | null; logo_url: string | null; city: string | null; country: string | null }

interface AreaFigures { count: number; rounds: number | null; nearestKm: number | null }

const num = (v: unknown) => (v == null || !Number.isFinite(Number(v)) ? null : Number(v));

export function Step2Other({ draft, setDraft, userId, onContinue }: Props) {
  const { t } = useTranslation('profile');
  const name = draft.businessName;
  const [match, setMatch] = useState<NameMatch | null>(null);
  const [checkedName, setCheckedName] = useState('');
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const [showCountry, setShowCountry] = useState(false);
  const [showPinDrop, setShowPinDrop] = useState(false);
  const [showRequestAccess, setShowRequestAccess] = useState(false);

  /* Country defaults from the member's profile (user_profiles.country). */
  const profileCountryQ = useQuery({
    queryKey: ['bizc-profile-country', userId],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from('user_profiles').select('country').eq('id', userId).maybeSingle();
      if (error) throw error;
      return ((data as { country?: string | null } | null)?.country ?? null) as string | null;
    },
  });
  useEffect(() => {
    if (draft.countrySelection || !profileCountryQ.data) return;
    const code = countryNameToCode(profileCountryQ.data);
    if (code) setDraft(d => (d.countrySelection ? d : { ...d, countrySelection: code }));
  }, [profileCountryQ.data]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Name match — debounced 400ms, exact name ignoring case, non-deleted only. */
  useEffect(() => {
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      setMatch(null);
      setCheckedName('');
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const { data, error } = await supabase
        .from('business_accounts')
        .select('id, name, category, logo_url, city, country')
        .ilike('name', trimmed)
        .eq('is_deleted', false)
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        AppLog.error('[BusinessCreate]', 'name match check failed', error);
        setMatch(null);
      } else {
        setMatch((data as NameMatch | null) ?? null);
      }
      setCheckedName(trimmed);
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [name]);

  const trimmed = name.trim();
  const undismissed = !!match && dismissedFor !== trimmed;
  const showTick = !match && checkedName === trimmed && trimmed.length >= 3;

  const countryCode = getCountryCode(draft.countrySelection);
  const countryName = getCountryDisplayName(draft.countrySelection);

  const lat = draft.address?.lat;
  const lng = draft.address?.lng;
  const hasCoords = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);

  /* Golf area card — nearby courses at 16 km (limit 100), rounds from the
   * same batched stats read the business surfaces use. A failed stats read
   * keeps the card with "—" rounds; zero courses or a failed nearby read
   * means no card at all. */
  const areaQ = useQuery({
    queryKey: ['bizc-area', lat, lng],
    enabled: hasCoords,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<AreaFigures | null> => {
      const { data, error } = await supabase.rpc('get_nearby_courses', {
        p_user_lat: lat as number, p_user_lng: lng as number, p_radius_km: 16, p_limit: 100,
      });
      if (error) throw error;
      type Row = { course_id: string; distance_km?: number | null };
      const seen = new Set<string>();
      const courses: { id: string; distanceKm: number | null }[] = [];
      for (const r of (data ?? []) as Row[]) {
        if (seen.has(r.course_id)) continue;
        seen.add(r.course_id);
        courses.push({ id: r.course_id, distanceKm: num(r.distance_km) });
      }
      if (courses.length === 0) return null;
      let rounds: number | null = null;
      const { data: stats, error: statsError } = await supabase.rpc('get_course_stats_batch', { p_course_ids: courses.map(c => c.id) });
      if (!statsError) {
        let sum = 0;
        for (const row of (Array.isArray(stats) ? stats : []) as Record<string, unknown>[]) {
          const inner = row && 'course_id' in row ? row : (Object.values(row ?? {}).find(v => v && typeof v === 'object' && 'course_id' in (v as object)) as Record<string, unknown> | undefined);
          sum += num(inner?.rounds_tracked) ?? 0;
        }
        rounds = sum;
      }
      const distances = courses.map(c => c.distanceKm).filter((d): d is number => d != null);
      return { count: courses.length, rounds, nearestKm: distances.length ? Math.min(...distances) : null };
    },
  });
  const area = areaQ.data ?? null;

  return (
    <>
      <main className="bizc-body" data-testid="bizc-step-2" data-branch="other">
        <div className="bizc-kicker">{t('businessCreate.otherKicker', { defaultValue: 'Your business' })}</div>
        <h1>{t('businessCreate.otherTitle', { defaultValue: 'Where can golfers find you?' })}</h1>

        <Field label={t('businessCreate.nameLabel', { defaultValue: 'Business name' })} testId="bizc-name">
          <input
            className="bizc-field-input"
            value={name}
            onChange={e => setDraft(d => ({ ...d, businessName: e.target.value }))}
            autoComplete="off"
          />
        </Field>

        {showTick && (
          <p className="bizc-tick" data-testid="bizc-name-ok">
            <b>✓</b> {t('businessCreate.nameOk', { defaultValue: 'No other business on clbhouz has this name.' })}
          </p>
        )}

        {undismissed && match && (
          <div className="bizc-note" data-testid="bizc-name-match" style={{ marginTop: 10 }}>
            <div className="bizc-idrow">
              <span className="bizc-crest" aria-hidden="true">
                {match.logo_url ? <img src={match.logo_url} alt="" /> : nameInitials(match.name)}
              </span>
              <span className="bizc-res-text">
                <b style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{match.name} is already on clbhouz.</b>
                <span className="bizc-res-place">{[match.category, [match.city, match.country].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}</span>
              </span>
            </div>
            <div className="bizc-pillrow">
              <button type="button" className="bizc-ghost" onClick={() => setShowRequestAccess(true)}>
                {t('businessCreate.requestAccess', { defaultValue: 'Request access' })}
              </button>
              <button type="button" className="bizc-ghost plain" onClick={() => setDismissedFor(trimmed)}>
                {t('businessCreate.differentBusiness', { defaultValue: "That's a different business" })}
              </button>
            </div>
          </div>
        )}

        <Field label={t('businessCreate.addressLabel', { defaultValue: 'Address' })} testId="bizc-address">
          <AddressAutocomplete
            bare
            value={draft.address}
            onChange={(v: AddressValue | null) => setDraft(d => ({ ...d, address: v }))}
            onDropPinClick={() => setShowPinDrop(true)}
            countryCode={countryCode}
            countryDisplayName={countryName}
            placeholder={t('businessCreate.addressPlaceholder', { defaultValue: 'Start typing an address' })}
          />
        </Field>
        <div className="bizc-cline" data-testid="bizc-country-line">
          {countryCode ? (
            <>
              In <b>{countryName}</b>
              {' · '}<button type="button" onClick={() => setShowCountry(v => !v)}>{t('businessCreate.changeCountry', { defaultValue: 'Change' })}</button>
              {' · '}<button type="button" onClick={() => setShowPinDrop(true)}>{t('businessCreate.dropPin', { defaultValue: 'Drop a pin' })}</button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setShowCountry(v => !v)}>{t('businessCreate.chooseCountry', { defaultValue: 'Choose a country' })}</button>
              {' · '}<button type="button" onClick={() => setShowPinDrop(true)}>{t('businessCreate.dropPin', { defaultValue: 'Drop a pin' })}</button>
            </>
          )}
        </div>
        {showCountry && (
          <div className="bizc-country" data-testid="bizc-country-picker">
            <CountrySelector
              value={draft.countrySelection}
              onChange={(n) => {
                setDraft(d => ({ ...d, countrySelection: n, address: null }));
                setShowCountry(false);
              }}
            />
          </div>
        )}

        {area && (
          <div className="bizc-card" data-testid="bizc-area-card">
            <div className="bizc-areakick">{t('businessCreate.areaKicker', { defaultValue: 'Your golf on clbhouz' })}</div>
            <div className="bizc-areahead" data-testid="bizc-area-headline">
              {area.rounds != null
                ? `${area.count} courses within 10 miles, with ${formatNumber(area.rounds)} rounds tracked.`
                : `${area.count} courses within 10 miles.`}
            </div>
            <div className="bizc-facts">
              <div><b>{formatNumber(area.count)}</b><i>{t('businessCreate.facts.courses', { defaultValue: 'Courses' })}</i></div>
              <div><b>{area.rounds != null ? formatNumber(area.rounds) : '—'}</b><i>{t('businessCreate.facts.rounds', { defaultValue: 'Rounds' })}</i></div>
              <div><b>{area.nearestKm != null ? milesLabel(area.nearestKm) : '—'}</b><i>{t('businessCreate.facts.nearest', { defaultValue: 'Nearest' })}</i></div>
            </div>
          </div>
        )}
      </main>

      <div className="bizc-foot">
        <button type="button" className="bizc-primary" data-testid="bizc-continue-2" disabled={!trimmed || undismissed} onClick={onContinue}>
          {t('businessCreate.continue', { defaultValue: 'Continue' })}
        </button>
      </div>

      <PinDropModal
        open={showPinDrop}
        onOpenChange={setShowPinDrop}
        onConfirm={(v) => {
          setDraft(d => ({ ...d, address: v }));
          setShowPinDrop(false);
        }}
        initialCenter={hasCoords ? { lat: lat as number, lng: lng as number } : undefined}
      />
      {match && (
        <RequestAccessModal
          open={showRequestAccess}
          onOpenChange={setShowRequestAccess}
          businessId={match.id}
          businessName={match.name}
          businessAvatarUrl={match.logo_url}
          userId={userId}
        />
      )}
    </>
  );
}
