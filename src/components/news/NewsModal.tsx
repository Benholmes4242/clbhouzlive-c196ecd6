
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, X } from 'lucide-react';

interface NewsArticle {
  title: string;
  description: string;
  link: string;
  pub_date: string;
  source: string;
  image_url?: string;
}

interface NewsModalProps {
  article: NewsArticle | null;
  isOpen: boolean;
  onClose: () => void;
}

const NewsModal = ({ article, isOpen, onClose }: NewsModalProps) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl font-bold pr-8 line-clamp-2">
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
          
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              {article?.description}
            </p>
            
            <div className="pt-4 border-t">
              <Button asChild className="w-full sm:w-auto">
                <a
                  href={article?.link}
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
  );
};

export default NewsModal;
