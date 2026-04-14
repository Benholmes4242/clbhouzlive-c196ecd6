/**
 * BusinessEditStep2Location — Step 2: Find Us
 * Location, address, map, phone, email, booking URL, opening hours
 * Website moved to Step 1 (Identity)
 */
import { useState } from 'react';
import { MapPin, Lock } from 'lucide-react';
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';
import { AddressAutocomplete, AddressValue } from '@/components/business/AddressAutocomplete';
import { PinDropModal } from '@/components/business/PinDropModal';
import { PhoneInputWithDialCode, PhoneValue } from '@/components/business/PhoneInputWithDialCode';
import { CountrySelector, getCountryCode, getCountryDisplayName } from '@/components/business/CountrySelector';
import { MapPreview } from '@/components/map/MapPreview';

const DAYS_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
type Day = typeof DAYS_ORDER[number];

interface OpeningHoursEntry { open: string; close: string; closed: boolean; }
type OpeningHours = Record<string, OpeningHoursEntry>;

interface BusinessEditStep2Props {
  formData: {
    businessName: string;
    businessContactEmail: string;
    businessBookingUrl: string;
  };
  onFieldChange: (field: string, value: string) => void;
  address: AddressValue | null;
  setAddress: (val: AddressValue | null) => void;
  countrySelection: string | null;
  setCountrySelection: (val: string | null) => void;
  phone: PhoneValue | null;
  setPhone: (val: PhoneValue | null) => void;
  openingHours: OpeningHours;
  setOpeningHours: (val: OpeningHours) => void;
  isClubLinked: boolean;
  businessLocation: string | null;
  addressError: string | null;
  setAddressError: (val: string | null) => void;
}

