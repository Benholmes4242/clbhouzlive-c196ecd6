
import React from 'react';
import { Building, Phone, Globe, MapPin } from 'lucide-react';

interface BusinessInfoSectionProps {
  profile: any;
  bio: string;
}

const BusinessInfoSection: React.FC<BusinessInfoSectionProps> = ({
  profile,
  bio
}) => {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-3">Business Information</h3>
      <div className="space-y-2 text-sm text-muted-foreground">
        {profile?.business_name && (
          <div className="flex items-center justify-center gap-2">
            <Building className="w-4 h-4" />
            <span>{profile.business_name}</span>
          </div>
        )}
        {profile?.phone && (
          <div className="flex items-center justify-center gap-2">
            <Phone className="w-4 h-4" />
            <span>{profile.phone}</span>
          </div>
        )}
        {profile?.website_url && (
          <div className="flex items-center justify-center gap-2">
            <Globe className="w-4 h-4" />
            <a 
              href={profile.website_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {profile.website_url}
            </a>
          </div>
        )}
        {profile?.location && (
          <div className="flex items-center justify-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{profile.location}</span>
          </div>
        )}
        
        {/* About Us section for business profiles - with significant spacing to match profile photo gap */}
        {bio && (
          <div className="mt-20 text-center">
            <h4 className="text-base font-semibold mb-2 text-foreground">About Us</h4>
            <p className="text-sm max-w-md mx-auto">{bio}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessInfoSection;
