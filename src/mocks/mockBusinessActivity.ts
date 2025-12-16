/**
 * Mock business activity posts for dev/preview testing
 * NEVER write these to Supabase - front-end only
 */

const BENJAMIN_BUSINESS_ID = "814a8367-d2af-4d38-8096-43f731a1b509";

// Helper to generate dates spread across last 30 days
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

export interface MockPostMedia {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  poster_url?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface MockBusinessPost {
  id: string;
  content: string;
  created_at: string;
  business_id: string;
  user_id: string;
  post_type: 'standard' | 'announcement' | 'review' | 'offer' | 'event';
  location?: string;
  likes_count: number;
  comments_count: number;
  post_media: MockPostMedia[];
}

export const mockBusinessActivityPosts: MockBusinessPost[] = [
  // 1. Portrait photo (4:5)
  {
    id: "mock-biz-001",
    content: "Beautiful morning on the first tee. Nothing beats that sunrise light ☀️",
    created_at: daysAgo(1),
    business_id: BENJAMIN_BUSINESS_ID,
    user_id: "mock-user",
    post_type: "standard",
    likes_count: 124,
    comments_count: 8,
    post_media: [{
      id: "mock-media-001",
      media_type: "image",
      media_url: "https://picsum.photos/seed/golf1/800/1000",
      width: 800,
      height: 1000,
    }],
  },
  // 2. Landscape photo (16:9)
  {
    id: "mock-biz-002",
    content: "The 18th hole at sunset. This is why we do what we do.",
    created_at: daysAgo(2),
    business_id: BENJAMIN_BUSINESS_ID,
    user_id: "mock-user",
    post_type: "standard",
    likes_count: 89,
    comments_count: 5,
    post_media: [{
      id: "mock-media-002",
      media_type: "image",
      media_url: "https://picsum.photos/seed/golf2/1600/900",
      width: 1600,
      height: 900,
    }],
  },
  // 3. Square photo (1:1)
  {
    id: "mock-biz-003",
    content: "New merch drop 🧢 Available in the pro shop",
    created_at: daysAgo(3),
    business_id: BENJAMIN_BUSINESS_ID,
    user_id: "mock-user",
    post_type: "standard",
    likes_count: 67,
    comments_count: 12,
    post_media: [{
      id: "mock-media-003",
      media_type: "image",
      media_url: "https://picsum.photos/seed/golf3/800/800",
      width: 800,
      height: 800,
    }],
  },
  // 4. 3-photo carousel mixed ratios
  {
    id: "mock-biz-004",
    content: "Course conditions looking pristine after yesterday's maintenance. Greens rolling true at 11 on the stimp.",
    created_at: daysAgo(4),
    business_id: BENJAMIN_BUSINESS_ID,
    user_id: "mock-user",
    post_type: "standard",
    likes_count: 156,
    comments_count: 19,
    post_media: [
      { id: "mock-media-004a", media_type: "image", media_url: "https://picsum.photos/seed/green1/800/1000", width: 800, height: 1000 },
      { id: "mock-media-004b", media_type: "image", media_url: "https://picsum.photos/seed/green2/1200/800", width: 1200, height: 800 },
      { id: "mock-media-004c", media_type: "image", media_url: "https://picsum.photos/seed/green3/800/800", width: 800, height: 800 },
    ],
  },
  // 5. 9-photo carousel grid-stress
  {
    id: "mock-biz-005",
    content: "Behind the scenes at last weekend's charity tournament 🏆",
    created_at: daysAgo(5),
    business_id: BENJAMIN_BUSINESS_ID,
    user_id: "mock-user",
    post_type: "standard",
    likes_count: 234,
    comments_count: 28,
    post_media: Array.from({ length: 9 }, (_, i) => ({
      id: `mock-media-005-${i}`,
      media_type: "image" as const,
      media_url: `https://picsum.photos/seed/charity${i}/800/800`,
      width: 800,
      height: 800,
    })),
  },
  // 6. Short video (mock with thumbnail)
  {
    id: "mock-biz-006",
    content: "Quick tip: Keep your left arm straight through impact 🎯",
    created_at: daysAgo(6),
    business_id: BENJAMIN_BUSINESS_ID,
    user_id: "mock-user",
    post_type: "standard",
    likes_count: 312,
    comments_count: 45,
    post_media: [{
      id: "mock-media-006",
      media_type: "video",
      media_url: "https://picsum.photos/seed/video1/800/1000",
      poster_url: "https://picsum.photos/seed/video1/800/1000",
      width: 800,
      height: 1000,
      duration: 8,
    }],
  },
  // 7. Longer video (45-60s)
  {
    id: "mock-biz-007",
    content: "Full swing analysis with our new TrackMan setup. Book your fitting session today!",
    created_at: daysAgo(7),
    business_id: BENJAMIN_BUSINESS_ID,
    user_id: "mock-user",
    post_type: "standard",
    likes_count: 178,
    comments_count: 23,
    post_media: [{
      id: "mock-media-007",
      media_type: "video",
      media_url: "https://picsum.photos/seed/trackman/1600/900",
      poster_url: "https://picsum.photos/seed/trackman/1600/900",
      width: 1600,
      height: 900,
      duration: 52,
    }],
  },
  // 8. Video with cover image
  {
    id: "mock-biz-008",
    content: "Tour of our newly renovated practice facility 🏌️‍♂️",
    created_at: daysAgo(8),
    business_id: BENJAMIN_BUSINESS_ID,
    user_id: "mock-user",
    post_type: "standard",
    likes_count: 201,
    comments_count: 31,
    post_media: [{
      id: "mock-media-008",
      media_type: "video",
      media_url: "https://picsum.photos/seed/facility/1200/800",
      poster_url: "https://picsum.photos/seed/facility/1200/800",
      width: 1200,
      height: 800,
      duration: 35,
    }],
  },
  // 9. Text-only announcement (no media)
  {
    id: "mock-biz-009",
    content: "📢 Important Update: We're extending our twilight rates through the end of October! Tee times after 3pm now just £35. Book via our website or call the pro shop.",
    created_at: daysAgo(9),
    business_id: BENJAMIN_BUSINESS_ID,
    user_id: "mock-user",
    post_type: "announcement",
    likes_count: 89,
    comments_count: 14,
    post_media: [],
  },
  // 10. Offer style post
  {
    id: "mock-biz-010",
    content: "🎉 FLASH SALE 🎉\n\n20% off all lessons booked this week!\n\nUse code AUTUMN20 at checkout.\n\nValid for group and individual sessions.\n\nT&Cs apply.",
    created_at: daysAgo(10),
    business_id: BENJAMIN_BUSINESS_ID,
    user_id: "mock-user",
    post_type: "offer",
    likes_count: 156,
    comments_count: 22,
    post_media: [{
      id: "mock-media-010",
      media_type: "image",
      media_url: "https://picsum.photos/seed/sale/800/800",
      width: 800,
      height: 800,
    }],
  },
  // 11. Event announcement
  {
    id: "mock-biz-011",
    content: "🗓️ Mark your calendars!\n\nAnnual Members Tournament\n📅 Saturday, November 15th\n⏰ Shotgun start 8:00 AM\n🏆 Prizes for top 3 + nearest the pin\n\nSign up at reception by Nov 10th.",
    created_at: daysAgo(11),
    business_id: BENJAMIN_BUSINESS_ID,
    user_id: "mock-user",
    post_type: "event",
    likes_count: 198,
    comments_count: 34,
    post_media: [{
      id: "mock-media-011",
      media_type: "image",
      media_url: "https://picsum.photos/seed/tournament/1200/800",
      width: 1200,
      height: 800,
    }],
  },
  // 12. Testimonial/review screenshot
  {
    id: "mock-biz-012",
    content: "Nothing makes us happier than hearing from our members 🙏\n\nThank you for the kind words, James!",
    created_at: daysAgo(12),
    business_id: BENJAMIN_BUSINESS_ID,
    user_id: "mock-user",
    post_type: "review",
    likes_count: 145,
    comments_count: 8,
    post_media: [{
      id: "mock-media-012",
      media_type: "image",
      media_url: "https://picsum.photos/seed/review/800/600",
      width: 800,
      height: 600,
    }],
  },
  // 13. Link preview post
  {
    id: "mock-biz-013",
    content: "Our head pro was featured in Golf Monthly this week! Read the full interview here 👇\n\nhttps://golfmonthly.com/interview",
    created_at: daysAgo(13),
    business_id: BENJAMIN_BUSINESS_ID,
    user_id: "mock-user",
    post_type: "standard",
    likes_count: 234,
    comments_count: 19,
    post_media: [{
      id: "mock-media-013",
      media_type: "image",
      media_url: "https://picsum.photos/seed/magazine/1200/630",
      width: 1200,
      height: 630,
    }],
  },
  // 14. Repost/share style
  {
    id: "mock-biz-014",
    content: "Reposted from @TheR&A:\n\n\"Great to see clubs like this investing in junior development programmes. The future of golf is in good hands.\"",
    created_at: daysAgo(14),
    business_id: BENJAMIN_BUSINESS_ID,
    user_id: "mock-user",
    post_type: "standard",
    likes_count: 112,
    comments_count: 7,
    post_media: [{
      id: "mock-media-014",
      media_type: "image",
      media_url: "https://picsum.photos/seed/juniors/1000/1000",
      width: 1000,
      height: 1000,
    }],
  },
  // 15. High emoji caption
  {
    id: "mock-biz-015",
    content: "🏌️‍♂️⛳🎯🔥💪🏆✨🙌👏❤️\n\nWhat a day! What a round! What a feeling!\n\n🏌️‍♂️⛳🎯🔥💪🏆✨🙌👏❤️",
    created_at: daysAgo(15),
    business_id: BENJAMIN_BUSINESS_ID,
    user_id: "mock-user",
    post_type: "standard",
    likes_count: 78,
    comments_count: 5,
    post_media: [{
      id: "mock-media-015",
      media_type: "image",
      media_url: "https://picsum.photos/seed/celebrate/800/1000",
      width: 800,
      height: 1000,
    }],
  },
  // 16. Very long caption (tests truncation)
  {
    id: "mock-biz-016",
    content: "We wanted to take a moment to reflect on what an incredible year it's been for our club and our community. When we started this journey back in January, we never could have imagined the support, enthusiasm, and passion that our members would bring to every single event, tournament, and casual Sunday round.\n\nFrom the junior academy graduates who played their first full 18 holes this summer, to our seniors who continue to inspire us with their dedication to the game, every single one of you makes this place special.\n\nAs we head into the winter months, we're already planning some exciting improvements for next season. New bunker renovations, upgraded practice facilities, and a completely redesigned short game area are all in the works.\n\nThank you for being part of our story. Here's to many more rounds together! 🏌️‍♂️⛳",
    created_at: daysAgo(16),
    business_id: BENJAMIN_BUSINESS_ID,
    user_id: "mock-user",
    post_type: "standard",
    likes_count: 287,
    comments_count: 42,
    post_media: [{
      id: "mock-media-016",
      media_type: "image",
      media_url: "https://picsum.photos/seed/community/1200/800",
      width: 1200,
      height: 800,
    }],
  },
  // 17. Hashtags-heavy caption
  {
    id: "mock-biz-017",
    content: "Perfect conditions today ☀️\n\n#golf #golflife #golfcourse #golfer #golfswing #golfstagram #golfaddict #golfing #instagolf #golfporn #golfislife #lovegolf #golfday #golfclub #golftips #golfpractice #ukgolf #linksgolf #golfuk #golflove",
    created_at: daysAgo(17),
    business_id: BENJAMIN_BUSINESS_ID,
    user_id: "mock-user",
    post_type: "standard",
    likes_count: 134,
    comments_count: 11,
    post_media: [{
      id: "mock-media-017",
      media_type: "image",
      media_url: "https://picsum.photos/seed/hashtag/800/800",
      width: 800,
      height: 800,
    }],
  },
  // 18. Tagged location/course
  {
    id: "mock-biz-018",
    content: "Had the pleasure of visiting our friends at @StAndrewsLinks yesterday. Always inspiring to see how the home of golf maintains their traditions while embracing innovation.",
    created_at: daysAgo(18),
    business_id: BENJAMIN_BUSINESS_ID,
    user_id: "mock-user",
    post_type: "standard",
    location: "St Andrews Links, Scotland",
    likes_count: 456,
    comments_count: 67,
    post_media: [{
      id: "mock-media-018",
      media_type: "image",
      media_url: "https://picsum.photos/seed/standrews/1600/900",
      width: 1600,
      height: 900,
    }],
  },
  // 19. Mixed media: 1 photo + 1 video
  {
    id: "mock-biz-019",
    content: "Before and after the lesson 📈\n\nSwipe to see the transformation!",
    created_at: daysAgo(20),
    business_id: BENJAMIN_BUSINESS_ID,
    user_id: "mock-user",
    post_type: "standard",
    likes_count: 223,
    comments_count: 29,
    post_media: [
      { id: "mock-media-019a", media_type: "image", media_url: "https://picsum.photos/seed/before/800/1000", width: 800, height: 1000 },
      { id: "mock-media-019b", media_type: "video", media_url: "https://picsum.photos/seed/after/800/1000", poster_url: "https://picsum.photos/seed/after/800/1000", width: 800, height: 1000, duration: 15 },
    ],
  },
  // 20. Edge-case: missing thumbnail (video fallback UI)
  {
    id: "mock-biz-020",
    content: "Quick course flyover 🚁",
    created_at: daysAgo(25),
    business_id: BENJAMIN_BUSINESS_ID,
    user_id: "mock-user",
    post_type: "standard",
    likes_count: 167,
    comments_count: 13,
    post_media: [{
      id: "mock-media-020",
      media_type: "video",
      media_url: "https://picsum.photos/seed/flyover/1600/900",
      // No poster_url - tests fallback
      width: 1600,
      height: 900,
      duration: 28,
    }],
  },
];

export const MOCK_BUSINESS_ID = BENJAMIN_BUSINESS_ID;