const INPUT_CLASS = "w-full rounded-xl px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F7931E]/40 transition-colors";
const INPUT_STYLE = { background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' };
const LOCKED_CLASS = "flex items-center gap-2 rounded-xl px-4 py-3 text-[15px] text-muted-foreground";
const LOCKED_STYLE = { background: 'rgba(15,23,42,0.03)', border: '0.5px solid rgba(15,23,42,0.07)' };
const LABEL_CLASS = "text-[13px] font-medium text-muted-foreground";
const HINT_CLASS = "text-[12px] text-muted-foreground mt-1";
const DIVIDER_STYLE = { height: '0.5px', background: 'rgba(15,23,42,0.07)', margin: '12px 0' };

export function BusinessEditStep2Location({
  formData, onFieldChange, address, setAddress, countrySelection, setCountrySelection,
  phone, setPhone, openingHours, setOpeningHours, isClubLinked, businessLocation,
  addressError, setAddressError,
}: BusinessEditStep2Props) {
  const [showPinDropModal, setShowPinDropModal] = useState(false);

  const updateDay = (day: Day, patch: Partial<OpeningHoursEntry>) => {
    setOpeningHours({ ...openingHours, [day]: { ...openingHours[day], ...patch } });
  };

  const setAllDays = (entry: OpeningHoursEntry) => {
    const updated = {} as OpeningHours;
    DAYS_ORDER.forEach(d => { updated[d] = { ...entry }; });
    setOpeningHours(updated);
  };

  const firstOpenDay = DAYS_ORDER.find(d => !openingHours[d]?.closed);

  return (
    <div className="space-y-4 px-4 pb-4 pt-2">
      {/* Location */}
      <SectionCard>
        <div className="space-y-3">
          {isClubLinked ? (
            <div className="space-y-1.5">
              <label className={LABEL_CLASS}>Location</label>
              <div className={LOCKED_CLASS} style={LOCKED_STYLE}>
                <Lock className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{address?.label || businessLocation || 'Location unavailable'}</span>
                <span className="text-[11px] text-muted-foreground/70">From club data</span>
              </div>
              <p className={HINT_CLASS}>Contact support to update the location for this linked club.</p>
            </div>
          ) : (
            <>
              {/* Country */}
              <div className="space-y-1.5">
                <label className={LABEL_CLASS}>
                  Country <span className="text-destructive">*</span>
                </label>
                <CountrySelector
                  value={countrySelection}
                  onChange={(name) => { setCountrySelection(name); if (address) setAddress(null); }}
                />
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className={LABEL_CLASS}>
                  Business address <span className="text-destructive">*</span>
                </label>
                <AddressAutocomplete
                  value={address}
                  onChange={(val) => { setAddress(val); setAddressError(null); }}
                  onDropPinClick={() => setShowPinDropModal(true)}
                  countryCode={getCountryCode(countrySelection)}
                  countryDisplayName={getCountryDisplayName(countrySelection)}
                  placeholder="Start typing street, postcode/ZIP, or area…"
                  error={addressError || undefined}
                />
                {addressError && <p className="text-[12px] text-destructive">{addressError}</p>}
              </div>

              {/* Map preview */}
              {address?.lat != null && address?.lng != null && Number.isFinite(address.lat) && Number.isFinite(address.lng) ? (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(15,23,42,0.07)' }}>
                  <MapPreview
                    lat={address.lat}
                    lng={address.lng}
                    name={formData.businessName || 'Business location'}
                    height={160}
                    zoom={14}
                    markerColor="#F7931E"
                    showExpandButton={false}
                  />
                  <div className="px-3 py-2.5 flex items-center justify-between" style={{ background: '#ffffff', borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
                    <div className="flex items-center gap-2 text-[13px] min-w-0">
                      <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: '#F7931E' }} />
                      <span className="truncate text-foreground">
                        {address.city && address.country ? `${address.city}, ${address.country}` : address.label}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPinDropModal(true)}
                      className="text-[13px] font-medium flex-shrink-0 ml-2"
                      style={{ color: '#F7931E' }}
                    >
                      Adjust pin
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed p-4" style={{ borderColor: 'rgba(15,23,42,0.12)', background: 'rgba(15,23,42,0.02)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(15,23,42,0.04)' }}>
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-[13px] text-muted-foreground">Select an address to preview your map pin.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SectionCard>

      {/* Contact Details */}
      <SectionCard>
        <div className="space-y-3">
          <p className="text-[14px] font-semibold text-foreground">Contact Details</p>

          <div className="space-y-1.5">
            <label className={LABEL_CLASS}>Phone</label>
            <PhoneInputWithDialCode value={phone} onChange={setPhone} />
          </div>

          <div style={DIVIDER_STYLE} />

          <div className="space-y-1.5">
            <label className={LABEL_CLASS}>Email</label>
            <input
              type="email"
              value={formData.businessContactEmail}
              onChange={(e) => onFieldChange('businessContactEmail', e.target.value)}
              placeholder="contact@business.com"
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            />
            <p className={HINT_CLASS}>Contact details are shown on your business profile.</p>
          </div>
        </div>
      </SectionCard>

      {/* Booking URL (NEW) */}
      <SectionCard>
        <div className="space-y-2">
          <p className="text-[14px] font-semibold text-foreground">Bookings</p>
          <p className={HINT_CLASS} style={{ marginTop: 0 }}>
            Let golfers book directly from your clbhouz profile.
          </p>
          <label className={LABEL_CLASS}>Booking link</label>
          <input
            type="url"
            value={formData.businessBookingUrl}
            onChange={(e) => onFieldChange('businessBookingUrl', e.target.value)}
            placeholder="https://bookings.yourgolfclub.com"
            className={INPUT_CLASS}
            style={INPUT_STYLE}
          />
          <p className={HINT_CLASS}>
            If you use an online tee sheet (BRS Golf, ClubV1, Golf Now, etc.) paste the booking URL here.
          </p>
        </div>
      </SectionCard>

      {/* Opening Hours (NEW) */}
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
              const entry = openingHours[day] ?? { open: '08:00', close: '18:00', closed: false };
              return (
                <div key={day} className="flex items-center gap-2 min-h-[44px]">
                  <span className="w-10 text-[13px] font-medium text-foreground flex-shrink-0">{day}</span>

                  {entry.closed ? (
                    <span className="flex-1 text-[13px] text-muted-foreground">Closed</span>
                  ) : (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="time"
                        value={entry.open}
                        onChange={(e) => updateDay(day, { open: e.target.value })}
                        className="flex-1 h-9 rounded-lg px-2 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-[#F7931E]/40"
                        style={{ background: 'rgba(15,23,42,0.03)', border: '0.5px solid rgba(15,23,42,0.07)' }}
                      />
                      <span className="text-muted-foreground text-xs">–</span>
                      <input
                        type="time"
                        value={entry.close}
                        onChange={(e) => updateDay(day, { close: e.target.value })}
                        className="flex-1 h-9 rounded-lg px-2 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-[#F7931E]/40"
                        style={{ background: 'rgba(15,23,42,0.03)', border: '0.5px solid rgba(15,23,42,0.07)' }}
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => updateDay(day, { closed: !entry.closed })}
                    className="text-[12px] font-semibold flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-end"
                    style={{ color: entry.closed ? '#F7931E' : '#94A3B8' }}
                  >
                    {entry.closed ? 'Open' : 'Close'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Set all days shortcut */}
          {firstOpenDay && (
            <button
              type="button"
              onClick={() => setAllDays(openingHours[firstOpenDay])}
              className="text-[13px] font-semibold"
              style={{ color: '#F7931E' }}
            >
              + Apply first day to all days
            </button>
          )}
        </div>
      </SectionCard>

      <PinDropModal
        open={showPinDropModal}
        onOpenChange={setShowPinDropModal}
        onConfirm={(val) => { setAddress(val); setAddressError(null); }}
        initialCenter={address?.lat && address?.lng ? { lat: address.lat, lng: address.lng } : undefined}
      />
    </div>
  );
}
