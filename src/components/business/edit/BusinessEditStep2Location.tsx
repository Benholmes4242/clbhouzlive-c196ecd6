/**
 * BusinessEditStep2Location — Step 2 of business edit wizard
 * Location, address, map, website, email, phone
 */
import React, { useState } from 'react';
import { MapPin, Globe, Mail, Phone, Flag, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <div className="h-full overflow-y-auto overscroll-contain">
      <div className="px-4 py-6 max-w-xl mx-auto space-y-6">
        {/* Section icon + heading */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#C1A84C]/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-[#C1A84C]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Location & Contact</h2>
            <p className="text-sm text-muted-foreground">Help golfers find and reach you</p>
          </div>
        </div>

        {/* Location */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          {isClubLinked ? (
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground font-medium">Location</Label>
              <div className="flex items-center gap-2 px-4 min-h-[48px] border border-border rounded-lg bg-muted/50">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-foreground">
                  {address?.label || businessLocation || 'Location unavailable'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Contact support to update the location for this linked club.
              </p>
            </div>
          ) : (
            <>
              {/* Country */}
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground font-medium">
                  Country <span className="text-red-500">*</span>
                </Label>
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
                <Label className="text-sm text-foreground font-medium">
                  Business address <span className="text-red-500">*</span>
                </Label>
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

              {/* Map preview */}
              <div>
                {address?.lat != null && address?.lng != null && Number.isFinite(address.lat) && Number.isFinite(address.lng) ? (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <MapPreview
                      lat={address.lat}
                      lng={address.lng}
                      name={formData.businessName || 'Business location'}
                      height={160}
                      zoom={14}
                      markerColor="#F7931E"
                      showExpandButton={false}
                    />
                    <div className="px-3 py-2.5 flex items-center justify-between bg-card border-t border-border">
                      <div className="flex items-center gap-2 text-sm min-w-0">
                        <MapPin className="h-4 w-4 text-[#C1A84C] flex-shrink-0" />
                        <span className="truncate text-foreground">
                          {address.city && address.country ? `${address.city}, ${address.country}` : address.label}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPinDropModal(true)}
                        className="text-xs text-[#C1A84C] hover:underline flex-shrink-0 ml-2 font-medium"
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
                      <p className="text-sm text-muted-foreground">Select an address to preview your map pin.</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Contact info */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-foreground font-medium flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              Website
            </Label>
            <Input
              value={formData.businessWebsite}
              onChange={(e) => onFieldChange('businessWebsite', e.target.value)}
              placeholder="https://yourwebsite.com"
              className="min-h-[48px] rounded-lg border-border bg-card text-foreground px-4 focus:ring-2 focus:ring-[#C1A84C]/30 focus:border-[#C1A84C]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-foreground font-medium flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Contact email
            </Label>
            <Input
              type="email"
              value={formData.businessContactEmail}
              onChange={(e) => onFieldChange('businessContactEmail', e.target.value)}
              placeholder="contact@business.com"
              className="min-h-[48px] rounded-lg border-border bg-card text-foreground px-4 focus:ring-2 focus:ring-[#C1A84C]/30 focus:border-[#C1A84C]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-foreground font-medium flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              Phone
            </Label>
            <PhoneInputWithDialCode value={phone} onChange={setPhone} />
          </div>

          <p className="text-xs text-muted-foreground">
            Your contact details are only shown on your business profile.
          </p>

          {hasNoContact && (
            <div className="flex items-start gap-2 rounded-lg bg-[#C1A84C]/10 p-3">
              <AlertTriangle className="w-4 h-4 text-[#C1A84C] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-foreground">
                Add a website or email so golfers can contact you.
              </p>
            </div>
          )}
        </div>
      </div>

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
