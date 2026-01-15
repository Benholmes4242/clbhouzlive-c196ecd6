import React from 'react';
import { Calendar, Eye, Users, Film, Play, MapPin, Globe } from 'lucide-react';
import type { CreatorStats } from '@/hooks/useCreatorStats';

interface CreatorPage {
  id: string;
  display_name: string;
  slug: string;
  bio?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  location_city?: string | null;
  location_country?: string | null;
  social_links?: Record<string, string> | null;
  categories?: string[] | null;
  created_at?: string;
  is_public?: boolean;
}

interface CreatorAboutTabProps {
  creatorPage: CreatorPage | null | undefined;
  stats?: CreatorStats | null;
  isOwnProfile?: boolean;
}

/**
 * About tab for Creator Page
 * Shows full bio, stats, and creator details
 * Uses creatorPage data, NOT personal profile data
 */
export const CreatorAboutTab: React.FC<CreatorAboutTabProps> = ({
  creatorPage,
  stats,
  isOwnProfile,
}) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long',
      year: 'numeric'
    });
  };

  const location = [creatorPage?.location_city, creatorPage?.location_country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-6">
      {/* Description / Bio */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
        {creatorPage?.bio ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {creatorPage.bio}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            {isOwnProfile 
              ? "Add a description in your creator settings to tell viewers about your channel."
              : "This creator hasn't added a description yet."
            }
          </p>
        )}
      </section>

      {/* Stats Grid */}
      {stats && (
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-3">Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Users}
              label="Subscribers"
              value={formatNumber(stats.followerCount)}
            />
            <StatCard
              icon={Eye}
              label="Total views"
              value={formatNumber(stats.totalViews)}
            />
            <StatCard
              icon={Film}
              label="Videos"
              value={stats.videoCount.toString()}
            />
            <StatCard
              icon={Play}
              label="Shorts"
              value={stats.shortCount.toString()}
            />
          </div>
        </section>
      )}

      {/* Details */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">Details</h3>
        <div className="space-y-3">
          {/* Location */}
          {location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{location}</span>
            </div>
          )}

          {/* Social Links */}
          {creatorPage?.social_links && Object.keys(creatorPage.social_links).length > 0 && (
            Object.entries(creatorPage.social_links).map(([platform, url]) => (
              url && (
                <div key={platform} className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <a 
                    href={url.startsWith('http') ? url : `https://${url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline capitalize"
                  >
                    {platform}
                  </a>
                </div>
              )
            ))
          )}

          {/* Joined date */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Joined {formatDate(creatorPage?.created_at)}
            </span>
          </div>
        </div>
      </section>

      {/* Categories */}
      {creatorPage?.categories && creatorPage.categories.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-3">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {creatorPage.categories.map((cat) => (
              <span 
                key={cat}
                className="px-3 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full"
              >
                {cat}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Empty state if minimal info */}
      {!creatorPage?.bio && !location && !stats && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            No additional information available.
          </p>
        </div>
      )}
    </div>
  );
};

interface StatCardProps {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
    <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
      <Icon className="w-5 h-5 text-muted-foreground" />
    </div>
    <div>
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  </div>
);

export default CreatorAboutTab;
