
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, RefreshCw, Image, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NewsArticle {
  title: string;
  description: string;
  link: string;
  pub_date: string;
  source: string;
  image_url?: string;
}

const News = () => {
  const { toast } = useToast();
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pga');

  const { data: newsData, isLoading, error, refetch } = useQuery({
    queryKey: ['golf-news'],
    queryFn: async (): Promise<NewsArticle[]> => {
      // First try to get cached articles from database
      const { data: cachedArticles, error: dbError } = await supabase
        .from('news_articles')
        .select('*')
        .order('pub_date', { ascending: false })
        .limit(20);

      if (cachedArticles && cachedArticles.length > 0) {
        return cachedArticles;
      }

      // If no cached articles, fetch fresh ones
      const { data, error } = await supabase.functions.invoke('fetch-news');
      
      if (error) {
        console.error('Error fetching news:', error);
        throw new Error('Failed to fetch news');
      }

      // After fetching, get the updated articles from database
      const { data: freshArticles, error: freshError } = await supabase
        .from('news_articles')
        .select('*')
        .order('pub_date', { ascending: false })
        .limit(20);

      if (freshError) {
        console.error('Error getting fresh articles:', freshError);
        throw new Error('Failed to get fresh articles');
      }

      return freshArticles || [];
    },
  });

  const handleArticleClick = (article: NewsArticle) => {
    setSelectedArticle(article);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedArticle(null);
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

  const getFallbackImage = () => {
    return 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop&auto=format';
  };

  // Filter articles by tour
  const filterArticlesByTour = (articles: NewsArticle[], tour: string) => {
    if (!articles) return [];
    
    switch (tour) {
      case 'pga':
        return articles.filter(article => 
          article.title?.toLowerCase().includes('pga') ||
          article.description?.toLowerCase().includes('pga') ||
          article.source?.toLowerCase().includes('pga')
        );
      case 'liv':
        return articles.filter(article => 
          article.title?.toLowerCase().includes('liv') ||
          article.description?.toLowerCase().includes('liv')
        );
      case 'dp':
        return articles.filter(article => 
          article.title?.toLowerCase().includes('dp world') ||
          article.title?.toLowerCase().includes('european') ||
          article.description?.toLowerCase().includes('dp world') ||
          article.description?.toLowerCase().includes('european')
        );
      default:
        return articles;
    }
  };

  const renderArticlesList = (articles: NewsArticle[]) => {
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

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">Failed to load golf news articles</p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      );
    }

    if (articles.length === 0) {
      return (
        <div className="text-center py-8">
          <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No news articles found for this tour</p>
          <Button onClick={() => refetch()}>
            Refresh News
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {articles.map((article, index) => (
          <Card 
            key={index} 
            className="hover:shadow-lg transition-shadow max-w-4xl mx-auto cursor-pointer"
            onClick={() => handleArticleClick(article)}
          >
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
                          e.currentTarget.src = getFallbackImage();
                        }}
                      />
                    ) : (
                      <img
                        src={getFallbackImage()}
                        alt="Golf news placeholder"
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
                    <Button variant="outline" size="sm">
                      Read More
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

  const allArticles = newsData || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-center sm:text-left">Golf News</h1>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh News
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pga">PGA Tour</TabsTrigger>
          <TabsTrigger value="liv">LIV Golf</TabsTrigger>
          <TabsTrigger value="dp">DP World Tour</TabsTrigger>
        </TabsList>

        <TabsContent value="pga" className="mt-6">
          {renderArticlesList(filterArticlesByTour(allArticles, 'pga'))}
        </TabsContent>

        <TabsContent value="liv" className="mt-6">
          {renderArticlesList(filterArticlesByTour(allArticles, 'liv'))}
        </TabsContent>

        <TabsContent value="dp" className="mt-6">
          {renderArticlesList(filterArticlesByTour(allArticles, 'dp'))}
        </TabsContent>
      </Tabs>

      <div className="text-center text-sm text-muted-foreground mt-8">
        Powered by NewsAPI.org
      </div>

      {/* Article Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-start justify-between">
              <DialogTitle className="text-xl font-bold pr-8 line-clamp-2">
                {selectedArticle?.title}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseModal}
                className="h-6 w-6 p-0 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {selectedArticle && (
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground pt-2">
                <span className="font-medium text-green-600">{selectedArticle.source}</span>
                <span>•</span>
                <span>{formatDate(selectedArticle.pub_date)}</span>
              </div>
            )}
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {selectedArticle?.image_url && (
              <div className="mb-6">
                <img
                  src={selectedArticle.image_url}
                  alt={selectedArticle.title}
                  className="w-full h-64 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = getFallbackImage();
                  }}
                />
              </div>
            )}
            
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {selectedArticle?.description}
              </p>
              
              <div className="pt-4 border-t">
                <Button asChild className="w-full sm:w-auto">
                  <a
                    href={selectedArticle?.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center"
                  >
                    Read Full Article
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default News;
