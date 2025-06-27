
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, RefreshCw, Image, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  author?: string;
  content?: string;
  source: {
    name: string;
  };
}

interface NewsResponse {
  articles: NewsArticle[];
  status: string;
  totalResults: number;
}

const News = () => {
  const { toast } = useToast();
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: newsData, isLoading, error, refetch } = useQuery({
    queryKey: ['pga-news'],
    queryFn: async (): Promise<NewsResponse> => {
      const apiKey = 'd9a339f88fa6436b8c5e7ff8af601762';
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=Golf%20PGA%20Tour&language=en&sortBy=publishedAt&apiKey=${apiKey}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      
      return response.json();
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
        <p className="text-red-500 mb-4">Failed to load PGA news articles</p>
        <Button onClick={() => refetch()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  const articles = newsData?.articles || [];

  if (articles.length === 0) {
    return (
      <div className="text-center py-8">
        <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-4">No PGA news articles found</p>
        <Button onClick={() => refetch()}>
          Refresh News
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-center sm:text-left">PGA Tour News</h1>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh News
        </Button>
      </div>

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
                    {article.urlToImage ? (
                      <img
                        src={article.urlToImage}
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
                      <span className="font-medium text-green-600">{article.source.name}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{formatDate(article.publishedAt)}</span>
                      {article.author && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span>By {article.author}</span>
                        </>
                      )}
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
                <span className="font-medium text-green-600">{selectedArticle.source.name}</span>
                <span>•</span>
                <span>{formatDate(selectedArticle.publishedAt)}</span>
                {selectedArticle.author && (
                  <>
                    <span>•</span>
                    <span>By {selectedArticle.author}</span>
                  </>
                )}
              </div>
            )}
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {selectedArticle?.urlToImage && (
              <div className="mb-6">
                <img
                  src={selectedArticle.urlToImage}
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
              
              {selectedArticle?.content && selectedArticle.content !== selectedArticle.description && (
                <div className="prose prose-sm max-w-none">
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {selectedArticle.content.replace(/\[\+\d+ chars\]$/, '...')}
                  </p>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <Button asChild className="w-full sm:w-auto">
                  <a
                    href={selectedArticle?.url}
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
