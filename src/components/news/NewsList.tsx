
import React from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Image } from 'lucide-react';
import NewsCard from './NewsCard';

interface NewsArticle {
  title: string;
  description: string;
  link: string;
  pub_date: string;
  source: string;
  image_url?: string;
}

interface NewsListProps {
  articles: NewsArticle[];
  isLoading: boolean;
  error: any;
  onArticleClick: (article: NewsArticle) => void;
  onRefresh: () => void;
}

const NewsList = ({ articles, isLoading, error, onArticleClick, onRefresh }: NewsListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="max-w-4xl mx-auto">
            <div className="p-6">
              <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
              <Skeleton className="h-4 w-1/2 mx-auto mb-4" />
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Skeleton className="h-24 w-full sm:w-32 rounded-lg flex-shrink-0 mx-auto sm:mx-0" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Failed to load golf news articles</p>
        <Button onClick={onRefresh} variant="outline">
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
        <Button onClick={onRefresh}>
          Refresh News
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article, index) => (
        <NewsCard
          key={index}
          article={article}
          onClick={onArticleClick}
        />
      ))}
    </div>
  );
};

export default NewsList;
