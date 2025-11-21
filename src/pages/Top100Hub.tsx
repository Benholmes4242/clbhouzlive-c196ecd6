import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import { useTop100Lists } from '@/hooks/useTop100Lists';
import { useUserTop100Progress } from '@/hooks/useUserTop100Progress';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Globe, MapPin } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Top100MyProgressPanel from '@/components/courses/Top100MyProgressPanel';

const Top100Hub = () => {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const { data: lists, isLoading: listsLoading } = useTop100Lists();
  const { data: progress } = useUserTop100Progress(session?.user?.id);
  const [activeTab, setActiveTab] = useState<'courses' | 'my-progress'>('courses');

  const getRegionIcon = (slug: string) => {
    switch (slug) {
      case 'global-top-100':
        return <Globe className="w-8 h-8" />;
      case 'gb-i-top-100':
        return <CountryFlag country="Britain & Ireland" size="lg" />;
      case 'usa-top-100':
        return <CountryFlag country="USA" size="lg" />;
      case 'europe-top-100':
        return <CountryFlag country="Continental Europe" size="lg" />;
      default:
        return <MapPin className="w-8 h-8" />;
    }
  };

  const getRegionBackground = (slug: string) => {
    switch (slug) {
      case 'global-top-100':
        return '/lovable-uploads/bd96819b-505e-4a35-b242-d106babe5179.png';
      case 'gb-i-top-100':
        return 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1200&h=800&fit=crop';
      case 'usa-top-100':
        return 'https://images.unsplash.com/photo-1629048821995-e30a7ba7f063?w=1200&h=800&fit=crop';
      case 'europe-top-100':
        return 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200&h=800&fit=crop';
      default:
        return '';
    }
  };

  const getProgress = (listId: string) => {
    if (!progress) return null;
    return progress.find((p) => p.listId === listId);
  };

  if (listsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ClubhouseHeaderNew />
        <main className="px-4 md:container md:mx-auto md:px-0 py-6 pb-20">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-muted rounded-xl" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ClubhouseHeaderNew />

      <main className="px-4 md:container md:mx-auto md:px-0 py-6 pb-20">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-bold text-foreground mb-3">
              World's Top 100 Golf Courses
            </h1>
            <p className="text-xl text-muted-foreground">
              Explore the most prestigious golf courses across the globe
            </p>
          </div>

          {/* Tabs: Courses | My Progress */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1">
                <TabsTrigger value="courses" className="rounded-md px-4">
                  Courses
                </TabsTrigger>
                <TabsTrigger value="my-progress" className="rounded-md px-4">
                  My Progress
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="courses" className="mt-0">
              {/* Region Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {lists?.map((list) => {
                  const progressData = getProgress(list.id);
                  const backgroundImage = getRegionBackground(list.slug);

                  return (
                    <div
                      key={list.id}
                      onClick={() => navigate(`/top100/${list.slug}`)}
                      className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                      style={{
                        backgroundImage: backgroundImage
                          ? `url(${backgroundImage})`
                          : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      {/* Dark Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

                      {/* Content */}
                      <div className="relative h-full flex flex-col justify-between p-6">
                        {/* Icon */}
                        <div className="flex justify-end">
                          <div className="text-foreground/90">{getRegionIcon(list.slug)}</div>
                        </div>

                        {/* Text Content */}
                        <div className="space-y-3">
                          <h2 className="font-display text-3xl font-bold text-foreground">
                            {list.short_label}
                          </h2>
                          
                          {list.description && (
                            <p className="text-foreground/80 text-lg">{list.description}</p>
                          )}

                          {/* Progress Pill */}
                          {progressData && session && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                              <span className="text-foreground font-medium">
                                You've played {progressData.played} of {progressData.total}
                              </span>
                            </div>
                          )}

                          {/* CTA */}
                          <div className="pt-2">
                            <span className="text-foreground/90 text-lg font-medium group-hover:text-foreground transition-colors">
                              Explore List →
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="my-progress" className="mt-0">
              <Top100MyProgressPanel />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Top100Hub;
