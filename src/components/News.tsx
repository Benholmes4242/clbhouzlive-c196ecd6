
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
    // Return a golf-themed placeholder image based on source
    if (source === 'PGA Tour') {
      return 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop&auto=format';
    }
    return 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop&auto=format';
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Golf News</h1>
        <Button onClick={fetchLatestNews} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh News
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <Skeleton className="h-24 w-32 rounded-lg flex-shrink-0" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : articles && articles.length > 0 ? (
        <div className="space-y-4">
          {articles.map((article) => (
            <Card key={article.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-32 h-24 bg-muted rounded-lg overflow-hidden">
                      {article.image_url ? (
                        <img
                          src={article.image_url}
                          alt={article.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to source-specific placeholder on error
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
                  
                  <div className="flex-1 min-w-0">
                    <div className="mb-2">
                      <CardTitle className="text-lg mb-2 line-clamp-2 leading-tight">
                        {article.title}
                      </CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground space-x-2">
                        <span className="font-medium text-green-600">{article.source}</span>
                        <span>•</span>
                        <span>{formatDate(article.pub_date)}</span>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
                      {article.description}
                    </p>
                    
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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No news articles available</p>
          <Button onClick={fetchLatestNews}>
            Fetch Latest News
          </Button>
        </div>
      )}
    </div>
  );
};

export default News;
