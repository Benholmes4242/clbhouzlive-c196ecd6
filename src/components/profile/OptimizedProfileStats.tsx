import React from 'react';

interface ProfileStatsProps {
  followers: number;
  following: number;
  courses: number;
  className?: string;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const ProfileStats = React.memo<ProfileStatsProps>(({ 
  followers, 
  following, 
  courses, 
  className = '' 
}) => {
  const formattedStats = React.useMemo(() => ({
    followers: formatNumber(followers),
    following: formatNumber(following),
    courses: formatNumber(courses),
  }), [followers, following, courses]);

  return (
    <div className={`flex justify-center gap-8 ${className}`}>
      <div className="text-center">
        <div className="text-2xl font-semibold text-foreground">
          {formattedStats.followers}
        </div>
        <div className="text-sm text-muted-foreground">Followers</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-semibold text-foreground">
          {formattedStats.following}
        </div>
        <div className="text-sm text-muted-foreground">Following</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-semibold text-foreground">
          {formattedStats.courses}
        </div>
        <div className="text-sm text-muted-foreground">Courses</div>
      </div>
    </div>
  );
});

ProfileStats.displayName = 'ProfileStats';

interface ProfileActionsProps {
  isFollowing?: boolean;
  onFollow?: () => void;
  onMessage?: () => void;
  onEdit?: () => void;
  showEdit?: boolean;
  className?: string;
}

export const ProfileActions = React.memo<ProfileActionsProps>(({ 
  isFollowing, 
  onFollow, 
  onMessage, 
  onEdit,
  showEdit = false,
  className = '' 
}) => {
  const actionButtons = React.useMemo(() => {
    const buttons = [];
    
    if (showEdit && onEdit) {
      buttons.push({ 
        id: 'edit', 
        label: 'Edit Profile', 
        onClick: onEdit,
        variant: 'default' as const
      });
    } else {
      if (onFollow) {
        buttons.push({ 
          id: 'follow', 
          label: isFollowing ? 'Following' : 'Follow', 
          onClick: onFollow,
          variant: isFollowing ? 'outline' : 'default' as const
        });
      }
      if (onMessage) {
        buttons.push({ 
          id: 'message', 
          label: 'Message', 
          onClick: onMessage,
          variant: 'outline' as const
        });
      }
    }
    
    return buttons;
  }, [isFollowing, onFollow, onMessage, onEdit, showEdit]);

  return (
    <div className={`flex gap-3 ${className}`}>
      {actionButtons.map((button) => (
        <button
          key={button.id}
          onClick={button.onClick}
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            button.variant === 'default'
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'border border-border bg-background hover:bg-accent'
          }`}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
});

ProfileActions.displayName = 'ProfileActions';