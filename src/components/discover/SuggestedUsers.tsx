import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuggestedUser {
  id: string;
  displayName: string;
  username: string;
  profileImage: string;
  bio: string;
  followersCount: number;
  isVerified?: boolean;
}

interface SuggestedUsersProps {
  onUserFollow: (userId: string) => void;
}

// Mock suggested users data - at least 25 users
const mockSuggestedUsers: SuggestedUser[] = [
  {
    id: '1',
    displayName: 'Sarah Johnson',
    username: '@sarahjgolf',
    profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612d7c5?w=100&h=100&fit=crop&crop=face',
    bio: 'Weekend warrior golfer',
    followersCount: 1240,
    isVerified: false
  },
  {
    id: '2',
    displayName: 'Mike Chen',
    username: '@mikechengolf',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    bio: 'Scratch golfer & coach',
    followersCount: 3420,
    isVerified: true
  },
  {
    id: '3',
    displayName: 'Emma Wilson',
    username: '@emmawgolf',
    profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    bio: 'Golf fitness enthusiast',
    followersCount: 890,
    isVerified: false
  },
  {
    id: '4',
    displayName: 'David Rodriguez',
    username: '@davidrgolf',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    bio: 'Course photographer',
    followersCount: 2150,
    isVerified: false
  },
  {
    id: '5',
    displayName: 'Lisa Park',
    username: '@lisaparkgolf',
    profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    bio: 'Junior golf instructor',
    followersCount: 1580,
    isVerified: true
  },
  {
    id: '6',
    displayName: 'James Miller',
    username: '@jamesmgolf',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    bio: 'Golf equipment reviewer',
    followersCount: 4230,
    isVerified: true
  },
  {
    id: '7',
    displayName: 'Rachel Green',
    username: '@rachelggolf',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    bio: 'Golf course designer',
    followersCount: 980,
    isVerified: false
  },
  {
    id: '8',
    displayName: 'Alex Thompson',
    username: '@alextgolf',
    profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
    bio: 'PGA Tour analyst',
    followersCount: 6740,
    isVerified: true
  },
  {
    id: '9',
    displayName: 'Nicole Davis',
    username: '@nicoledgolf',
    profileImage: 'https://images.unsplash.com/photo-1557296387-5358ad7997bb?w=100&h=100&fit=crop&crop=face',
    bio: 'Golf mental coach',
    followersCount: 1320,
    isVerified: false
  },
  {
    id: '10',
    displayName: 'Ryan Kim',
    username: '@ryankgolf',
    profileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face',
    bio: 'Golf swing analyst',
    followersCount: 2890,
    isVerified: true
  },
  {
    id: '11',
    displayName: 'Ashley Brown',
    username: '@ashleybgolf',
    profileImage: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop&crop=face',
    bio: 'College golf player',
    followersCount: 750,
    isVerified: false
  },
  {
    id: '12',
    displayName: 'Kevin Lee',
    username: '@kevinlgolf',
    profileImage: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=100&h=100&fit=crop&crop=face',
    bio: 'Golf travel blogger',
    followersCount: 3560,
    isVerified: false
  },
  {
    id: '13',
    displayName: 'Sophia Martinez',
    username: '@sophiamgolf',
    profileImage: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&h=100&fit=crop&crop=face',
    bio: 'Golf fashion influencer',
    followersCount: 4120,
    isVerified: true
  },
  {
    id: '14',
    displayName: 'Tyler Jackson',
    username: '@tylerjgolf',
    profileImage: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop&crop=face',
    bio: 'Golf course vlogger',
    followersCount: 2340,
    isVerified: false
  },
  {
    id: '15',
    displayName: 'Megan White',
    username: '@meganwgolf',
    profileImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop&crop=face',
    bio: 'LPGA hopeful',
    followersCount: 1890,
    isVerified: false
  },
  {
    id: '16',
    displayName: 'Chris Garcia',
    username: '@chrisggolf',
    profileImage: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop&crop=face',
    bio: 'Golf course superintendent',
    followersCount: 670,
    isVerified: false
  },
  {
    id: '17',
    displayName: 'Hannah Clark',
    username: '@hannahcgolf',
    profileImage: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&h=100&fit=crop&crop=face',
    bio: 'Golf academy owner',
    followersCount: 2780,
    isVerified: true
  },
  {
    id: '18',
    displayName: 'Mark Anderson',
    username: '@markagolf',
    profileImage: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=100&h=100&fit=crop&crop=face',
    bio: 'Golf equipment tester',
    followersCount: 1450,
    isVerified: false
  },
  {
    id: '19',
    displayName: 'Jessica Taylor',
    username: '@jessicatgolf',
    profileImage: 'https://images.unsplash.com/photo-1526835746352-0b9da4054862?w=100&h=100&fit=crop&crop=face',
    bio: 'Golf psychology expert',
    followersCount: 3210,
    isVerified: true
  },
  {
    id: '20',
    displayName: 'Brandon Smith',
    username: '@brandonsgolf',
    profileImage: 'https://images.unsplash.com/photo-1503593192-ca8d90d3bbff?w=100&h=100&fit=crop&crop=face',
    bio: 'Golf course architect',
    followersCount: 1120,
    isVerified: false
  },
  {
    id: '21',
    displayName: 'Olivia Johnson',
    username: '@oliviajgolf',
    profileImage: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100&fit=crop&crop=face',
    bio: 'Golf nutrition coach',
    followersCount: 890,
    isVerified: false
  },
  {
    id: '22',
    displayName: 'Daniel Lopez',
    username: '@daniellgolf',
    profileImage: 'https://images.unsplash.com/photo-1495603889488-42d1d66e5523?w=100&h=100&fit=crop&crop=face',
    bio: 'Golf club fitter',
    followersCount: 1560,
    isVerified: false
  },
  {
    id: '23',
    displayName: 'Grace Wang',
    username: '@gracewgolf',
    profileImage: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop&crop=face',
    bio: 'Golf rules official',
    followersCount: 430,
    isVerified: false
  },
  {
    id: '24',
    displayName: 'Jacob Wilson',
    username: '@jacobwgolf',
    profileImage: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=100&h=100&fit=crop&crop=face',
    bio: 'Golf statistician',
    followersCount: 2130,
    isVerified: false
  },
  {
    id: '25',
    displayName: 'Isabella Moore',
    username: '@isabellamgolf',
    profileImage: 'https://images.unsplash.com/photo-1541101767792-f9b2b1c4f127?w=100&h=100&fit=crop&crop=face',
    bio: 'Golf content creator',
    followersCount: 5240,
    isVerified: true
  }
];

