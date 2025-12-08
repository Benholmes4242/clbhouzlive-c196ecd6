// Mock handicap data for demo purposes
// Later these types will be populated from England Golf API

export type HandicapTimelinePoint = {
  date: string;          // 'YYYY-MM-DD'
  index: number;         // 3.7 etc
  courseName: string;
};

export type CourseImpactEntry = {
  courseName: string;
  delta: number;         // +1.2, -0.8 vs index
};

export type FriendHandicapEntry = {
  id: string;
  name: string;
  avatarUrl: string;
  homeClub?: string;
  currentIndex: number;
  delta: number;         // negative = improved
};

export type HandicapMilestones = {
  singleFigure?: { achieved: boolean; index: number; date: string };
  biggestDrop?: { delta: number; period: string };
  personalBest?: { index: number; date: string };
};

export type HandicapRoundData = {
  id: string;
  date: string;
  courseName: string;
  differential: number; // negative = index dropped, positive = index increased
};

export type NextRoundPrediction = {
  upcomingCourse: string;
  upcomingDate: string; // ISO string
  currentIndex: number;
  threeRoundAverage: number;
  projectedIndexIfAverage: number;
  projectedIndexIfBest: number;
};

export interface HandicapData {
  currentIndex: number;
  bestIndex: number;
  threeRoundAverage: number;
  roundsCounted: number;
  lastUpdated: string;
  timeline: HandicapTimelinePoint[];
  toughestCourses: CourseImpactEntry[];
  bestCourses: CourseImpactEntry[];
  friends: FriendHandicapEntry[];
  milestones: HandicapMilestones;
  rounds: HandicapRoundData[];
}

export const BEN_HANDICAP_MOCK: HandicapData = {
  currentIndex: 4.0,
  bestIndex: 3.7,
  threeRoundAverage: 4.0,
  roundsCounted: 20,
  lastUpdated: '10 Jan 2026',

  timeline: [
    { date: '2025-02-01', index: 5.2, courseName: 'Royal Birkdale' },
    { date: '2025-03-15', index: 5.0, courseName: 'Sunningdale New' },
    { date: '2025-05-10', index: 4.8, courseName: 'Sunningdale Old' },
    { date: '2025-06-22', index: 4.6, courseName: 'Wentworth West' },
    { date: '2025-08-20', index: 4.4, courseName: 'Wentworth East' },
    { date: '2025-09-12', index: 4.3, courseName: 'Royal St Georges' },
    { date: '2025-10-05', index: 4.2, courseName: 'Walton Heath Old' },
    { date: '2025-11-15', index: 4.1, courseName: 'St Andrews Old' },
    { date: '2025-12-20', index: 4.0, courseName: 'Royal Troon' },
    { date: '2026-01-10', index: 4.0, courseName: 'Sundridge Park' },
  ],

  toughestCourses: [
    { courseName: 'Royal Birkdale', delta: 1.5 },
    { courseName: 'Wentworth East', delta: 0.9 },
    { courseName: 'Carnoustie', delta: 0.7 },
  ],

  bestCourses: [
    { courseName: 'St Andrews Old', delta: -0.8 },
    { courseName: 'Sunningdale Old', delta: -0.6 },
    { courseName: 'Walton Heath Old', delta: -0.4 },
  ],

  friends: [
    { id: '1', name: 'Lauren', avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=face', homeClub: 'Sunningdale', currentIndex: 5.2, delta: -0.6 },
    { id: '2', name: 'Ryan', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face', homeClub: 'Wentworth', currentIndex: 3.7, delta: -0.5 },
    { id: '3', name: 'Daniel', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', homeClub: 'The Grove', currentIndex: 4.4, delta: -0.4 },
    { id: '4', name: 'Michael', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', homeClub: 'Royal Birkdale', currentIndex: 6.1, delta: -0.2 },
    { id: '5', name: 'Rachel', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face', homeClub: 'Queenwood', currentIndex: 8.3, delta: 0.3 },
  ],

  milestones: {
    singleFigure: { achieved: true, index: 9.8, date: '2023-03-15' },
    biggestDrop: { delta: -1.2, period: '2023 season' },
    personalBest: { index: 3.7, date: '2024-09-01' },
  },

  rounds: [
    { id: 'r1', date: '2026-01-10', courseName: 'Sundridge Park', differential: 0.0 },
    { id: 'r2', date: '2025-12-20', courseName: 'Royal Troon', differential: +0.1 },
    { id: 'r3', date: '2025-11-15', courseName: 'St Andrews Old', differential: -0.4 },
    { id: 'r4', date: '2025-10-05', courseName: 'Walton Heath Old', differential: -0.3 },
    { id: 'r5', date: '2025-09-12', courseName: 'Royal St Georges', differential: +0.2 },
    { id: 'r6', date: '2025-08-20', courseName: 'Wentworth East', differential: +0.4 },
    { id: 'r7', date: '2025-06-22', courseName: 'Wentworth West', differential: -0.2 },
    { id: 'r8', date: '2025-05-10', courseName: 'Sunningdale Old', differential: -0.5 },
    { id: 'r9', date: '2025-03-15', courseName: 'Sunningdale New', differential: -0.2 },
    { id: 'r10', date: '2025-02-01', courseName: 'Royal Birkdale', differential: +0.6 },
    { id: 'r11', date: '2024-12-15', courseName: 'St Andrews Old', differential: -0.3 },
    { id: 'r12', date: '2024-11-20', courseName: 'Carnoustie', differential: +0.5 },
    { id: 'r13', date: '2024-10-08', courseName: 'Royal Birkdale', differential: +0.4 },
    { id: 'r14', date: '2024-09-01', courseName: 'Walton Heath Old', differential: -0.2 },
    { id: 'r15', date: '2024-07-22', courseName: 'Sunningdale Old', differential: -0.4 },
  ],
};

// Next round prediction for demo
export const BEN_NEXT_ROUND_PREDICTION: NextRoundPrediction = {
  upcomingCourse: 'Sunningdale Old Course',
  upcomingDate: '2026-02-15',
  currentIndex: 4.0,
  threeRoundAverage: 3.8,
  projectedIndexIfAverage: 3.8,
  projectedIndexIfBest: 3.7,
};
