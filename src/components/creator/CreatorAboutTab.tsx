import React from 'react';
import { Calendar, Eye, Users, Film, Play } from 'lucide-react';
import type { CreatorStats } from '@/hooks/useCreatorStats';

interface UserProfile {
  id: string;
  display_name?: string | null;
  username?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  created_at?: string;
  profile_photo_url?: string | null;
  header_photo_url?: string | null;
}

interface CreatorAboutTabProps {
  profile: UserProfile;
  stats?: CreatorStats | null;
  isOwnProfile?: boolean;
}

/**
 * About tab for Creator Page
 * Shows full bio, stats, and creator details
 */
export const CreatorAboutTab: React.FC<CreatorAboutTabProps> = ({
  profile,
  stats,
  isOwnProfile,
}) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Description / Bio */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
        {profile.bio ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {profile.bio}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            {isOwnProfile 
              ? "Add a bio in your profile settings to tell viewers about yourself."
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
          {profile.location && (
            <DetailRow label="Location" value={profile.location} />
          )}

          {/* Website */}
          {profile.website && (
            <DetailRow 
              label="Website" 
              value={
                <a 
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              } 
            />
          )}

          {/* Joined date */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Joined {formatDate(stats?.joinedAt || profile.created_at)}
            </span>
          </div>
        </div>
      </section>
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

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => (
  <div className="flex items-baseline gap-2 text-sm">
    <span className="text-muted-foreground min-w-[80px]">{label}:</span>
    <span className="text-foreground">{value}</span>
  </div>
);

export default CreatorAboutTab;
