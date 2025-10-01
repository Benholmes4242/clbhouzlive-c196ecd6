import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Filter, Trash2, RotateCcw, Play, Maximize2, Calendar, FileText, Plus, Edit2, MessageSquare, Minimize2, AlertCircle, MessageCircle, Mic, BarChart3, ChevronUp, Settings, Activity } from 'lucide-react';
import { PiWaveform } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import Hls from 'hls.js';
import EchoAvatar from './EchoAvatar';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { useConversationSession } from '@/hooks/useConversationSession';
import { useCaddieLogs } from '@/hooks/useCaddieLogs';
import { SlideOver } from '@/components/ui/slide-over';
import EchoProtection from './EchoProtection';
import { useEchoProtection } from '@/hooks/useEchoProtection';

// HLS Video Player Component
interface HLSPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}
const HLSPlayer: React.FC<HLSPlayerProps> = ({ src, poster, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls?.recoverMediaError();
              break;
            default:
              hls?.destroy();
              break;
          }
        }
      });
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = src;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      poster={poster}
      controls
      className={className}
      preload="metadata"
    />
  );
};

// Interfaces
interface ChatItem {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

interface SwingItem {
  id: string;
  title: string;
  summary: string;
  timestamp: Date;
  videoCount?: number;
  videoThumbnail?: string;
  tags?: string[];
}

// Skeleton Loading Component
const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl bg-white/70 backdrop-blur border border-black/10 h-24" />
);

// Empty State Component
const EmptyState = ({ type }: { type: 'chat' | 'swing' | 'all' }) => {
  const emptyMessages = {
    chat: {
      icon: "💬",
      title: "No conversations yet",
      description: "Start a chat with Echo to see it here."
    },
    swing: {
      icon: "⛳",
      title: "No swing analyses yet",
      description: "Run a swing analysis to see it here."
    },
    all: {
      icon: "🌊",
      title: "No history yet",
      description: "Start a chat or run a swing analysis to see it here."
    }
  };

  const content = emptyMessages[type];

  return (
    <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 py-16 sm:py-20 grid place-items-center text-center">
      <div className="rounded-3xl bg-white/80 backdrop-blur border border-black/10 shadow-sm px-6 py-8 sm:px-8 sm:py-10">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-white border border-black/10 grid place-items-center mb-3 text-2xl">
          {content.icon}
        </div>
        <h4 className="text-[17px] font-semibold text-gray-900">{content.title}</h4>
        <p className="mt-1.5 text-[13px] text-gray-600">
          {content.description}
        </p>
      </div>
    </div>
  );
};

// Error State Component
const ErrorState = ({ message }: { message: string }) => (
  <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 py-16 sm:py-20 grid place-items-center text-center">
    <div className="rounded-3xl bg-red-50 border border-red-200 shadow-sm px-6 py-8 sm:px-8 sm:py-10">
      <AlertCircle className="mx-auto mb-3 h-12 w-12 text-red-500" />
      <h4 className="text-[17px] font-semibold text-red-700">Error</h4>
      <p className="mt-1.5 text-[13px] text-red-600">{message}</p>
    </div>
  </div>
);

