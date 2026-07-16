
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNewsTimestampUS } from '@/i18n/format';


interface NewsArticle {
  title: string;
  description: string;
  link: string;
  pub_date: string;
  source: string;
  image_url?: string;
  content?: string;
}

interface NewsModalProps {
  article: NewsArticle | null;
  isOpen: boolean;
  onClose: () => void;
}

const NewsModal = ({ article, isOpen, onClose }: NewsModalProps) => {
  const [fullContent, setFullContent] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  const formatDate = (dateString: string) => formatNewsTimestampUS(new Date(dateString));


  const getFallbackImage = () => {
    return 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop&auto=format';
  };

  // Fetch full article content when modal opens
  useEffect(() => {
    if (isOpen && article && article.link) {
      setIsLoadingContent(true);
      setContentError(null);
      
      // Try to extract content from the article if available
      if (article.content && article.content.length > article.description?.length) {
        // Clean up the content (remove [+X chars] indicators from NewsAPI)
        const cleanContent = article.content.replace(/\[\+\d+\s+chars\]$/, '').trim();
        setFullContent(cleanContent);
        setIsLoadingContent(false);
      } else {
        // Fallback to description if no content available
        setFullContent(article.description || '');
        setIsLoadingContent(false);
      }
    }
  }, [isOpen, article]);

  const renderContent = () => {
    if (isLoadingContent) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      );
    }

    if (contentError) {
      return (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{contentError}</p>
          <p className="text-muted-foreground mb-4">
            {article?.description}
          </p>
        </div>
      );
    }

    const contentToShow = fullContent || article?.description || '';
    
    return (
      <div className="space-y-4">
        <div className="prose prose-sm max-w-none">
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">
            {contentToShow}
          </p>
        </div>
        
        {contentToShow.length < 200 && (
          <div className="text-sm text-muted-foreground italic">
            Limited content available. Visit the original article for the full story.
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl font-bold pr-8 line-clamp-3 leading-tight">
              {article?.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {article && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground pt-2">
              <span className="font-medium text-green-600">{article.source}</span>
              <span>•</span>
              <span>{formatDate(article.pub_date)}</span>
            </div>
          )}
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {article?.image_url && (
            <div className="mb-6">
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-64 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = getFallbackImage();
                }}
              />
            </div>
          )}
          
          {renderContent()}
          
          <div className="pt-6 border-t mt-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground">
                <p>© {article?.source}</p>
                <p>Content displayed for informational purposes under fair use.</p>
              </div>
              
              <Button asChild variant="outline" size="sm">
                <a
                  href={article?.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center"
                >
                  View Original Article
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewsModal;
