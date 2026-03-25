
import React from 'react';
import { Instagram, Youtube } from 'lucide-react';

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.95a8.16 8.16 0 0 0 4.77 1.52V7.03a4.85 4.85 0 0 1-1-.34z"/>
    </svg>
  );
}

interface ProfileHeaderProps {
  displayName: string;
  username: string;
  profileId?: string;
  bio: string;
  profileUsername?: string;
  homeClubName?: string | null;
  instagramHandle?: string | null;
  twitterHandle?: string | null;
  tiktokHandle?: string | null;
  youtubeHandle?: string | null;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  displayName,
  username,
  profileId,
  bio,
  profileUsername,
  homeClubName,
  instagramHandle,
  twitterHandle,
  tiktokHandle,
  youtubeHandle,
}) => {
  const hasSocials = !!(instagramHandle || twitterHandle || tiktokHandle || youtubeHandle);

  return (
    <div className="text-center space-y-2">
      <div className="mt-0">
        <h1 className="font-display text-2xl font-bold text-foreground">{displayName}</h1>
      </div>
      
      {/* Home Club - shown under name with secondary hierarchy */}
      {homeClubName && (
        <p className="text-sm text-muted-foreground/80">{homeClubName}</p>
      )}
      
      {/* Show username for all personal profiles */}
      {username && (
        <p className="font-display text-foreground text-lg">{username}</p>
      )}
      
      {/* Bio - Show for all personal profiles */}
      {bio && (
        <p className="text-sm text-muted-foreground max-w-md mx-auto">{bio}</p>
      )}

      {/* Social links */}
      {hasSocials && (
        <div className="flex items-center justify-center gap-4 flex-wrap pt-1">
          {instagramHandle && (
            <a
              href={`https://instagram.com/${instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>@{instagramHandle}</span>
            </a>
          )}
          {twitterHandle && (
            <a
              href={`https://x.com/${twitterHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <XIcon className="w-3.5 h-3.5" />
              <span>@{twitterHandle}</span>
            </a>
          )}
          {tiktokHandle && (
            <a
              href={`https://tiktok.com/@${tiktokHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <TikTokIcon className="w-3.5 h-3.5" />
              <span>@{tiktokHandle}</span>
            </a>
          )}
          {youtubeHandle && (
            <a
              href={`https://youtube.com/@${youtubeHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Youtube className="w-3.5 h-3.5" />
              <span>{youtubeHandle}</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileHeader;