const SuggestedUsers: React.FC<SuggestedUsersProps> = ({ onUserFollow }) => {
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());

  const handleFollow = (userId: string) => {
    setFollowedUsers(prev => new Set([...prev, userId]));
    onUserFollow(userId);
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  // Filter out already followed users
  const availableUsers = mockSuggestedUsers.filter(user => !followedUsers.has(user.id));

  if (availableUsers.length === 0) {
    return null; // Hide section when no more suggestions
  }

  return (
    <div className="px-4 py-3">
      <div className="md:container md:mx-auto md:px-0">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Suggested for you</h3>
          <span className="text-xs text-gray-500">{availableUsers.length} suggestions</span>
        </div>

        {/* Horizontal Scrollable User Cards */}
        <div className="flex overflow-x-auto scrollbar-hide gap-3 pb-2">
          {availableUsers.map((user) => (
            <div
              key={user.id}
              className="flex-shrink-0 w-28 bg-white rounded-lg border border-gray-200 p-3 text-center"
            >
              {/* Profile Image */}
              <div className="relative mb-2">
                <img
                  src={user.profileImage}
                  alt={user.displayName}
                  className="w-16 h-16 rounded-full mx-auto object-cover"
                />
                {user.isVerified && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-900 truncate mb-1">
                  {user.displayName}
                </h4>
                <p className="text-xs text-gray-500 truncate mb-1">
                  {user.username}
                </p>
                <p className="text-xs text-gray-400 leading-tight line-clamp-2 mb-1">
                  {user.bio}
                </p>
                <span className="text-xs text-gray-400">
                  {formatFollowers(user.followersCount)} followers
                </span>
              </div>

              {/* Follow Button */}
              <button
                onClick={() => handleFollow(user.id)}
                className="text-black text-xs font-medium hover:text-gray-700 transition-colors duration-150"
              >
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuggestedUsers;