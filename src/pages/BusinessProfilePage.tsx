import React, { useState, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

type BusinessTab = 'overview' | 'posts' | 'info';

const BusinessProfilePage = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<BusinessTab>('overview');

  const { data: business, isLoading, error } = useBusinessProfile(idOrSlug);
  const { data: membership } = useBusinessMembership(business?.id);
  const { data: postsCount = 0 } = useBusinessPostsCount(business?.id);

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

      {/* Hero header */}
      <BusinessProfileHeader
        business={business}
        membership={membership ?? null}
        postsCount={postsCount}
        followersCount={followersCount}
      />

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BusinessTab)}>
          <TabsList className="w-full md:w-auto grid grid-cols-3 md:inline-grid mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <BusinessProfileOverview business={business} />
          </TabsContent>

          <TabsContent value="posts">
            <BusinessProfilePosts 
              businessId={business.id} 
              membership={membership ?? null} 
            />
          </TabsContent>

          <TabsContent value="info">
            <BusinessProfileInfo business={business} />
          </TabsContent>
        </Tabs>
      </div>
    </PageRoot>
  );
};

export default BusinessProfilePage;