// History Chat Card Component (new simpler version)
const HistoryChatCard = ({
  item,
  onClick
}: {
  item: ChatItem;
  onClick: (id: string) => void;
}) => {
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 0) return 'Today • ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday • ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' • ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <article
      onClick={() => onClick(item.id)}
      className="group rounded-2xl bg-white/92 backdrop-blur border border-black/10 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40 px-4 py-3 sm:px-5 sm:py-4"
    >
      <div className="grid grid-cols-[1fr,auto] gap-3 sm:gap-4">
        {/* Left column: text */}
        <div className="min-w-0">
          <h3 className="text-[16px] sm:text-[17px] font-semibold text-gray-900 line-clamp-2">
            {item.title}
          </h3>
          
          <div className="mt-1.5 flex items-center gap-2 text-[12px] text-gray-600">
            <span className="truncate">{formatTimestamp(item.timestamp)}</span>
            <span className="inline-block h-1 w-1 rounded-full bg-gray-300"></span>
            <span className="truncate">{item.messageCount} messages</span>
          </div>

          <p className="mt-2 text-[13px] leading-5 text-gray-700/90 line-clamp-2">
            {item.lastMessage}
          </p>
        </div>

        {/* Right column: icon */}
        <div className="shrink-0">
          <div className="h-16 w-16 sm:h-[72px] sm:w-[72px] rounded-xl border border-black/10 bg-white/80 backdrop-blur shadow-sm grid place-items-center">
            <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7 text-gray-700" />
          </div>
        </div>
      </div>
    </article>
  );
};

