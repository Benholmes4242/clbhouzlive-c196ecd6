// src/mocks/friendsCoursesMock.ts
import { formatISO } from 'date-fns';

const now = new Date();
const daysAgo = (n: number) =>
  formatISO(new Date(now.getTime() - n * 24 * 60 * 60 * 1000));

/**
 * CRAZY BUSY MONTH MOCK
 *
 * Goal:
 * - 15+ friends in the ecosystem
 * - 20+ different courses
 * - 80–120 recent rounds spread over the last 30 days
 * - Enough volume for:
 *   - Friends snapshot card to look "full"
 *   - Friends Activity leaderboard to show a solid Top 10
 *   - Next Courses / Next Rounds pagination to have multiple pages
 */

const mockFriends = [
  {
    id: 'andrew',
    name: 'Andrew Yetzis',
    username: 'andrew',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
  },
  {
    id: 'sarah',
    name: 'Sarah Miles',
    username: 'sarah',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  },
  {
    id: 'james',
    name: 'James Porter',
    username: 'james',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
  },
  {
    id: 'chris',
    name: 'Chris Walker',
    username: 'chris',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  },
  {
    id: 'emma',
    name: 'Emma Collins',
    username: 'emma',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
  },
  {
    id: 'lucas',
    name: 'Lucas Brown',
    username: 'lucas',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
  },
  {
    id: 'olivia',
    name: 'Olivia Green',
    username: 'olivia',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
  },
  {
    id: 'matt',
    name: 'Matt Turner',
    username: 'matt',
    avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200&h=200&fit=crop',
  },
  {
    id: 'hannah',
    name: 'Hannah Price',
    username: 'hannah',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop',
  },
  {
    id: 'tom',
    name: 'Tom Hughes',
    username: 'tom',
    avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop',
  },
  {
    id: 'alex',
    name: 'Alex Shaw',
    username: 'alex',
    avatar: 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=200&h=200&fit=crop',
  },
  {
    id: 'kate',
    name: 'Kate Wilson',
    username: 'kate',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&h=200&fit=crop',
  },
  {
    id: 'ben',
    name: 'Ben Knight',
    username: 'ben',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop',
  },
  {
    id: 'zoe',
    name: 'Zoe Harris',
    username: 'zoe',
    avatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&h=200&fit=crop',
  },
  {
    id: 'liam',
    name: 'Liam Murphy',
    username: 'liam',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop',
  },
];

