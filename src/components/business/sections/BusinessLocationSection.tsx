import { MapPin, Globe, Mail } from 'lucide-react';
import { BusinessSectionHeader } from '../BusinessSectionHeader';
import { LocationAutocomplete, LocationValue } from '../LocationAutocomplete';
import { PhoneInputWithDialCode, PhoneValue } from '../PhoneInputWithDialCode';

interface BusinessLocationSectionProps {
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

export function BusinessLocationSection({
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
}: BusinessLocationSectionProps) {
  return (
    <div>
      <BusinessSectionHeader
        icon={MapPin}
        title="Location & Contact"
        description="Help golfers find and reach you"
      />
      
      {/* Location */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-[#1e293b] mb-1.5">
          Location <span className="text-red-500">*</span>
        </label>
        
        {isGolfClub && clubLocation ? (
          <div className="flex items-center gap-2 h-12 px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm text-[#64748b]">
            <MapPin className="w-4 h-4" />
            <span className="flex-1">{clubLocation}</span>
            <span className="text-xs text-[#94a3b8]">From club data</span>
          </div>
        ) : (
          <LocationAutocomplete
            value={location}
            onChange={setLocation}
            placeholder="Search for a city..."
          />
        )}
        <p className="text-xs text-[#64748b] mt-1.5">
          {isGolfClub && clubLocation 
            ? "Location is linked to the club record."
            : "Choose your main base so golfers know where to find you."
          }
        </p>
      </div>
      
      {/* Website */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-[#1e293b] mb-1.5">
          Website
        </label>
        <div className="relative">
          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://yourwebsite.com"
            className="w-full h-12 pl-11 pr-4 bg-white border border-[#e2e8f0] rounded-xl text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#e2e8f0] focus:border-[#e2e8f0]"
          />
        </div>
      </div>
      
      {/* Email */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-[#1e293b] mb-1.5">
          Contact email
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@business.com"
            className="w-full h-12 pl-11 pr-4 bg-white border border-[#e2e8f0] rounded-xl text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#e2e8f0] focus:border-[#e2e8f0]"
          />
        </div>
      </div>
      
      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-[#1e293b] mb-1.5">
          Phone
        </label>
        <PhoneInputWithDialCode
          value={phone}
          onChange={setPhone}
        />
        <p className="text-xs text-[#64748b] mt-1.5">
          Your contact details are only shown on your business profile.
        </p>
      </div>
      
      {/* Validation hint */}
      {!website.trim() && !email.trim() && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs text-amber-700">
            Add at least a website or email so golfers can contact you.
          </p>
        </div>
      )}
    </div>
  );
}
