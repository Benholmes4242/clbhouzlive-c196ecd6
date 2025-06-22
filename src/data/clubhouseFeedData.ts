
export const featuredMoments = [
  {
    id: '1',
    title: 'Incredible hole-in-one at Pebble Beach',
    user: 'ProGolfer_Mike',
    timeAgo: '2 hours ago',
    image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&h=400&fit=crop',
    type: 'video' as const,
    duration: '0:45'
  },
  {
    id: '2',
    title: 'Perfect approach shot at Augusta',
    user: 'GolfPro_Sarah',
    timeAgo: '4 hours ago',
    image: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=600&h=400&fit=crop',
    type: 'video' as const,
    duration: '1:20'
  },
  {
    id: '3',
    title: 'Amazing eagle putt at St Andrews',
    user: 'LinksMaster',
    timeAgo: '6 hours ago',
    image: 'https://images.unsplash.com/photo-1587174486073-ae5e5ccd3ab6?w=600&h=400&fit=crop',
    type: 'video' as const,
    duration: '0:32'
  }
];

export const courseHighlights = [
  { id: '1', name: 'Augusta National', location: 'Georgia, USA', posts: 247, image: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=300&h=200&fit=crop' },
  { id: '2', name: 'St. Andrews', location: 'Scotland', posts: 189, image: 'https://images.unsplash.com/photo-1587174486073-ae5e5ccd3ab6?w=300&h=200&fit=crop' },
  { id: '3', name: 'Pebble Beach', location: 'California, USA', posts: 156, image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=200&fit=crop' },
  { id: '4', name: 'Royal County Down', location: 'Northern Ireland', posts: 134, image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=300&h=200&fit=crop' },
];

export const topPlayers = [
  { 
    id: '1', 
    name: 'Sarah Chen', 
    bio: '2 HCP • Teaching Pro', 
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b2f44?w=100&h=100&fit=crop',
    contentImage: 'https://images.unsplash.com/photo-1587174486073-ae5e5ccd3ab6?w=600&h=400&fit=crop',
    type: 'image' as const
  },
  { 
    id: '2', 
    name: 'Marcus Rodriguez', 
    bio: '5 HCP • Course Designer', 
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    contentImage: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=400&fit=crop',
    type: 'video' as const,
    duration: '2:15'
  },
  { 
    id: '3', 
    name: 'Emma Wilson', 
    bio: '3 HCP • Golf Instructor', 
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    contentImage: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&h=400&fit=crop',
    type: 'video' as const,
    duration: '1:45'
  },
];

export const trendingTips = [
  { id: '1', title: 'Perfect your putting stance', tag: 'Putting', user: 'CoachJim', image: 'https://images.unsplash.com/photo-1587174486073-ae5e5ccd3ab6?w=250&h=200&fit=crop', type: 'video' as const },
  { id: '2', title: 'Driver distance secrets', tag: 'Driving', user: 'LongDrive_Pro', image: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=250&h=200&fit=crop', type: 'image' as const },
  { id: '3', title: 'Bunker escape technique', tag: 'BunkerPlay', user: 'SandMaster', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=250&h=200&fit=crop', type: 'video' as const },
];

export const clubSpotlight = [
  { 
    id: '1', 
    name: 'Pine Valley Golf Academy', 
    logo: 'https://images.unsplash.com/photo-1556909114-6c3bd9b1b689?w=80&h=80&fit=crop',
    post: 'New summer training programs available',
    image: 'https://images.unsplash.com/photo-1556909114-f6e34c7aec6b?w=300&h=200&fit=crop'
  },
  { 
    id: '2', 
    name: 'Riverside Country Club', 
    logo: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=80&h=80&fit=crop',
    post: 'Championship tournament this weekend',
    image: 'https://images.unsplash.com/photo-1587174486073-ae5e5ccd3ab6?w=300&h=200&fit=crop'
  },
];
