import React from 'react';
import { Lock, MapPin } from 'lucide-react';

import { SectionEyebrow } from '@/components/ui/SectionEyebrow';
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';
import { BIZ } from '@/components/business/businessTokens';
import { AddressAutocomplete, AddressValue } from '@/components/business/AddressAutocomplete';
import { PhoneInputWithDialCode, PhoneValue } from '@/components/business/PhoneInputWithDialCode';
import {
  CountrySelector,
  getCountryCode,
  getCountryDisplayName,
} from '@/components/business/CountrySelector';
import { MapPreview } from '@/components/map/MapPreview';
import { SelectedClub } from '@/components/business/ClubSearchDropdown';

import {
  INPUT_CLASS,
  INPUT_STYLE,
  LOCKED_CLASS,
  LOCKED_STYLE,
  LABEL_CLASS,
  HINT_CLASS,
} from './editorStyles';
import {
  DAYS_ORDER,
  Day,
  OpeningHours,
  OpeningHoursEntry,
} from './editorTypes';

export interface LocationContactSectionProps {
  mode: 'create' | 'edit';
  isClubLinked: boolean;
  isGolfClub: boolean;
  selectedClub: SelectedClub | null;
  address: AddressValue | null;
  setAddress: (v: AddressValue | null) => void;
  addressError: string | null;
  setAddressError: (v: string | null) => void;
  countrySelection: string | null;
  setCountrySelection: (v: string | null) => void;
  phone: PhoneValue | null;
  setPhone: (v: PhoneValue | null) => void;
  email: string;
  setEmail: (v: string) => void;
  website: string;
  setWebsite: (v: string) => void;
  bookingUrl: string;
  setBookingUrl: (v: string) => void;
  openingHours: OpeningHours;
  setOpeningHours: (v: OpeningHours) => void;
  resolvedName: string;
  onOpenPinDrop: () => void;
  businessLocationFallback: string | null;
}

export function LocationContactSection({
  mode,
  isClubLinked,
  isGolfClub,
  selectedClub,
  address,
  setAddress,
  addressError,
  setAddressError,
  countrySelection,
  setCountrySelection,
  phone,
  setPhone,
  email,
  setEmail,
  website,
  setWebsite,
  bookingUrl,
  setBookingUrl,
  openingHours,
  setOpeningHours,
  resolvedName,
  onOpenPinDrop,
  businessLocationFallback,
}: LocationContactSectionProps) {
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

  return (
    <>
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
                    {address?.label || businessLocationFallback || 'Location unavailable'}
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
                    onDropPinClick={onOpenPinDrop}
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
                        onClick={onOpenPinDrop}
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
    </>
  );
}
