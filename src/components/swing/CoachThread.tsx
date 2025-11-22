import React from 'react';
import { Clock, User, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import AvatarSquircle from '@/components/ui/AvatarSquircle';
import { CoachReviewThread } from '@/types/coach';

interface CoachThreadProps {
  thread?: CoachReviewThread;
  analysisId: string;
  onOpenCoachPicker: () => void;
  onRenewLink?: () => void;
  onCloseReview?: () => void;
}

export const CoachThread: React.FC<CoachThreadProps> = ({
  thread,
  analysisId,
  onOpenCoachPicker,
  onRenewLink,
  onCloseReview
}) => {
  if (!thread) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Not shared</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Share your swing with a local coach for professional feedback
            </p>
          </div>
          
          <Button
            onClick={onOpenCoachPicker}
            size="sm"
            variant="outline"
          >
            Share with a coach
          </Button>
        </div>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Pending</Badge>;
      case 'sent':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Sent</Badge>;
      case 'replied':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Replied</Badge>;
      case 'closed':
        return <Badge variant="secondary" className="bg-slate-100 text-slate-800">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold">Coach Review</h4>
              {getStatusBadge(thread.share.status)}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{thread.coach.name}</span>
              {thread.coach.specialties.length > 0 && (
                <span className="text-xs">• {thread.coach.specialties.slice(0, 2).join(', ')}</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {(thread.share.status === 'pending' || thread.share.status === 'sent') && onRenewLink && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRenewLink}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Renew Link
              </Button>
            )}
            
            {thread.share.status !== 'closed' && onCloseReview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCloseReview}
                className="gap-2 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
                Close
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Messages Thread */}
      {thread.feedback.length > 0 && (
        <div className="space-y-3">
          {thread.feedback.map((feedback) => (
            <Card key={feedback.id} className="p-4">
              <div className="flex items-start gap-3">
                <AvatarSquircle
                  size="sm"
                  fallback={feedback.author === 'coach' ? 
                    thread.coach.name.charAt(0).toUpperCase() : 
                    'S'}
                />
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {feedback.author === 'coach' ? thread.coach.name : 'System'}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-sm">
                      {feedback.message}
                    </div>
                  </div>
                  
                  {feedback.attachments && feedback.attachments.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {feedback.attachments.map((attachment, index) => (
                        <a
                          key={index}
                          href={attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-foreground hover:underline"
                        >
                          Attachment {index + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* No messages yet */}
      {thread.feedback.length === 0 && thread.share.status !== 'pending' && (
        <Card className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Waiting for coach response...
          </p>
        </Card>
      )}
    </div>
  );
};