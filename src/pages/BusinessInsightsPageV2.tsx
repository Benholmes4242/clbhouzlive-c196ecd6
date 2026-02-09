import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Users, MousePointerClick, UserPlus, Phone, Globe, MapPin, MessageSquare, TrendingUp, TrendingDown, Star, MessageCircle } from 'lucide-react';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessReviewStats } from '@/hooks/useBusinessReviewStats';
import { PageRoot } from '@/components/layout/PageRoot';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { trackBusinessProfileVisit } from '@/lib/businessAnalyticsTracking';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

type DateRange = '7d' | '28d' | '90d';

// Mock data for charts (will be replaced with real data)
const MOCK_TRAFFIC_DATA = [
  { day: 'Mon', visits: 42 },
  { day: 'Tue', visits: 58 },
  { day: 'Wed', visits: 35 },
  { day: 'Thu', visits: 72 },
  { day: 'Fri', visits: 65 },
  { day: 'Sat', visits: 89 },
  { day: 'Sun', visits: 121 },
];

const MOCK_DISCOVERY_DATA = [
  { name: 'Search', value: 45, color: '#ff9f1c' },
  { name: 'Content', value: 30, color: '#2dd4bf' },
  { name: 'Course pages', value: 15, color: '#60a5fa' },
  { name: 'Shares', value: 10, color: '#a78bfa' },
];