// History Swing Card Component (new simpler version)
const HistorySwingCard = ({
  item,
  onClick
}: {
  item: SwingItem;
  onClick: (id: string) => void;
}) => {
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 0) return 'Today • ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday • ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' • ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <article
      onClick={() => onClick(item.id)}
      className="group rounded-2xl bg-white/92 backdrop-blur border border-black/10 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40 px-4 py-3 sm:px-5 sm:py-4"
    >
      <div className="grid grid-cols-[1fr,auto] gap-3 sm:gap-4">
        {/* Left column: text */}
        <div className="min-w-0">
          <h3 className="text-[16px] sm:text-[17px] font-semibold text-gray-900 line-clamp-2">
            {item.title}
          </h3>
          
          <div className="mt-1.5 flex items-center gap-2 text-[12px] text-gray-600">
            <span className="truncate">{formatTimestamp(item.timestamp)}</span>
            <span className="inline-block h-1 w-1 rounded-full bg-gray-300"></span>
            <span className="truncate">{item.videoCount || 1} video{(item.videoCount || 1) > 1 ? 's' : ''}</span>
          </div>

          {item.tags && item.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {item.tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="h-6 px-2 rounded-full text-[12px] bg-white/80 backdrop-blur border border-black/10 text-gray-700">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p className="mt-2 text-[13px] leading-5 text-gray-700/90 line-clamp-2">
            {item.summary}
          </p>
        </div>

        {/* Right column: video thumbnail */}
        <div className="shrink-0">
          {item.videoThumbnail ? (
            <div className="relative overflow-hidden rounded-xl border border-black/10 bg-white/80 backdrop-blur shadow-sm">
              <img 
                src={item.videoThumbnail} 
                alt="Swing thumbnail"
                className="block h-[64px] w-[96px] sm:h-[72px] sm:w-[108px] object-cover"
              />
              <div className="absolute inset-0 grid place-items-center">
                <div className="h-8 w-8 rounded-full bg-black/60 text-white grid place-items-center text-[10px]">
                  ▶
                </div>
              </div>
            </div>
          ) : (
            <div className="h-16 w-16 sm:h-[72px] sm:w-[72px] rounded-xl border border-black/10 bg-white/80 backdrop-blur shadow-sm grid place-items-center">
              <Activity className="h-6 w-6 sm:h-7 sm:w-7 text-gray-700" />
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

// SwingAnalysisCard and other components would be here if needed

// Main component
const AIChatHistory = () => {
  // State and hooks for chat and swing data, loading, errors, etc.
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [swingItems, setSwingItems] = useState<SwingItem[]>([]);
  const [loadingChat, setLoadingChat] = useState(true);
  const [loadingSwing, setLoadingSwing] = useState(true);
  const [errorChat, setErrorChat] = useState<string | null>(null);
  const [errorSwing, setErrorSwing] = useState<string | null>(null);

  // Example fetch functions (replace with real data fetching)
  useEffect(() => {
    // Simulate fetch chat items
    setTimeout(() => {
      setChatItems([
        {
          id: 'chat1',
          title: 'Chat about golf tips',
          lastMessage: 'Remember to keep your head down!',
          timestamp: new Date(Date.now() - 3600 * 1000 * 2),
          messageCount: 12,
        },
        {
          id: 'chat2',
          title: 'Strategy discussion',
          lastMessage: 'Try the new driver next time.',
          timestamp: new Date(Date.now() - 3600 * 1000 * 24),
          messageCount: 8,
        },
      ]);
      setLoadingChat(false);
    }, 1000);

    // Simulate fetch swing items
    setTimeout(() => {
      setSwingItems([
        {
          id: 'swing1',
          title: '7-Iron swing analysis',
          summary: 'Good tempo but needs more follow-through.',
          timestamp: new Date(Date.now() - 3600 * 1000 * 5),
          videoCount: 2,
          videoThumbnail: 'https://placehold.co/96x64/png',
          tags: ['7-Iron', 'Down-the-line'],
        },
        {
          id: 'swing2',
          title: 'Driver swing review',
          summary: 'Powerful swing with slight slice.',
          timestamp: new Date(Date.now() - 3600 * 1000 * 48),
          videoCount: 1,
          videoThumbnail: '',
          tags: ['Driver', 'Face-on'],
        },
      ]);
      setLoadingSwing(false);
    }, 1200);
  }, []);

  const handleChatClick = (id: string) => {
    console.log('Chat clicked:', id);
  };

  const handleSwingClick = (id: string) => {
    console.log('Swing clicked:', id);
  };

  // Grouping by date example (simple)
  const groupByDate = <T extends { timestamp: Date }>(items: T[]) => {
    const groups: { [key: string]: T[] } = {};
    items.forEach(item => {
      const dateKey = item.timestamp.toLocaleDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });
    return groups;
  };

  const chatGroups = groupByDate(chatItems);
  const swingGroups = groupByDate(swingItems);

  return (
    <Tabs defaultValue="chat" className="w-full max-w-[720px] mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <TabsList className="mb-4">
        <TabsTrigger value="chat">Chat History</TabsTrigger>
        <TabsTrigger value="swing">Swing History</TabsTrigger>
      </TabsList>

      <TabsContent value="chat" className="space-y-4 sm:space-y-5">
        {loadingChat ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : errorChat ? (
          <ErrorState message={errorChat} />
        ) : chatItems.length === 0 ? (
          <EmptyState type="chat" />
        ) : (
          Object.entries(chatGroups).map(([date, items]) => (
            <div key={date}>
              <div className="sticky top-2 z-10 flex justify-center mb-3">
                <div className="px-3 py-1.5 rounded-full bg-white/70 backdrop-blur border border-black/10 text-[11px] text-gray-600 shadow-sm">
                  {date}
                </div>
              </div>
              <div className="space-y-4 sm:space-y-5">
                {items.map(item => (
                  <HistoryChatCard key={item.id} item={item} onClick={handleChatClick} />
                ))}
              </div>
            </div>
          ))
        )}
      </TabsContent>

      <TabsContent value="swing" className="space-y-4 sm:space-y-5">
        {loadingSwing ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : errorSwing ? (
          <ErrorState message={errorSwing} />
        ) : swingItems.length === 0 ? (
          <EmptyState type="swing" />
        ) : (
          Object.entries(swingGroups).map(([date, items]) => (
            <div key={date}>
              <div className="sticky top-2 z-10 flex justify-center mb-3">
                <div className="px-3 py-1.5 rounded-full bg-white/70 backdrop-blur border border-black/10 text-[11px] text-gray-600 shadow-sm">
                  {date}
                </div>
              </div>
              <div className="space-y-4 sm:space-y-5">
                {items.map(item => (
                  <HistorySwingCard key={item.id} item={item} onClick={handleSwingClick} />
                ))}
              </div>
            </div>
          ))
        )}
      </TabsContent>
    </Tabs>
  );
};

export default AIChatHistory;
