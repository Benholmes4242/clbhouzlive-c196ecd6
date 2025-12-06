import React from 'react';
import { cn } from '@/lib/utils';

interface ProfileAvatarSquareProps {
  photoUrl: string | null | undefined;
  displayName: string;
  size?: number; // Size in pixels (default 110)
  onClick?: () => void;
}

/**
 * ProfileAvatarSquare - Rounded square avatar per spec
 * Shape: Rounded square (18-22px radius)
 * Size: 110x110px default
 * Border: 3px transparent
 * Drop shadow for depth
 */
const ProfileAvatarSquare: React.FC<ProfileAvatarSquareProps> = ({
  photoUrl,
  displayName,
  size = 110,
  onClick,
}) => {
  const initials = displayName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const fallbackFontSize = Math.round(size * 0.28);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative overflow-hidden transition-transform duration-200',
        onClick && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
      )}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '20px',
        border: '3px solid transparent',
        boxShadow: '0px 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={displayName}
          className="w-full h-full object-cover"
          loading="eager"
          decoding="async"
          style={{ borderRadius: '17px' }}
        />
      ) : (
        <div 
          className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground font-semibold"
          style={{ fontSize: `${fallbackFontSize}px`, borderRadius: '17px' }}
        >
          {initials}
        </div>
      )}
    </button>
  );
};

export default ProfileAvatarSquare;