const mockCourses = [
  {
    id: 'mock-rdc',
    name: 'Royal County Down (Championship)',
    country: 'Northern Ireland',
    subCountry: 'Down',
    thumbnail: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=600&fit=crop',
    memberships: ['world-top-100', 'gb-ireland-top-100'],
  },
  {
    id: 'mock-pine-valley',
    name: 'Pine Valley Golf Club',
    country: 'USA',
    subCountry: 'New Jersey',
    thumbnail: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop',
    memberships: ['world-top-100', 'usa-top-100'],
  },
  {
    id: 'mock-pebble',
    name: 'Pebble Beach Golf Links',
    country: 'USA',
    subCountry: 'California',
    thumbnail: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=800&h=600&fit=crop',
    memberships: ['world-top-100', 'usa-top-100'],
  },
  {
    id: 'mock-ballybunion',
    name: 'Ballybunion Golf Club (Old)',
    country: 'Ireland',
    subCountry: 'Kerry',
    thumbnail: 'https://images.unsplash.com/photo-1591491718746-47c47a6d7a2c?w=800&h=600&fit=crop',
    memberships: ['gb-ireland-top-100', 'world-top-100'],
  },
  {
    id: 'mock-dornoch',
    name: 'Royal Dornoch Golf Club (Championship)',
    country: 'Scotland',
    subCountry: 'Highlands',
    thumbnail: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop&q=80',
    memberships: ['gb-ireland-top-100', 'world-top-100'],
  },
  {
    id: 'mock-kingsbarns',
    name: 'Kingsbarns Golf Links',
    country: 'Scotland',
    subCountry: 'Fife',
    thumbnail: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=600&fit=crop&q=80',
    memberships: ['gb-ireland-top-100', 'world-top-100'],
  },
  {
    id: 'mock-sunningdale-old',
    name: 'Sunningdale Golf Club (Old)',
    country: 'England',
    subCountry: 'Berkshire',
    thumbnail: 'https://images.unsplash.com/photo-1593111774240-d529f12995a8?w=800&h=600&fit=crop',
    memberships: ['gb-ireland-top-100'],
  },
  {
    id: 'mock-sunningdale-new',
    name: 'Sunningdale Golf Club (New)',
    country: 'England',
    subCountry: 'Berkshire',
    thumbnail: 'https://images.unsplash.com/photo-1593111774240-d529f12995a8?w=800&h=600&fit=crop&q=85',
    memberships: ['gb-ireland-top-100'],
  },
  {
    id: 'mock-muirfield',
    name: 'Muirfield',
    country: 'Scotland',
    subCountry: 'East Lothian',
    thumbnail: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop&q=85',
    memberships: ['gb-ireland-top-100', 'world-top-100'],
  },
  {
    id: 'mock-birkdale',
    name: 'Royal Birkdale Golf Club',
    country: 'England',
    subCountry: 'Merseyside',
    thumbnail: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=600&fit=crop&q=85',
    memberships: ['gb-ireland-top-100', 'world-top-100'],
  },
  {
    id: 'mock-hillside',
    name: 'Hillside Golf Club',
    country: 'England',
    subCountry: 'Merseyside',
    thumbnail: 'https://images.unsplash.com/photo-1591491718746-47c47a6d7a2c?w=800&h=600&fit=crop&q=80',
    memberships: [],
  },
  {
    id: 'mock-royal-portrush',
    name: 'Royal Portrush Golf Club',
    country: 'Northern Ireland',
    subCountry: 'Antrim',
    thumbnail: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=800&h=600&fit=crop&q=85',
    memberships: ['gb-ireland-top-100', 'world-top-100'],
  },
  {
    id: 'mock-portmarnock',
    name: 'Portmarnock Golf Club',
    country: 'Ireland',
    subCountry: 'Dublin',
    thumbnail: 'https://images.unsplash.com/photo-1593111774240-d529f12995a8?w=800&h=600&fit=crop&q=80',
    memberships: ['gb-ireland-top-100'],
  },
  {
    id: 'mock-sand-hills',
    name: 'Sand Hills Golf Club',
    country: 'USA',
    subCountry: 'Nebraska',
    thumbnail: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop&q=90',
    memberships: ['world-top-100', 'usa-top-100'],
  },
  {
    id: 'mock-county-louth',
    name: 'County Louth Golf Club',
    country: 'Ireland',
    subCountry: 'Louth',
    thumbnail: 'https://images.unsplash.com/photo-1591491718746-47c47a6d7a2c?w=800&h=600&fit=crop&q=85',
    memberships: [],
  },
  {
    id: 'mock-carnoustie',
    name: 'Carnoustie Golf Links',
    country: 'Scotland',
    subCountry: 'Angus',
    thumbnail: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=600&fit=crop&q=90',
    memberships: ['gb-ireland-top-100', 'world-top-100'],
  },
  {
    id: 'mock-lahinch',
    name: 'Lahinch Golf Club',
    country: 'Ireland',
    subCountry: 'Clare',
    thumbnail: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=800&h=600&fit=crop&q=80',
    memberships: ['gb-ireland-top-100'],
  },
  {
    id: 'mock-turnberry',
    name: 'Trump Turnberry (Ailsa)',
    country: 'Scotland',
    subCountry: 'South Ayrshire',
    thumbnail: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop&q=95',
    memberships: ['gb-ireland-top-100', 'world-top-100'],
  },
  {
    id: 'mock-lytham',
    name: 'Royal Lytham & St Annes',
    country: 'England',
    subCountry: 'Lancashire',
    thumbnail: 'https://images.unsplash.com/photo-1593111774240-d529f12995a8?w=800&h=600&fit=crop&q=90',
    memberships: ['gb-ireland-top-100', 'world-top-100'],
  },
  {
    id: 'mock-troon',
    name: 'Royal Troon Golf Club (Old)',
    country: 'Scotland',
    subCountry: 'South Ayrshire',
    thumbnail: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=600&fit=crop&q=95',
    memberships: ['gb-ireland-top-100', 'world-top-100'],
  },
  {
    id: 'mock-cypress',
    name: 'Cypress Point Club',
    country: 'USA',
    subCountry: 'California',
    thumbnail: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=800&h=600&fit=crop&q=90',
    memberships: ['world-top-100', 'usa-top-100'],
  },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

// Build recent rounds: ~100–120 rounds in last 30 days
const recentRounds: any[] = [];
for (let i = 0; i < 110; i++) {
  const friend = pick(mockFriends);
  const course = pick(mockCourses);
  const dayOffset = Math.floor(Math.random() * 30); // 0–29 days ago

  recentRounds.push({
    friend_id: friend.id,
    course_id: course.id,
    course_name: course.name,
    played_at: daysAgo(dayOffset),
    friend_profile: {
      display_name: friend.name,
      username: friend.username,
      profile_photo_url: friend.avatar,
    },
    course_country: course.country,
    top100_memberships: course.memberships,
    rating: Math.round(randomBetween(7.5, 10) * 10) / 10, // 7.5–10.0
  });
}

// Aggregate by course for the "courses" array the panel expects
const courseIdToFriendsMap = new Map<string, any>();

recentRounds.forEach((round) => {
  const courseMeta = mockCourses.find((c) => c.id === round.course_id);
  if (!courseMeta) return;

  const existing = courseIdToFriendsMap.get(round.course_id);
  if (!existing) {
    courseIdToFriendsMap.set(round.course_id, {
      course_id: courseMeta.id,
      course_name: courseMeta.name,
      country: courseMeta.country,
      sub_country: courseMeta.subCountry,
      thumbnail_url: courseMeta.thumbnail,
      top100_memberships: courseMeta.memberships,
      friends: [
        {
          friend_id: round.friend_id,
          played_at: round.played_at,
          friend_profile: round.friend_profile,
        },
      ],
      total_friends_played: 1,
      most_recent_play: round.played_at,
      ratings: [round.rating],
    });
  } else {
    existing.friends.push({
      friend_id: round.friend_id,
      played_at: round.played_at,
      friend_profile: round.friend_profile,
    });
    existing.total_friends_played += 1;
    if (new Date(round.played_at) > new Date(existing.most_recent_play)) {
      existing.most_recent_play = round.played_at;
    }
    existing.ratings.push(round.rating);
  }
});

const coursesAggregated = Array.from(courseIdToFriendsMap.values()).map(
  (course) => {
    const ratings = course.ratings as number[];
    const avg =
      ratings.length === 0
        ? null
        : ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

    return {
      ...course,
      average_rating: avg,
    };
  }
);

export const friendsCoursesMockData = {
  totalCourses: coursesAggregated.length,
  totalFriendsActive: mockFriends.length,
  courses: coursesAggregated,
  recent: recentRounds,
};
