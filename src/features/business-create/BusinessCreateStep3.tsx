/**
 * BC3 — step 3: "How do golfers reach you?" (biz-c3-contact.html). One
 * contact card, the main-button chips, and an extras card whose rows open
 * the three shared sheets (social links, opening hours, facilities).
 * NOTHING is saved to the database: every edit lands in the draft, and
 * Continue and Skip both move to step 4 keeping whatever is filled.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { PhoneInputWithDialCode } from '@/components/business/PhoneInputWithDialCode';
import { DAYS_ORDER, PRIMARY_ACTION_OPTIONS, SOCIAL_PLATFORMS, getFacilitiesForCategory, type Day, type OpeningHoursEntry, type PrimaryActionKey, type SocialFields } from '@/components/business/editor/editorTypes';
import { countryNameToCode } from '@/utils/countryCodeMapping';
import { contactFieldError, facilitiesSummary, hoursSummary, mainButtonAvailability, mainButtonHint, socialSummary } from './step3Rules';
import type { BusinessCreateDraft } from './createRules';

interface Props {
  draft: BusinessCreateDraft;
  setDraft: (fn: (d: BusinessCreateDraft) => BusinessCreateDraft) => void;
  onContinue: () => void;
}

type SheetKind = 'social' | 'hours' | 'facilities' | null;

const SOC_GLYPH: Record<string, string> = { instagram: 'IG', tiktok: 'TT', twitter: 'X', youtube: 'YT', facebook: 'f' };

/** The shared BC3 bottom sheet: Done, a scrim tap and a swipe down all close
 * it and keep the edits (the draft is already updated live). */
export function BizcSheet({ title, sub, onDone, children, testId, hideHeader = false, actionLabel = 'Done', onAction, actionDisabled = false, hideAction = false }: { title: string; sub?: string; onDone: () => void; children: ReactNode; testId: string; hideHeader?: boolean; actionLabel?: string; onAction?: () => void; actionDisabled?: boolean; hideAction?: boolean }) {
  const touchY = useRef<number | null>(null);
  // Portalled to body so no ancestor transform can become its containing block.
  return createPortal(
    <>
      <div className="bizc-sheet-scrim" onClick={onDone} aria-hidden="true" />
      <div
        className="bizc-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-testid={testId}
        onTouchStart={(e) => { touchY.current = e.touches[0].clientY; }}
        onTouchMove={(e) => {
          if (touchY.current != null && e.touches[0].clientY - touchY.current > 60) { touchY.current = null; onDone(); }
        }}
      >
        <div className="bizc-sheet-grab" aria-hidden="true" />
        {!hideHeader && <div className="bizc-sheet-head">
          <span className="bizc-sheet-title">{title}</span>
          {!hideAction && <button type="button" className="bizc-sheet-done" disabled={actionDisabled} onClick={onAction ?? onDone}>{actionLabel}</button>}
        </div>}
        {sub && <p className="bizc-sheet-sub">{sub}</p>}
        {children}
      </div>
    </>,
    document.body,
  );
}

function Switch({ checked, onChange, label, small = false }: { checked: boolean; onChange: (v: boolean) => void; label: string; small?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`bizc-switch${small ? ' small' : ''}`} onClick={() => onChange(!checked)}>
      <i aria-hidden="true" />
    </button>
  );
}

