/**
 * PostInsightsModal - Clean stats display for views/likes/comments
 */
import React from 'react';
import { X, Eye, Heart, MessageCircle } from 'lucide-react';
import { usePostInsights } from '@/hooks/usePostInsights';
import { cn } from '@/lib/utils';

interface PostInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

export function PostInsightsModal({ isOpen, onClose, postId }: PostInsightsModalProps) {
  const { data: insights, isLoading } = usePostInsights(postId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-sq-lg shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <h2 className="text-lg font-semibold text-foreground">Post insights</h2>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Stats */}
        <div className="p-5 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-6 w-12 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <InsightRow 
                icon={Eye}
                label="Views"
                value={insights?.views ?? 0}
                iconColor="text-blue-500"
              />
              <InsightRow 
                icon={Heart}
                label="Likes"
                value={insights?.likes ?? 0}
                iconColor="text-red-500"
              />
              <InsightRow 
                icon={MessageCircle}
                label="Comments"
                value={insights?.comments ?? 0}
                iconColor="text-emerald-500"
              />
            </>
          )}
        </div>

        {/* Footer note */}
        <div className="px-5 pb-5">
          <p className="text-xs text-muted-foreground text-center">
            Data from the last 30 days
          </p>
        </div>
      </div>
    </div>
  );
}

function InsightRow({ 
  icon: Icon, 
  label, 
  value, 
  iconColor 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: number;
  iconColor: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center",
        "bg-muted/50"
      )}>
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>
      <span className="flex-1 text-sm text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold text-foreground">
        {value.toLocaleString()}
      </span>
    </div>
  );
}

export default PostInsightsModal;
