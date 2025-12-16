import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessPostsCount } from '@/hooks/useBusinessPosts';
import { useBusinessFollowersCount } from '@/hooks/useBusinessFollow';
import { useBusinessVerificationRequest } from '@/hooks/useBusinessVerificationRequest';
import { BusinessProfileHeader } from '@/components/business/BusinessProfileHeader';
import { BusinessLocationCard } from '@/components/business/BusinessLocationCard';
import { BusinessProfileOverview } from '@/components/business/BusinessProfileOverview';
import { BusinessProfilePosts } from '@/components/business/BusinessProfilePosts';
import { BusinessProfileInfo } from '@/components/business/BusinessProfileInfo';
import { GolfersHereTab } from '@/components/business/GolfersHereTab';
import { GenericPageSkeleton } from '@/components/skeletons/GenericPageSkeleton';
import { trackBusinessProfileVisit, trackBusinessAction } from '@/lib/businessAnalyticsTracking';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

type BusinessTab = 'content' | 'overview' | 'golfers' | 'info';
type SourceType = 'search' | 'content' | 'course_page' | 'share' | 'direct';

const BusinessProfilePage = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // Content tab is now the default (content-first approach)
  const [activeTab, setActiveTab] = useState<BusinessTab>('content');
  const { user } = useSupabaseSession();

  const { data: business, isLoading, error } = useBusinessProfile(idOrSlug);
  const { data: membership } = useBusinessMembership(business?.id);
  const { data: postsCount = 0 } = useBusinessPostsCount(business?.id);
  const { data: followersCount = 0 } = useBusinessFollowersCount(business?.id);
  const { data: verificationRequest } = useBusinessVerificationRequest(business?.id);

  // Track profile visit
  useEffect(() => {
    if (business?.id) {
      const source = (searchParams.get('source') as SourceType) || 'direct';
      trackBusinessProfileVisit(business.id, user?.id, source);
    }
  }, [business?.id, user?.id, searchParams]);

  const handleDirections = () => {
    if (business?.location) {
      trackBusinessAction(business.id, 'directions', user?.id);
    }
  };

  if (isLoading) {
    return <GenericPageSkeleton />;
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Business not found</h1>
          <p className="text-muted-foreground mb-6">
            This business may have been removed or is no longer available.
          </p>
          <Button onClick={() => navigate(-1)}>
            Go back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PageRoot className="min-h-screen" style={{ background: '#F4F5F7' }}>
      {/* Back button - dark glass container matching course detail page */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-3 left-3 md:top-4 md:left-4 z-20 h-9 w-9 bg-black/20 backdrop-blur-sm rounded-md flex items-center justify-center hover:bg-black/40 transition-colors focus:outline-none"
        aria-label="Go back"
      >
        <ArrowLeft className="!h-5 !w-5 text-white" />
      </button>

      {/* Hero header - Light UI with white card */}
      <BusinessProfileHeader
        business={business}
        membership={membership ?? null}
        postsCount={postsCount}
        followersCount={followersCount}
        followingCount={0}
      />

      {/* Location Card - only when address exists */}
      {business.location && (
        <BusinessLocationCard
          location={business.location}
          lat={null}
          lng={null}
          businessName={business.name}
          onDirections={handleDirections}
        />
      )}

      {/* Tab Navigation - matches personal profile page */}
      <section className="mt-6 px-5">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BusinessTab)} className="w-full">
          <TabsList 
            className="grid w-full rounded-full px-1 py-1"
            style={{ 
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              background: '#F0F0F0',
              border: '1px solid #E0E0E0'
            }}
          >
            <TabsTrigger 
              value="content"
              className="rounded-full text-sm px-3 py-1.5 font-medium transition-all duration-150 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              style={{ color: '#0F0F0F' }}
            >
              Content
            </TabsTrigger>
            <TabsTrigger 
              value="overview"
              className="rounded-full text-sm px-3 py-1.5 font-medium transition-all duration-150 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              style={{ color: '#0F0F0F' }}
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="golfers"
              className="rounded-full text-sm px-3 py-1.5 font-medium transition-all duration-150 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              style={{ color: '#0F0F0F' }}
            >
              Golfers
            </TabsTrigger>
            <TabsTrigger 
              value="info"
              className="rounded-full text-sm px-3 py-1.5 font-medium transition-all duration-150 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              style={{ color: '#0F0F0F' }}
            >
              Info
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </section>

      {/* Tab Content */}
      <div className="pt-6 px-4 sm:px-6 lg:px-8 pb-6">
        <div className="md:max-w-[1150px] md:mx-auto">
          {/* Content tab (default) - mixed media grid */}
          {activeTab === 'content' && (
            <BusinessProfilePosts 
              businessId={business.id}
              businessName={business.name}
              membership={membership ?? null} 
            />
          )}
          {/* Overview tab - deeper LinkedIn-style info */}
          {activeTab === 'overview' && (
            <BusinessProfileOverview 
              business={business} 
              membership={membership}
            />
          )}
          {/* Golfers tab - followers list */}
          {activeTab === 'golfers' && (
            <GolfersHereTab 
              businessId={business.id}
              businessName={business.name}
              businessLocation={business.location || undefined}
            />
          )}
          {/* Info tab - contact and details */}
          {activeTab === 'info' && (
            <BusinessProfileInfo business={business} />
          )}
        </div>
      </div>
    </PageRoot>
  );
};

export default BusinessProfilePage;