export function BusinessCreateStep3({ draft, setDraft, onContinue }: Props) {
  const { t } = useTranslation('profile');
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [blurred, setBlurred] = useState<Record<string, boolean>>({});

  const facilities = getFacilitiesForCategory(draft.category);
  const avail = mainButtonAvailability(draft);
  const hint = mainButtonHint(draft);

  /* If the detail behind the chosen chip is cleared, the choice is cleared. */
  useEffect(() => {
    if (draft.primaryAction && !avail[draft.primaryAction]) {
      setDraft(d => (d.primaryAction ? { ...d, primaryAction: null } : d));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.bookingUrl, draft.phone?.fullNumber, draft.email, draft.website, draft.address]);

  /* Dial code defaults from the country chosen in step 2 (or the picked
   * club's country, which step 2 used to prefill the address). */
  const dialDefaultIso = draft.countrySelection
    ?? (draft.selectedClub?.country ? countryNameToCode(draft.selectedClub.country) : null)
    ?? null;

  const markBlur = (field: string) => setBlurred(b => ({ ...b, [field]: true }));
  const fieldError = (field: 'email' | 'website' | 'bookingUrl') =>
    blurred[field] ? contactFieldError(field, draft[field]) : null;
  const firstError = fieldError('email') ?? fieldError('website') ?? fieldError('bookingUrl');

  const setSocialField = (field: keyof SocialFields, raw: string, kind: 'handle' | 'url') => {
    // The same normalisation as today's SocialSection: handles drop leading @.
    const v = kind === 'handle' ? raw.replace(/^@+/, '') : raw;
    setDraft(d => ({ ...d, social: { ...d.social, [field]: v } }));
  };

  const updateDay = (day: Day, patch: Partial<OpeningHoursEntry>) =>
    setDraft(d => ({ ...d, openingHours: { ...d.openingHours, [day]: { ...d.openingHours[day], ...patch } } }));
  const applyMondayToAll = () => setDraft(d => {
    const mon = d.openingHours.Mon;
    const next = { ...d.openingHours };
    DAYS_ORDER.forEach(day => { next[day] = { ...mon }; });
    return { ...d, openingHours: next };
  });

  const toggleFacility = (f: string) => setDraft(d => ({
    ...d,
    amenities: d.amenities.includes(f) ? d.amenities.filter(a => a !== f) : [...d.amenities, f],
  }));

  const extras = [
    facilities.length > 0 && {
      key: 'facilities' as const,
      title: t('businessCreate.facilities', { defaultValue: 'Facilities' }),
      sub: facilitiesSummary(draft.amenities),
    },
    {
      key: 'social' as const,
      title: t('businessCreate.socialLinks', { defaultValue: 'Social links' }),
      sub: socialSummary(draft.social),
    },
    {
      key: 'hours' as const,
      title: t('businessCreate.openingHours', { defaultValue: 'Opening hours' }),
      sub: hoursSummary(draft.showOpeningHours),
    },
  ].filter(Boolean) as { key: Exclude<SheetKind, null>; title: string; sub: string }[];

  return (
    <>
      <main className="bizc-body" data-testid="bizc-step-3">
        <div className="bizc-kicker">{t('businessCreate.contactKicker', { defaultValue: 'Contact' })}</div>
        <h1>{t('businessCreate.contactTitle', { defaultValue: 'How do golfers reach you?' })}</h1>

        {/* 1. Contact card */}
        <div className="bizc-rows" data-testid="bizc-contact-card">
          <div className="bizc-row">
            <span className="bizc-row-label">{t('businessCreate.phone', { defaultValue: 'Phone' })}</span>
            <PhoneInputWithDialCode
              className="bizc-phone"
              value={draft.phone}
              defaultCountryIso={dialDefaultIso}
              onChange={(v) => setDraft(d => ({ ...d, phone: v }))}
            />
          </div>
          {(['email', 'website', 'bookingUrl'] as const).map((field) => (
            <div className="bizc-row" key={field}>
              <span className="bizc-row-label">
                {field === 'email'
                  ? t('businessCreate.email', { defaultValue: 'Email' })
                  : field === 'website'
                    ? t('businessCreate.website', { defaultValue: 'Website' })
                    : t('businessCreate.booking', { defaultValue: 'Booking' })}
              </span>
              <input
                className="bizc-row-input"
                data-testid={`bizc-input-${field}`}
                type={field === 'email' ? 'email' : 'url'}
                value={draft[field]}
                placeholder={field === 'email'
                  ? t('businessCreate.emailPh', { defaultValue: 'Email address' })
                  : field === 'website'
                    ? t('businessCreate.websitePh', { defaultValue: 'Add a website' })
                    : t('businessCreate.bookingPh', { defaultValue: 'Add a booking link' })}
                onChange={(e) => setDraft(d => ({ ...d, [field]: e.target.value }))}
                onBlur={() => markBlur(field)}
              />
            </div>
          ))}
        </div>
        {firstError && <div className="bizc-error" role="alert">{firstError}</div>}

        {/* 2. Your main button */}
        <div className="bizc-group" style={{ marginTop: 20 }}>{t('businessCreate.mainButton', { defaultValue: 'Your main button' })}</div>
        <div className="bizc-chips" data-testid="bizc-main-buttons">
          {PRIMARY_ACTION_OPTIONS.map((o) => {
            const available = avail[o.key];
            const chosen = draft.primaryAction === o.key;
            return (
              <button
                key={o.key}
                type="button"
                className="bizc-chip"
                data-action={o.key}
                aria-pressed={chosen}
                aria-disabled={!available}
                onClick={() => {
                  if (!available) return;
                  setDraft(d => ({ ...d, primaryAction: chosen ? null : (o.key as PrimaryActionKey) }));
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        {hint && <div className="bizc-hint" data-testid="bizc-main-hint">{hint}</div>}

        {/* 3. Extras card */}
        <div className="bizc-rows" data-testid="bizc-extras-card">
          {extras.map((x) => (
            <button key={x.key} type="button" className="bizc-xrow" data-extra={x.key} onClick={() => setSheet(x.key)}>
              <span className="bizc-xrow-text">
                <span className="bizc-xrow-title">{x.title}</span>
                <span className="bizc-xrow-sub" data-testid={`bizc-xsub-${x.key}`}>{x.sub}</span>
              </span>
              <span className="bizc-xrow-action">
                {(x.key === 'facilities' ? draft.amenities.length > 0
                  : x.key === 'social' ? Object.values(draft.social).some(v => v.trim())
                    : draft.showOpeningHours)
                  ? t('businessCreate.edit', { defaultValue: 'Edit' })
                  : t('businessCreate.add', { defaultValue: 'Add' })}
              </span>
            </button>
          ))}
        </div>
      </main>

      <div className="bizc-foot">
        <button type="button" className="bizc-primary" data-testid="bizc-continue" onClick={onContinue}>
          {t('businessCreate.continue', { defaultValue: 'Continue' })}
        </button>
      </div>

      {/* 3C Social links */}
      {sheet === 'social' && (
        <BizcSheet testId="bizc-sheet-social" title={t('businessCreate.socialLinks', { defaultValue: 'Social links' })} sub={t('businessCreate.socialSub', { defaultValue: 'So golfers can follow you off the course.' })} onDone={() => setSheet(null)}>
          <div className="bizc-rows">
            {SOCIAL_PLATFORMS.map((p) => (
              <div className="bizc-row" key={p.field}>
                <span className="bizc-soc-ic" aria-hidden="true">{SOC_GLYPH[p.field]}</span>
                <input
                  className="bizc-row-input"
                  data-testid={`bizc-social-${p.field}`}
                  value={draft.social[p.field]}
                  placeholder={p.field === 'youtube' ? 'youtube.com/@…' : p.field === 'facebook' ? 'facebook.com/…' : '@yourhandle'}
                  onChange={(e) => setSocialField(p.field, e.target.value, p.kind)}
                />
              </div>
            ))}
          </div>
        </BizcSheet>
      )}

      {/* 3D Opening hours */}
      {sheet === 'hours' && (
        <BizcSheet testId="bizc-sheet-hours" title={t('businessCreate.openingHours', { defaultValue: 'Opening hours' })} onDone={() => setSheet(null)}>
            <div className="bizc-row bizc-hours-master">
              <span className="bizc-xrow-text">
                <span className="bizc-xrow-title">{t('businessCreate.showOnProfile', { defaultValue: 'Show on my profile' })}</span>
                <span className="bizc-xrow-sub">{t('businessCreate.hoursSub', { defaultValue: 'Turn off if your hours vary.' })}</span>
              </span>
              <Switch label="Show opening hours" checked={draft.showOpeningHours} onChange={(v) => setDraft(d => ({ ...d, showOpeningHours: v }))} />
            </div>
          {draft.showOpeningHours && (
            <>
              <div className="bizc-rows" data-testid="bizc-hours-days">
                {DAYS_ORDER.map((day) => {
                  const entry = draft.openingHours[day] ?? { open: '08:00', close: '18:00', closed: false };
                  return (
                    <div className="bizc-day" key={day} data-day={day}>
                      <span className="bizc-day-name">{day}</span>
                      {entry.closed ? (
                        <span className="bizc-day-closed">{t('businessCreate.closed', { defaultValue: 'Closed' })}</span>
                      ) : (
                        <span className="bizc-time-pair">
                          <input type="time" className="bizc-tchip" data-testid={`bizc-open-${day}`} value={entry.open} onChange={(e) => updateDay(day, { open: e.target.value })} />
                          <span aria-hidden="true">–</span>
                          <input type="time" className="bizc-tchip" data-testid={`bizc-close-${day}`} value={entry.close} onChange={(e) => updateDay(day, { close: e.target.value })} />
                        </span>
                      )}
                      <Switch small label={`${day} open`} checked={!entry.closed} onChange={(v) => updateDay(day, { closed: !v })} />
                    </div>
                  );
                })}
              </div>
              <button type="button" className="bizc-link" style={{ fontSize: 12.5 }} onClick={applyMondayToAll}>
                {t('businessCreate.applyMonday', { defaultValue: 'Apply Monday to all days' })}
              </button>
            </>
          )}
        </BizcSheet>
      )}

      {/* 3E Facilities */}
      {sheet === 'facilities' && (
        <BizcSheet testId="bizc-sheet-facilities" title={t('businessCreate.facilities', { defaultValue: 'Facilities' })} sub={t('businessCreate.facilitiesSub', { defaultValue: 'What golfers will find when they visit.' })} onDone={() => setSheet(null)}>
          <div className="bizc-chips" style={{ marginTop: 14 }}>
            {facilities.map((f) => (
              <button
                key={f}
                type="button"
                className="bizc-chip"
                aria-pressed={draft.amenities.includes(f)}
                onClick={() => toggleFacility(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </BizcSheet>
      )}
    </>
  );
}

export default BusinessCreateStep3;
