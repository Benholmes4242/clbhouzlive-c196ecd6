
import React from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatNewsTimestampUS } from '@/i18n/format';


interface NewsArticle {
  title: string;
  description: string;
  link: string;
  pub_date: string;
  source: string;
  image_url?: string;
}

interface NewsCardProps {
  article: NewsArticle;
  onClick: (article: NewsArticle) => void;
}

const NewsCard = ({ article, onClick }: NewsCardProps) => {
  const formatDate = (dateString: string) => formatNewsTimestampUS(new Date(dateString));


  const getFallbackImage = () => {
    return 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop&auto=format';
  };

  return (
    <Card 
      className="hover:shadow-lg transition-shadow max-w-4xl mx-auto cursor-pointer"
      onClick={() => onClick(article)}
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
  );
};

export default NewsCard;
