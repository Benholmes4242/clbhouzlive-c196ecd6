import React from 'react';

interface UserProfile {
  id: string;
  header_photo_url?: string;
  cover_photo_url?: string;
  background_image_url?: string;
  desktop_crop_x?: number;
  desktop_crop_y?: number;
  desktop_crop_width?: number;
  desktop_crop_height?: number;
}

interface ResponsiveHeroSectionProps {
  profile: UserProfile | null;
}

const ResponsiveHeroSection: React.FC<ResponsiveHeroSectionProps> = ({ profile }) => {
  // Determine the best image to use for the hero background
  const getHeroImage = () => {
    return profile?.header_photo_url || 
           profile?.cover_photo_url || 
           profile?.background_image_url || 
           '/placeholder.svg';
  };

  // Calculate object position based on crop data
  const getObjectPosition = () => {
    if (profile?.desktop_crop_x !== undefined && profile?.desktop_crop_y !== undefined) {
      const x = (profile.desktop_crop_x / (profile.desktop_crop_width || 100)) * 100;
      const y = (profile.desktop_crop_y / (profile.desktop_crop_height || 100)) * 100;
      return `${x}% ${y}%`;
    }
    return 'center center';
  };

  return (
    <div 
      className="relative w-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/40"
      style={{ height: 'var(--hero-h)' }}
    >
      <img
        src={getHeroImage()}
        alt="Profile header"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: getObjectPosition() }}
        loading="eager"
      />
      
      {/* Gradient overlay for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      
      {/* Optional decorative elements */}
      <div className="absolute inset-0 bg-black/10" />
    </div>
  );
};

export default ResponsiveHeroSection;