import React from 'react';
import { Globe, Mail, Phone, MapPin, Building2 } from 'lucide-react';
import { BUSINESS_CATEGORIES } from '@/types/profile';

interface ProfileAboutSectionProps {
  profile: {
    bio?: string | null;
    home_club?: string | null;
    eg_handicap_index?: number | null;
    // Business fields
    business_bio?: string | null;
    business_category?: string | null;
    business_location?: string | null;
    business_website?: string | null;
    business_contact_email?: string | null;
    business_contact_phone?: string | null;
  } | null;
  isPersonal: boolean;
}

/**
 * ProfileAboutSection - Displays profile bio and details
 * Personal: Bio, home club, handicap
 * Business: Business bio, category, location, website, contact info
 */
export const ProfileAboutSection: React.FC<ProfileAboutSectionProps> = ({
  profile,
  isPersonal,
}) => {
  if (!profile) return null;

  // Get category label for business profiles
  const getCategoryLabel = (category: string | null | undefined): string => {
    if (!category) return '';
    const found = BUSINESS_CATEGORIES.find(c => c.value === category);
    return found ? found.label : category;
  };

  // Format website URL for display
  const formatWebsiteUrl = (url: string) => {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  };
  
  // Ensure URL has protocol for href
  const getWebsiteHref = (url: string) => {
    return url.startsWith('http') ? url : `https://${url}`;
  };

  if (isPersonal) {
    // Personal profile about section
    const hasBio = !!profile.bio;
    const hasHomeClub = !!profile.home_club;
    const hasHandicap = profile.eg_handicap_index != null;

    if (!hasBio && !hasHomeClub && !hasHandicap) return null;

    return (
      <div className="space-y-3 p-4 bg-muted/30 rounded-sq-md">
        {profile.bio && (
          <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
        )}

        {(hasHomeClub || hasHandicap) && (
          <dl className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            {profile.home_club && (
              <div>
                <dt className="font-medium text-foreground">Home club</dt>
                <dd>{profile.home_club}</dd>
              </div>
            )}
            {profile.eg_handicap_index != null && (
              <div>
                <dt className="font-medium text-foreground">Handicap</dt>
                <dd>{profile.eg_handicap_index}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
    );
  }

  // Business profile about section
  const businessBio = profile.business_bio || profile.bio;
  const hasBusinessBio = !!businessBio;
  const hasCategory = !!profile.business_category;
  const hasLocation = !!profile.business_location;
  const hasWebsite = !!profile.business_website;
  const hasContact = !!profile.business_contact_email || !!profile.business_contact_phone;

  if (!hasBusinessBio && !hasCategory && !hasLocation && !hasWebsite && !hasContact) {
    return null;
  }

  return (
    <div className="space-y-3 p-4 bg-muted/30 rounded-sq-md">
      {businessBio && (
        <p className="text-sm text-foreground leading-relaxed">{businessBio}</p>
      )}

      <dl className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
        {profile.business_category && (
          <div className="flex items-start gap-2">
            <Building2 className="w-3.5 h-3.5 mt-0.5 text-muted-foreground" />
            <div>
              <dt className="font-medium text-foreground">Category</dt>
              <dd>{getCategoryLabel(profile.business_category)}</dd>
            </div>
          </div>
        )}
        
        {profile.business_location && (
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 mt-0.5 text-muted-foreground" />
            <div>
              <dt className="font-medium text-foreground">Location</dt>
              <dd>{profile.business_location}</dd>
            </div>
          </div>
        )}
        
        {profile.business_website && (
          <div className="col-span-2 flex items-start gap-2">
            <Globe className="w-3.5 h-3.5 mt-0.5 text-muted-foreground" />
            <div>
              <dt className="font-medium text-foreground">Website</dt>
              <dd className="truncate">
                <a
                  href={getWebsiteHref(profile.business_website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 underline underline-offset-2"
                >
                  {formatWebsiteUrl(profile.business_website)}
                </a>
              </dd>
            </div>
          </div>
        )}
        
        {(profile.business_contact_email || profile.business_contact_phone) && (
          <div className="col-span-2 flex items-start gap-2">
            <Mail className="w-3.5 h-3.5 mt-0.5 text-muted-foreground" />
            <div>
              <dt className="font-medium text-foreground">Contact</dt>
              <dd className="flex flex-wrap gap-x-3 gap-y-1">
                {profile.business_contact_email && (
                  <a 
                    href={`mailto:${profile.business_contact_email}`}
                    className="text-primary hover:text-primary/80"
                  >
                    {profile.business_contact_email}
                  </a>
                )}
                {profile.business_contact_phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {profile.business_contact_phone}
                  </span>
                )}
              </dd>
            </div>
          </div>
        )}
      </dl>
    </div>
  );
};

export default ProfileAboutSection;
