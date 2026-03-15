/**
 * BusinessEditStep2Location — Step 2 of business edit wizard
 * Location, address, map, website, email, phone
 */
import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';
import { AddressAutocomplete, AddressValue } from '@/components/business/AddressAutocomplete';
import { PinDropModal } from '@/components/business/PinDropModal';
import { PhoneInputWithDialCode, PhoneValue } from '@/components/business/PhoneInputWithDialCode';
import { CountrySelector, getCountryCode, getCountryDisplayName } from '@/components/business/CountrySelector';
import { MapPreview } from '@/components/map/MapPreview';

interface BusinessEditStep2Props {
  formData: {
    businessName: string;
    businessWebsite: string;
    businessContactEmail: string;
  };
  onFieldChange: (field: string, value: string) => void;
  address: AddressValue | null;
  setAddress: (val: AddressValue | null) => void;
  countrySelection: string | null;
  setCountrySelection: (val: string | null) => void;
  phone: PhoneValue | null;
  setPhone: (val: PhoneValue | null) => void;
  isClubLinked: boolean;
  businessLocation: string | null;
  addressError: string | null;
  setAddressError: (val: string | null) => void;
}

export function BusinessEditStep2Location({
  formData,
  onFieldChange,
  address,
  setAddress,
  countrySelection,
  setCountrySelection,
  phone,
  setPhone,
  isClubLinked,
  businessLocation,
  addressError,
  setAddressError,
}: BusinessEditStep2Props) {
  const [showPinDropModal, setShowPinDropModal] = useState(false);

  const hasNoContact = !formData.businessWebsite.trim() && !formData.businessContactEmail.trim();

  return (
    <div className="space-y-4 px-4 pb-4 pt-2">
      {/* Card 1: Location */}
      <SectionCard>
        <div className="space-y-3">
          {isClubLinked ? (
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-muted-foreground">
                Location
              </label>
              <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3 text-[15px] text-muted-foreground">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">
                  {address?.label || businessLocation || 'Location unavailable'}
                </span>
                <span className="text-[11px] text-muted-foreground/70">From club data</span>
              </div>
              <p className="text-[12px] text-muted-foreground">
                Contact support to update the location for this linked club.
              </p>
            </div>
          ) : (
            <>
              {/* Country */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-muted-foreground">
                  Country <span className="text-destructive">*</span>
                </label>
                <CountrySelector
                  value={countrySelection}
                  onChange={(name) => {
                    setCountrySelection(name);
                    if (address) setAddress(null);
                  }}
                />
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-muted-foreground">
                  Business address <span className="text-destructive">*</span>
                </label>
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
                {addressError && (
                  <p className="text-[12px] text-destructive">{addressError}</p>
                )}
              </div>

              {/* Map preview */}
              {address?.lat != null && address?.lng != null && Number.isFinite(address.lat) && Number.isFinite(address.lng) ? (
                <div className="rounded-xl border border-border overflow-hidden">
                  <MapPreview
                    lat={address.lat}
                    lng={address.lng}
                    name={formData.businessName || 'Business location'}
                    height={160}
                    zoom={14}
                    markerColor="hsl(38, 92%, 50%)"
                    showExpandButton={false}
                  />
                  <div className="px-3 py-2.5 flex items-center justify-between bg-card border-t border-border">
                    <div className="flex items-center gap-2 text-[13px] min-w-0">
                      <MapPin className="h-4 w-4 text-[#f59e0b] flex-shrink-0" />
                      <span className="truncate text-foreground">
                        {address.city && address.country ? `${address.city}, ${address.country}` : address.label}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPinDropModal(true)}
                      className="text-[13px] font-medium text-[#d97706] flex-shrink-0 ml-2"
                    >
                      Adjust pin
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
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

      {/* Card 2: Contact */}
      <SectionCard>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-muted-foreground">
              Website
            </label>
            <input
              type="url"
              value={formData.businessWebsite}
              onChange={(e) => onFieldChange('businessWebsite', e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full bg-muted border-0 rounded-xl px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/40 focus:bg-background transition-colors"
            />
          </div>

          <div className="h-px bg-border/30" />

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              value={formData.businessContactEmail}
              onChange={(e) => onFieldChange('businessContactEmail', e.target.value)}
              placeholder="contact@business.com"
              className="w-full bg-muted border-0 rounded-xl px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/40 focus:bg-background transition-colors"
            />
          </div>

          <div className="h-px bg-border/30" />

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-muted-foreground">
              Phone
            </label>
            <PhoneInputWithDialCode value={phone} onChange={setPhone} />
            <p className="text-[12px] text-muted-foreground">
              Your contact details are shown on your business profile.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Validation hint */}
      {hasNoContact && (
        <SectionCard className="border-destructive/20 bg-destructive/5">
          <p className="text-[12px] text-muted-foreground">
            Add at least a website or email so golfers can contact you.
          </p>
        </SectionCard>
      )}

      {/* Pin Drop Modal */}
      <PinDropModal
        open={showPinDropModal}
        onOpenChange={setShowPinDropModal}
        onConfirm={(val) => {
          setAddress(val);
          setAddressError(null);
        }}
        initialCenter={address?.lat && address?.lng ? { lat: address.lat, lng: address.lng } : undefined}
      />
    </div>
  );
}