const MOCK_POSTS = [
  { id: '1', thumbnail: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=120&h=120&fit=crop', caption: 'Perfect conditions at the 18th today...', views: 1240, likes: 89, comments: 12, profileVisits: 34 },
  { id: '2', thumbnail: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=120&h=120&fit=crop', caption: 'New membership offers available now...', views: 890, likes: 56, comments: 8, profileVisits: 28 },
  { id: '3', thumbnail: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=120&h=120&fit=crop', caption: 'Weekend tournament recap 🏆', views: 2100, likes: 145, comments: 23, profileVisits: 67 },
];

const MOCK_RATING_DISTRIBUTION = [
  { stars: 5, count: 52, percent: 60 },
  { stars: 4, count: 24, percent: 28 },
  { stars: 3, count: 7, percent: 8 },
  { stars: 2, count: 2, percent: 2 },
  { stars: 1, count: 1, percent: 2 },
];

// Reviews section component using real data
const ReviewsSection = ({ businessId, navigate }: { businessId: string; navigate: (path: string) => void }) => {
  const { data: reviewStats, isLoading } = useBusinessReviewStats(businessId);

  if (isLoading) {
    return (
      <section className="bg-[rgba(7,10,18,0.98)] border border-white/[0.04] rounded-[18px] p-4 md:p-5">
        <h3 className="text-[0.9rem] font-medium text-white mb-4">Reviews & reputation</h3>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ff9f1c]" />
        </div>
      </section>
    );
  }

  if (!reviewStats) {
    return (
      <section className="bg-[rgba(7,10,18,0.98)] border border-white/[0.04] rounded-[18px] p-4 md:p-5">
        <h3 className="text-[0.9rem] font-medium text-white mb-4">Reviews & reputation</h3>
        <p className="text-[0.8rem] text-white/55 text-center py-6">
          No reviews yet. Once golfers review your courses, you'll see ratings and feedback here.
        </p>
      </section>
    );
  }

  const maxCount = Math.max(...reviewStats.distribution.map(d => d.count), 1);

  return (
    <section className="bg-[rgba(7,10,18,0.98)] border border-white/[0.04] rounded-[18px] p-4 md:p-5 space-y-5">
      <h3 className="text-[0.9rem] font-medium text-white mb-4">Reviews & reputation</h3>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Rating summary */}
        <div className="text-center md:text-left flex-shrink-0">
          <div className="flex items-baseline gap-1 justify-center md:justify-start">
            <span className="text-[2rem] font-bold text-white">{reviewStats.avgRating}</span>
            <span className="text-white/60">/ 10</span>
          </div>
          <p className="text-[0.8rem] text-white/60 mt-1">{reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}</p>
          
          {/* Trend */}
          {reviewStats.recentReviews > 0 && (
            <div className="mt-2 flex items-center gap-1 justify-center md:justify-start">
              <span className={cn(
                "text-xs font-medium",
                reviewStats.reviewTrend >= 0 ? "text-[#4ade80]" : "text-[#f97373]"
              )}>
                {reviewStats.recentReviews} new this month
              </span>
              {reviewStats.reviewTrend !== 0 && (
                <span className={cn(
                  "text-xs",
                  reviewStats.reviewTrend > 0 ? "text-[#4ade80]" : "text-[#f97373]"
                )}>
                  ({reviewStats.reviewTrend > 0 ? '+' : ''}{reviewStats.reviewTrend}%)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Rating distribution (1-10) */}
        <div className="flex-1 space-y-1">
          {reviewStats.distribution.slice().reverse().map((item) => (
            <div key={item.score} className="flex items-center gap-2">
              <span className="text-xs text-white/60 w-5 text-right">{item.score}</span>
              <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs text-white/60 w-6 text-right">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-ratings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Design', value: reviewStats.subRatings.design },
          { label: 'Condition', value: reviewStats.subRatings.condition },
          { label: 'Facilities', value: reviewStats.subRatings.facilities },
          { label: 'Clubhouse', value: reviewStats.subRatings.clubhouse },
        ].map(sr => (
          <div key={sr.label} className="rounded-[10px] bg-white/[0.03] border border-white/[0.05] p-3 text-center">
            <p className="text-lg font-semibold text-white">{sr.value ?? '—'}</p>
            <p className="text-[0.7rem] text-white/55">{sr.label}</p>
          </div>
        ))}
      </div>

      {/* Action prompts */}
      <div className="flex flex-col sm:flex-row gap-2">
        {reviewStats.unrespondedCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-[#ff9f1c]">
            <MessageCircle className="h-3.5 w-3.5" />
            <span>{reviewStats.unrespondedCount} review{reviewStats.unrespondedCount !== 1 ? 's' : ''} awaiting your response</span>
          </div>
        )}
      </div>

      {/* Multi-course breakdown */}
      {reviewStats.courses.length > 1 && (
        <div className="space-y-2 pt-2 border-t border-white/[0.06]">
          <h4 className="text-[0.8rem] font-medium text-white/70">Course breakdown</h4>
          {reviewStats.courses.map(course => (
            <button
              key={course.id}
              onClick={() => navigate(`/courses/${course.id}?tab=reviews`)}
              className="w-full flex items-center justify-between py-2 px-3 rounded-[10px] hover:bg-white/[0.03] transition-colors text-left"
            >
              <div className="min-w-0">
                <p className="text-[0.8rem] font-medium text-white truncate">{course.name}</p>
                <p className="text-[0.7rem] text-white/55">
                  {course.reviewCount} review{course.reviewCount !== 1 ? 's' : ''}
                  {course.recentCount > 0 && ` · ${course.recentCount} new`}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                <span className="text-sm font-medium text-white">{course.avgRating}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* View all reviews link */}
      {reviewStats.courses.length > 0 && (
        <button
          onClick={() => navigate(`/courses/${reviewStats.courses[0].id}?tab=reviews`)}
          className="text-[0.8rem] text-[#ff9f1c] hover:underline"
        >
          View all reviews ›
        </button>
      )}
    </section>
  );
};

// Stat Card Component - Dark theme
const StatCard = ({ 
  label, 
  value, 
  change, 
  icon: Icon 
}: { 
  label: string; 
  value: string; 
  change: number; 
  icon: React.ElementType;
}) => {
  const isPositive = change >= 0;
  
  return (
    <div className="bg-[#070a12]/95 border border-white/[0.04] rounded-[18px] p-3 md:p-4 min-w-[140px] flex-shrink-0 shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between mb-2">
        <div className="h-8 w-8 md:h-9 md:w-9 rounded-[10px] bg-white/[0.04] flex items-center justify-center">
          <Icon className="h-4 w-4 text-white/60" />
        </div>
        <div className={cn(
          "flex items-center gap-0.5 text-xs font-medium",
          isPositive ? "text-[#4ade80]" : "text-[#f97373]"
        )}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {isPositive ? '+' : ''}{change}%
        </div>
      </div>
      <p className="text-[1.4rem] font-semibold text-white">{value}</p>
      <p className="text-[0.75rem] text-white/55 mt-0.5">{label}</p>
    </div>
  );
};

// Action Card Component - Dark theme
const ActionCard = ({ 
  label, 
  value, 
  icon: Icon 
}: { 
  label: string; 
  value: number; 
  icon: React.ElementType;
}) => (
  <div className="rounded-[14px] border border-white/[0.05] p-3 md:p-4 text-center bg-[radial-gradient(circle_at_top_left,_rgba(255,159,28,0.08),_rgba(7,10,18,1))]">
    <div className="h-9 w-9 md:h-10 md:w-10 rounded-[10px] bg-white/[0.04] flex items-center justify-center mx-auto mb-2">
      <Icon className="h-4 w-4 md:h-5 md:w-5 text-white/60" />
    </div>
    <p className="text-lg md:text-xl font-semibold text-white">{value}</p>
    <p className="text-[0.78rem] text-white/70">{label}</p>
  </div>
);

// Post Performance Row - Dark theme
const PostPerformanceRow = ({ post }: { post: typeof MOCK_POSTS[0] }) => (
  <div className="flex items-center gap-3 py-2 md:py-3 rounded-[12px] hover:bg-white/[0.02] transition-colors">
    <img 
      src={post.thumbnail} 
      alt="" 
      className="h-14 w-14 md:h-16 md:w-16 rounded-[10px] object-cover flex-shrink-0"
    />
    <div className="flex-1 min-w-0">
      <p className="text-[0.8rem] font-medium text-white truncate">{post.caption}</p>
      <div className="flex items-center gap-3 mt-1 text-[0.75rem] text-white/60">
        <span>{post.views.toLocaleString()} views</span>
        <span>{post.likes} likes</span>
        <span>{post.comments} comments</span>
        <span className="text-[#ff9f1c]">{post.profileVisits} visits</span>
      </div>
    </div>
  </div>
);

const BusinessInsightsPageV2 = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('28d');
  const { user } = useSupabaseSession();

  const { data: business, isLoading: businessLoading } = useBusinessProfile(id);
  const { data: membership, isLoading: membershipLoading, isFetched: membershipFetched } = useBusinessMembership(id);

  const isLoading = businessLoading || membershipLoading;

  // Track page visit
  useEffect(() => {
    if (business?.id && !isLoading) {
      trackBusinessProfileVisit(business.id, user?.id, 'direct', { page: 'insights' });
    }
  }, [business?.id, user?.id, isLoading]);

  // Access redirect - only after membership has been fetched
  useEffect(() => {
    if (membershipFetched && !membershipLoading && !membership?.canViewInsights && business) {
      navigate(`/business/${id}`, { replace: true });
    }
  }, [membershipFetched, membershipLoading, membership, business, id, navigate]);

  // Loading state
  if (isLoading || !membershipFetched) {
    return (
      <PageRoot className="min-h-screen bg-[#05060a]">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff9f1c]" />
        </div>
      </PageRoot>
    );
  }

  // Business not found
  if (!business) {
    return (
      <PageRoot className="min-h-screen bg-[#05060a]">
        <div className="max-w-xl mx-auto mt-10 text-center px-4">
          <p className="text-white/60">Business not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">Go home</Button>
        </div>
      </PageRoot>
    );
  }

  // Access check - wait for redirect effect, show loading meanwhile
  if (!membership?.canViewInsights) {
    return (
      <PageRoot className="min-h-screen bg-[#05060a]">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff9f1c]" />
        </div>
      </PageRoot>
    );
  }

  const rangeLabels: Record<DateRange, string> = {
    '7d': '7 days',
    '28d': '28 days',
    '90d': '90 days',
  };

  return (
    <PageRoot className="min-h-screen bg-[#05060a] pb-20">
      {/* Header - Dark theme */}
      <div className="sticky top-0 z-10 bg-[#05060a]/95 backdrop-blur-md border-b border-white/[0.04]">
        <div className="max-w-[1024px] mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/business/${id}`)}
                className="p-2 -ml-2 hover:bg-white/[0.04] rounded-[10px] transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white/70" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-white">Insights</h1>
                <p className="text-[0.8rem] text-white/60 truncate">
                  {business.name} {business.location && `· ${business.location.split(',')[0]}`}
                </p>
              </div>
            </div>

            {/* Date range selector */}
            <div className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.03] p-1">
              {(['7d', '28d', '90d'] as DateRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={cn(
                    "px-3 md:px-4 py-1.5 text-[0.8rem] rounded-full transition-colors",
                    dateRange === range 
                      ? "bg-[rgba(255,159,28,0.16)] border border-[#ff9f1c] text-white" 
                      : "text-white/60 hover:text-white"
                  )}
                >
                  {rangeLabels[range]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1024px] mx-auto px-4 md:px-6 py-6 space-y-5 md:space-y-6">
        {/* Key Metrics Strip */}
        <section>
          <h2 className="text-[0.75rem] font-medium text-white/55 uppercase tracking-wider mb-3">Overview</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4">
            <StatCard label="Profile Visits" value="482" change={18} icon={Eye} />
            <StatCard label="Golfers Reached" value="2.1K" change={9} icon={Users} />
            <StatCard label="Actions Taken" value="137" change={4} icon={MousePointerClick} />
            <StatCard label="New Followers" value="32" change={12} icon={UserPlus} />
          </div>
        </section>

        {/* Traffic Over Time */}
        <section className="bg-[rgba(7,10,18,0.98)] border border-white/[0.04] rounded-[18px] p-4 md:p-5">
          <h3 className="text-[0.9rem] font-medium text-white mb-1">Profile visits over time</h3>
          <p className="text-[0.8rem] text-white/55 mb-4">Last {rangeLabels[dateRange]}</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_TRAFFIC_DATA}>
                <defs>
                  <linearGradient id="colorVisitsDark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff9f1c" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ff9f1c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.55)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.55)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#11141d', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    color: '#fff',
                  }}
                  labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="visits" 
                  stroke="#ff9f1c" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorVisitsDark)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* How Golfers Discover You */}
        <section className="bg-[rgba(7,10,18,0.98)] border border-white/[0.04] rounded-[18px] p-4 md:p-5">
          <h3 className="text-[0.9rem] font-medium text-white mb-4">How golfers discover you</h3>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="h-[160px] w-[160px] mx-auto md:mx-0 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={MOCK_DISCOVERY_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {MOCK_DISCOVERY_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {MOCK_DISCOVERY_DATA.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2 w-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[0.8rem] text-white/70">{item.name}</span>
                  </div>
                  <span className="text-[0.8rem] font-medium text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What Golfers Do Next */}
        <section>
          <h3 className="text-[0.9rem] font-medium text-white mb-3">What golfers do next</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ActionCard label="Call taps" value={24} icon={Phone} />
            <ActionCard label="Website clicks" value={34} icon={Globe} />
            <ActionCard label="Directions" value={18} icon={MapPin} />
            <ActionCard label="Message taps" value={61} icon={MessageSquare} />
          </div>
        </section>

        {/* Content Performance */}
        <section className="bg-[rgba(7,10,18,0.98)] border border-white/[0.04] rounded-[18px] p-4 md:p-5">
          <h3 className="text-[0.9rem] font-medium text-white mb-1">Content performance</h3>
          <p className="text-[0.8rem] text-white/55 mb-3">Your top performing posts</p>
          <div className="divide-y divide-white/[0.04]">
            {MOCK_POSTS.map(post => (
              <PostPerformanceRow key={post.id} post={post} />
            ))}
          </div>
        </section>

        {/* Reviews & Reputation — Real Data */}
        <ReviewsSection businessId={business.id} navigate={navigate} />
      </div>
    </PageRoot>
  );
};

export default BusinessInsightsPageV2;
