/**
 * Business Insights Empty States Copy
 * Centralized i18n/config file for all insights page empty state copy
 */

export const insightsEmptyStatesCopy = {
  pageLevel: {
    title: 'Insights will appear here',
    body: "Once golfers view your profile or interact with your posts, you'll see trends, reach, and actions over time.",
    primaryCta: (businessName: string) => `Post as ${businessName}`,
    secondaryCta: 'Complete your business profile',
  },
  kpiStrip: {
    emptyLabel: '—',
    tooltip: 'No data yet for this period.',
  },
  trendChart: {
    title: 'Not enough data yet',
    body: 'Check back once your profile has visits or impressions in the selected time range.',
    cta: 'Change date range',
  },
  discoveryBreakdown: {
    title: 'Discovery data coming soon',
    body: "When golfers find you through search, content, course pages, or shares, it'll show up here.",
  },
  whatGolfersDoNext: {
    title: 'No actions yet',
    body: 'Add a website, phone number, or location to start seeing taps for calls, directions, and visits.',
  },
  contentPerformance: {
    title: 'Post to start generating insights',
    body: "Your top-performing posts will appear here once you've posted as this business.",
    cta: 'Create a post',
  },
  reviewsReputation: {
    title: 'No reviews yet',
    body: "When golfers leave ratings and reviews, you'll see your score and breakdown here.",
    cta: 'Encourage reviews',
  },
  permissionDenied: {
    title: 'Insights are private',
    body: 'Only business owners and admins can view insights.',
  },
  noBusinessProfile: {
    title: 'Business Insights',
    body: 'Create a business profile to unlock analytics and insights about how golfers discover and engage with your business.',
    cta: 'Create business profile',
  },
} as const;

export type InsightsEmptyStatesCopy = typeof insightsEmptyStatesCopy;
