/**
 * BusinessLocationStep - Step 2: Location, website, email, phone
 */
import { MapPin } from 'lucide-react';
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';
import { LocationAutocomplete, LocationValue } from '@/components/business/LocationAutocomplete';
import { PhoneInputWithDialCode, PhoneValue } from '@/components/business/PhoneInputWithDialCode';

interface BusinessLocationStepProps {
  location: LocationValue | null;
  setLocation: (location: LocationValue | null) => void;
  website: string;
  setWebsite: (website: string) => void;
  email: string;
  setEmail: (email: string) => void;
  phone: PhoneValue | null;
  setPhone: (phone: PhoneValue | null) => void;
  isGolfClub: boolean;
  clubLocation?: string;
}

export function BusinessLocationStep({
  location,
  setLocation,
  website,
  setWebsite,
  email,
  setEmail,
  phone,
  setPhone,
  isGolfClub,
  clubLocation,
}: BusinessLocationStepProps) {
  return (
    <div className="space-y-4 px-4 pb-4 pt-2">
      {/* Card 1: Location */}
      <SectionCard>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-muted-foreground">
              Location <span className="text-destructive">*</span>
            </label>

            {isGolfClub && clubLocation ? (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-[15px] text-muted-foreground" style={{ background: 'rgba(15,23,42,0.03)', border: '0.5px solid rgba(15,23,42,0.07)' }}>
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{clubLocation}</span>
                <span className="text-[11px] text-muted-foreground/70">From club data</span>
              </div>
            ) : (
              <LocationAutocomplete
                value={location}
                onChange={setLocation}
                placeholder="Search for a city..."
              />
            )}
            <p className="text-[12px] text-muted-foreground">
              {isGolfClub && clubLocation
                ? 'Location is linked to the club record.'
                : 'Choose your main base so golfers know where to find you.'}
            </p>
          </div>
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
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full rounded-xl px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F7931E]/40 transition-colors"
              style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}
            />
          </div>

          <div style={{ height: '0.5px', background: 'rgba(15,23,42,0.07)' }} />

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@business.com"
              className="w-full rounded-xl px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F7931E]/40 transition-colors"
              style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}
            />
          </div>

          <div style={{ height: '0.5px', background: 'rgba(15,23,42,0.07)' }} />

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-muted-foreground">
              Phone
            </label>
            <PhoneInputWithDialCode
              value={phone}
              onChange={setPhone}
            />
            <p className="text-[12px] text-muted-foreground">
              Your contact details are only shown on your business profile.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Validation hint */}
      {!website.trim() && !email.trim() && (
        <SectionCard className="border-destructive/20 bg-destructive/5">
          <p className="text-[12px] text-muted-foreground">
            Add at least a website or email so golfers can contact you.
          </p>
        </SectionCard>
      )}
    </div>
  );
}

export default BusinessLocationStep;
