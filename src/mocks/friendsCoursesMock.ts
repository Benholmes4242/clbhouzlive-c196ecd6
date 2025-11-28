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

// Real course IDs from the database - mock data uses REAL courses, only friend activity is mocked
const mockCourses = [
  {
    id: '29b33f45-7dd0-468b-ab29-046a0bda9832',
    name: 'Royal County Down Golf Club',
  },
  {
    id: 'd917f7fb-ca74-4813-bc27-35ba95c04e03',
    name: 'Pine Valley Golf Club',
  },
  {
    id: 'a2426246-5314-42f7-8637-de23bd8d7665',
    name: 'Pebble Beach Golf Links',
  },
  {
    id: '1c484d0a-7113-4b57-a133-986cfb0eec23',
    name: 'Royal Dornoch Golf Club',
  },
  {
    id: '5cdf162c-c3f3-44fa-b1ef-7b30d5d66b96',
    name: 'Kingsbarns Golf Links',
  },
  {
    id: '622610f7-7e53-404d-a5da-b9fb1e562e51',
    name: 'Royal Birkdale Golf Club',
  },
  {
    id: 'd0ff24bd-6297-4f0d-9bec-873162449c8e',
    name: 'Royal Portrush Golf Club',
  },
  {
    id: 'bda5912f-a46e-47af-9aad-4db21235cb61',
    name: 'Portmarnock Golf Club',
  },
  {
    id: '42ff8b7b-a788-4ec3-922c-62c49b38a365',
    name: 'Sand Hills Golf Club',
  },
  {
    id: '92457337-a89a-439c-aa01-c304a2ba6f8e',
    name: 'Lahinch Golf Club',
  },
  {
    id: '9e2b180d-755c-41bb-b8cf-c6108cbd4a46',
    name: 'Royal Lytham & St Annes Golf Club',
  },
  {
    id: 'e69aee30-744d-4089-a127-285a62216e2c',
    name: 'Cypress Point Club',
  },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

// Build recent rounds: ~100–120 rounds in last 30 days
// Note: We only mock the friend activity - course details come from real DB
const recentRounds: any[] = [];
for (let i = 0; i < 110; i++) {
  const friend = pick(mockFriends);
  const course = pick(mockCourses);
  const dayOffset = Math.floor(Math.random() * 30); // 0–29 days ago

  recentRounds.push({
    friend_id: friend.id,
    course_id: course.id, // Real course ID - details will be fetched from DB
    course_name: course.name, // Placeholder - will be replaced with real data
    played_at: daysAgo(dayOffset),
    friend_profile: {
      display_name: friend.name,
      username: friend.username,
      profile_photo_url: friend.avatar,
    },
    course_country: null, // Will be filled from real DB
    course_sub_country: null, // Will be filled from real DB
    thumbnail_url: null, // Will be filled from real DB
    top100_memberships: [], // Will be filled from real DB
    rating: Math.round(randomBetween(7.5, 10) * 10) / 10, // 7.5–10.0
  });
}

// Aggregate by course for the "courses" array the panel expects
// Note: Course details will be enriched from real DB data in the panel
const courseIdToFriendsMap = new Map<string, any>();

recentRounds.forEach((round) => {
  const courseMeta = mockCourses.find((c) => c.id === round.course_id);
  if (!courseMeta) return;

  const existing = courseIdToFriendsMap.get(round.course_id);
  if (!existing) {
    courseIdToFriendsMap.set(round.course_id, {
      course_id: courseMeta.id,
      course_name: courseMeta.name,
      country: null, // Will be filled from real DB
      sub_country: null, // Will be filled from real DB
      thumbnail_url: null, // Will be filled from real DB
      top100_memberships: [], // Will be filled from real DB
      friends: [
        {
          friend_id: round.friend_id,
          played_at: round.played_at,
          friend_profile: round.friend_profile,
          rating: round.rating,
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
