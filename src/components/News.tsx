
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, RefreshCw, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  link: string;
  pub_date: string;
  source: string;
  image_url?: string;
}

const News = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pga');

  const { data: articles, isLoading, error, refetch } = useQuery({
    queryKey: ['news-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .order('pub_date', { ascending: false });

      if (error) throw error;
      return data as NewsArticle[];
    },
  });

  const fetchLatestNews = async () => {
    try {
      const { error } = await supabase.functions.invoke('fetch-news');
      if (error) throw error;
      
      toast({
        title: "News Updated",
        description: "Latest golf news has been fetched successfully.",
      });
      
      refetch();
    } catch (error) {
      console.error('Error fetching news:', error);
      toast({
        title: "Error",
        description: "Failed to fetch latest news. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getImageForSource = (source: string) => {
    if (source === 'PGA Tour') {
      return 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop&auto=format';
    }
    return 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop&auto=format';
  };

  const filterArticlesByCategory = (category: string) => {
    if (!articles) return [];
    
    switch (category) {
      case 'pga':
        return articles.filter(article => 
          article.source.toLowerCase().includes('pga') ||
          article.title.toLowerCase().includes('pga') ||
          article.description.toLowerCase().includes('pga tour')
        );
      case 'liv':
        return articles.filter(article => 
          article.title.toLowerCase().includes('liv') ||
          article.title.toLowerCase().includes('leaderboard') ||
          article.title.toLowerCase().includes('tournament') ||
          article.description.toLowerCase().includes('liv')
        );
      case 'dpworld':
        return articles.filter(article => 
          article.title.toLowerCase().includes('dp world') ||
          article.title.toLowerCase().includes('european tour') ||
          article.title.toLowerCase().includes('ryder cup') ||
          article.description.toLowerCase().includes('dp world') ||
          article.description.toLowerCase().includes('european tour')
        );
      default:
        return articles;
    }
  };

  const renderNewsContent = (filteredArticles: NewsArticle[]) => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="max-w-4xl mx-auto">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <Skeleton className="h-24 w-full sm:w-32 rounded-lg flex-shrink-0 mx-auto sm:mx-0" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (filteredArticles.length === 0) {
      return (
        <div className="text-center py-8">
          <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No articles found for this category</p>
          <Button onClick={fetchLatestNews}>
            Fetch Latest News
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredArticles.map((article) => (
          <Card key={article.id} className="hover:shadow-lg transition-shadow max-w-4xl mx-auto">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex-shrink-0 mx-auto sm:mx-0">
                  <div className="w-full sm:w-32 h-24 bg-muted rounded-lg overflow-hidden">
                    {article.image_url ? (
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = getImageForSource(article.source);
                        }}
                      />
                    ) : (
                      <img
                        src={getImageForSource(article.source)}
                        alt={`${article.source} placeholder`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <div className="mb-2">
                    <CardTitle className="text-lg mb-2 line-clamp-2 leading-tight">
                      {article.title}
                    </CardTitle>
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start text-sm text-muted-foreground space-y-1 sm:space-y-0 sm:space-x-2">
                      <span className="font-medium text-green-600">{article.source}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{formatDate(article.pub_date)}</span>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
                    {article.description}
                  </p>
                  
                  <div className="flex justify-center sm:justify-start">
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center"
                      >
                        Read More
                        <ExternalLink className="h-3 w-3 ml-2" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Failed to load news articles</p>
        <Button onClick={() => refetch()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-center sm:text-left">Golf News</h1>
        <Button onClick={fetchLatestNews} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh News
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pga">PGA Tour</TabsTrigger>
          <TabsTrigger value="liv">LIV Golf</TabsTrigger>
          <TabsTrigger value="dpworld">DP World Tour</TabsTrigger>
        </TabsList>

        <TabsContent value="pga" className="mt-6">
          {renderNewsContent(filterArticlesByCategory('pga'))}
        </TabsContent>

        <TabsContent value="liv" className="mt-6">
          {renderNewsContent(filterArticlesByCategory('liv'))}
        </TabsContent>

        <TabsContent value="dpworld" className="mt-6">
          {renderNewsContent(filterArticlesByCategory('dpworld'))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default News;
