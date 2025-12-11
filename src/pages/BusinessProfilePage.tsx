import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessPostsCount } from '@/hooks/useBusinessPosts';
import { BusinessProfileHeader } from '@/components/business/BusinessProfileHeader';
import { BusinessProfileOverview } from '@/components/business/BusinessProfileOverview';
import { BusinessProfilePosts } from '@/components/business/BusinessProfilePosts';
import { BusinessProfileInfo } from '@/components/business/BusinessProfileInfo';
import { GenericPageSkeleton } from '@/components/skeletons/GenericPageSkeleton';
import { trackBusinessProfileVisit } from '@/lib/businessAnalyticsTracking';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

type BusinessTab = 'overview' | 'posts' | 'info';
type SourceType = 'search' | 'content' | 'course_page' | 'share' | 'direct';

const BusinessProfilePage = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<BusinessTab>('overview');
  const { user } = useSupabaseSession();

  const { data: business, isLoading, error } = useBusinessProfile(idOrSlug);
  const { data: membership } = useBusinessMembership(business?.id);
  const { data: postsCount = 0 } = useBusinessPostsCount(business?.id);

  // Track profile visit
  useEffect(() => {
    if (business?.id) {
      const source = (searchParams.get('source') as SourceType) || 'direct';
      trackBusinessProfileVisit(business.id, user?.id, source);
    }
  }, [business?.id, user?.id, searchParams]);

  // TODO: Implement followers count when follow system is wired up
  const followersCount = 0;

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
            The business you're looking for doesn't exist or may have been removed.
          </p>
          <Button onClick={() => navigate('/businesses')}>
            Browse businesses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PageRoot className="min-h-screen bg-background">
      {/* Back button - fixed top left */}
      <div className="absolute top-4 left-4 z-20">
        <Button
          variant="glass"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-10 w-10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Hero header - now matches personal profile structure */}
      <BusinessProfileHeader
        business={business}
        membership={membership ?? null}
        postsCount={postsCount}
        followersCount={followersCount}
      />

      {/* Tab Navigation - matches personal profile styling */}
      <section className="mt-6 px-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BusinessTab)} className="w-full">
          <TabsList 
            className="grid w-full rounded-sq-md bg-muted/70 border border-border/60 px-2 py-[3px]"
            style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
          >
            <TabsTrigger 
              value="overview"
              className="rounded-sq-pill text-sm px-3 py-[6px] font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-all"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="posts"
              className="rounded-sq-pill text-sm px-3 py-[6px] font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-all"
            >
              Posts
            </TabsTrigger>
            <TabsTrigger 
              value="info"
              className="rounded-sq-pill text-sm px-3 py-[6px] font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-all"
            >
              Info
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </section>

      {/* Tab Content - with padding matching personal profile */}
      <div className="pt-6 px-4 sm:px-6 lg:px-8 pb-6">
        <div className="md:max-w-[1150px] md:mx-auto">
          {activeTab === 'overview' && (
            <BusinessProfileOverview business={business} />
          )}
          {activeTab === 'posts' && (
            <BusinessProfilePosts 
              businessId={business.id}
              businessName={business.name}
              membership={membership ?? null} 
            />
          )}
          {activeTab === 'info' && (
            <BusinessProfileInfo business={business} />
          )}
        </div>
      </div>
    </PageRoot>
  );
};

export default BusinessProfilePage;
