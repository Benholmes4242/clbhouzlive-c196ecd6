
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw } from 'lucide-react';
import { useNewsData } from './news/useNewsData';
import { filterArticlesByTour } from './news/NewsFilters';
import NewsList from './news/NewsList';
import NewsModal from './news/NewsModal';

interface NewsArticle {
  title: string;
  description: string;
  link: string;
  pub_date: string;
  source: string;
  image_url?: string;
}

const News = () => {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pga');

  const { data: newsData, isLoading, error, refetch } = useNewsData();

  const handleArticleClick = (article: NewsArticle) => {
    setSelectedArticle(article);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedArticle(null);
  };

  const allArticles = newsData || [];
  
  // Articles and tab state optimized

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-center sm:text-left">Golf News</h1>
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
          <NewsList
            articles={filterArticlesByTour(allArticles, 'pga')}
            isLoading={isLoading}
            error={error}
            onArticleClick={handleArticleClick}
            onRefresh={() => refetch()}
          />
        </TabsContent>

        <TabsContent value="liv" className="mt-6">
          <NewsList
            articles={filterArticlesByTour(allArticles, 'liv')}
            isLoading={isLoading}
            error={error}
            onArticleClick={handleArticleClick}
            onRefresh={() => refetch()}
          />
        </TabsContent>

        <TabsContent value="dp" className="mt-6">
          <NewsList
            articles={filterArticlesByTour(allArticles, 'dp')}
            isLoading={isLoading}
            error={error}
            onArticleClick={handleArticleClick}
            onRefresh={() => refetch()}
          />
        </TabsContent>
      </Tabs>

      <div className="text-center text-sm text-muted-foreground mt-8">
        Powered by NewsAPI.org
      </div>

      <NewsModal
        article={selectedArticle}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default News;
