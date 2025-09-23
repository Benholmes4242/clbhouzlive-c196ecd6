import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Filter, Trash2, RotateCcw, Play, Maximize2, Calendar, FileText, Plus, Edit2, MessageSquare, Minimize2, AlertCircle, MessageCircle, Mic, BarChart3, ChevronUp } from 'lucide-react';
import { PiWaveform } from 'react-icons/pi';
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
const HLSVideoPlayer: React.FC<{ src: string; poster?: string; className?: string }> = ({ src, poster, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Check if it's an HLS stream
    const isHLS = src.includes('.m3u8') || src.includes('cloudflarestream.com');
    
    if (isHLS && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      video.src = src;
    } else {
      // Fallback for non-HLS
      video.src = src;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      poster={poster}
      className={className}
      controls
      muted
      playsInline
      preload="metadata"
    />
  );
};

interface SavedInsight {
  id: string;
  content: string;
  summary: string;
  tags: string[];
  category: string;
  timestamp: Date;
}

interface SwingAnalysis {
  id: string;
  save_card: string;
  tags: string[];
  category: string;
  content: string;
  videoThumbnail?: string;
  videoSrc?: string;
  videoPoster?: string;
  videoUrl?: string;
  videoId?: string;
  timestamp: Date;
  voiceNote?: string;
  conversation?: Array<{role: 'user' | 'coach', content: string, timestamp?: string}>;
  title?: string;
}

interface CaddieLog {
  id: string;
  content: string;
  transcription: string | null;
  location_name: string | null;
  course_name: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

interface HistoryMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface ChatConversation {
  id: string;
  title: string;
  customTitle?: string;
  messages: HistoryMessage[];
  timestamp: Date;
  createdAt: Date;
  lastActivityAt: Date;
  messageCount?: number;
}

interface AIChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMessage: (message: string) => void;
  onNewConversation?: () => void;
}

// Swing Analysis Card Component
const SwingAnalysisCard: React.FC<{
  analysis: SwingAnalysis;
  onDelete: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ analysis, onDelete, isExpanded, onToggleExpand }) => {
  const [thumbnailError, setThumbnailError] = useState(false);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleThumbnailError = () => {
    setThumbnailError(true);
    setThumbnailLoading(false);
  };

  const handleThumbnailLoad = () => {
    setThumbnailLoading(false);
  };

  return (
    <div 
      ref={cardRef}
      className={`rounded-2xl bg-white/92 backdrop-blur shadow px-4 py-3 sm:px-5 sm:py-4 hover:-translate-y-0.5 transition-all duration-200 flex flex-col ${isExpanded ? 'shadow-lg h-auto' : ''}`}
      onClick={!isExpanded ? onToggleExpand : undefined}
      style={{ cursor: !isExpanded ? 'pointer' : 'default' }}
    >
      {/* Collapsed Header */}
      <div className="flex-1 flex flex-col">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-2">
          <span className="font-semibold text-sm text-gray-900 flex-shrink-0">
            {analysis.timestamp.toLocaleDateString()}
          </span>
        </div>

        {/* Body Preview */}
        <div className="flex-1 mb-3 overflow-hidden">
          <div className="flex items-start gap-3">
            {/* Left Column - Video Thumbnail */}
            <div className="flex-shrink-0">
              <div className="relative w-20 sm:w-24 aspect-video bg-gray-100 rounded-[10px] overflow-hidden shadow-sm">
                {analysis.videoThumbnail && !thumbnailError ? (
                  <>
                    {thumbnailLoading && (
                      <div className="absolute inset-0 bg-muted animate-pulse" />
                    )}
                     <img 
                       src={analysis.videoThumbnail} 
                       alt="Swing thumbnail"
                       className="w-full h-full object-cover"
                       onError={handleThumbnailError}
                       onLoad={handleThumbnailLoad}
                     />
                     <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                       <div className="bg-white/90 rounded-full p-1.5">
                         <Play className="h-3 w-3 text-black" fill="currentColor" />
                       </div>
                     </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <div className="text-center text-gray-400">
                      <FileText className="h-4 w-4 mx-auto mb-1" />
                      <p className="text-xs">No video</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Text Content */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <h4 className="font-medium text-sm text-gray-900 line-clamp-1 mb-1">
                Swing Analysis
              </h4>
            </div>
          </div>
        </div>

         {/* Action Row */}
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full font-medium">
               Analysis
             </div>
           </div>
           <div className="flex items-center gap-1">
             <Button
               variant="ghost"
               size="sm"
               onClick={(e) => {
                 e.stopPropagation();
                 onToggleExpand();
               }}
                className="h-8 px-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors focus:ring-0 focus:border-0 focus:outline-none"
               title={isExpanded ? "Collapse" : "Expand"}
             >
               {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
             </Button>
             <Button
               variant="ghost"
               size="sm"
               onClick={(e) => {
                 e.stopPropagation();
                 if (window.confirm('Are you sure you want to delete this swing analysis? This action cannot be undone.')) {
                   onDelete();
                 }
               }}
               className="h-8 px-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
               title="Delete"
             >
               <Trash2 className="h-4 w-4" />
             </Button>
           </div>
         </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 animate-accordion-down">
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {/* Video Section */}
             {(analysis.videoUrl || analysis.videoSrc) && !(analysis.videoSrc && analysis.videoSrc.startsWith('blob:')) ? (
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  {isVideoLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-muted-foreground/30"></div>
                    </div>
                  )}
                  <HLSVideoPlayer
                    src={analysis.videoUrl || analysis.videoSrc}
                    poster={analysis.videoThumbnail || analysis.videoPoster}
                    className="w-full h-full"
                  />
                </div>
            ) : analysis.videoThumbnail ? (
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <img 
                  src={analysis.videoThumbnail} 
                  alt="Swing analysis"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                   <div className="text-white text-center p-4">
                     <FileText className="h-8 w-8 mx-auto mb-2" />
                     <p className="text-sm font-medium mb-1">Swing Analysis</p>
                   </div>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No video available</p>
                </div>
              </div>
            )}
            
            {/* Analysis Content */}
            <div className="space-y-3">
              <h5 className="text-sm font-semibold">Analysis Content</h5>
              {analysis.conversation && analysis.conversation.length > 0 ? (
                <div className="space-y-2">
                  {analysis.conversation.map((message, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-[#3da0a9]/5 border-l-4 border-[#3da0a9]' 
                          : 'bg-muted border-l-4 border-muted-foreground'
                      }`}
                    >
                       <div className="flex justify-between items-start mb-2">
                         <div className={`text-xs px-2 py-1 rounded-full ${
                           message.role === 'user' ? 'bg-[#3da0a9]/10 text-[#3da0a9]' : 'bg-gray-100 text-gray-600'
                         }`}>
                           {message.role === 'user' ? 'You' : 'Echo Coach'}
                         </div>
                        {message.timestamp && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {analysis.content}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Skeleton Loading Component
const SkeletonCard: React.FC = () => (
  <div className="rounded-2xl bg-white/92 backdrop-blur shadow px-4 py-3 sm:px-5 sm:py-4 animate-pulse">
    <div className="flex items-start justify-between mb-2">
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      <div className="h-3 bg-gray-200 rounded w-16"></div>
    </div>
    <div className="space-y-2 mb-3">
      <div className="h-3 bg-gray-200 rounded w-full"></div>
      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
    </div>
    <div className="flex items-center justify-between">
      <div className="h-6 bg-gray-200 rounded-full w-20"></div>
      <div className="flex gap-1">
        <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
      </div>
    </div>
  </div>
);

// Empty State Component
const EmptyState: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  subtitle: string;
}> = ({ icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="text-gray-400 mb-4">
      {icon}
    </div>
    <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
    <p className="text-xs text-gray-500">{subtitle}</p>
  </div>
);

// Error State Component
const ErrorState: React.FC<{ 
  message: string; 
  onRetry: () => void;
}> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <div className="text-red-400 mb-4">
      <AlertCircle className="h-8 w-8" />
    </div>
    <p className="text-sm text-red-600 mb-4">{message}</p>
    <Button
      variant="outline"
      size="sm"
      onClick={onRetry}
      className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700 rounded-full px-4 py-1.5 text-xs h-auto font-medium transition-colors"
    >
      <RotateCcw className="h-3 w-3 mr-1" />
      Retry
    </Button>
  </div>
);

const AIChatHistory: React.FC<AIChatHistoryProps> = ({ isOpen, onClose, onSelectMessage, onNewConversation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [historyMessages, setHistoryMessages] = useState<HistoryMessage[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  
  // Get conversation session for chat history  
  const conversationSession = useConversationSession({
    storageKey: 'echo_chat',
    isModalOpen: false // We don't want to trigger auto-save behavior
  });
  
  // Loading and error states
  const [loadingStates, setLoadingStates] = useState({
    conversations: false,
    caddieLogs: false,
    swingAnalyses: false
  });
  const [errorStates, setErrorStates] = useState({
    conversations: null as string | null,
    caddieLogs: null as string | null,
    swingAnalyses: null as string | null
  });
  
  // Unified expansion state - only one card can be expanded at a time across all tabs
  const [expandedCard, setExpandedCard] = useState<{type: 'chat' | 'caddie' | 'swing', id: string} | null>(null);
  const [savedInsights, setSavedInsights] = useState<SavedInsight[]>([]);
  const [swingAnalyses, setSwingAnalyses] = useState<SwingAnalysis[]>([]);

  // Use the caddie logs hook
  const { caddieLogs, loading: caddieLogsLoading, deleteCaddieLog: deleteCaddieLogHook } = useCaddieLogs();
  const [activeTab, setActiveTab] = useState('chat');
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  // Helper function to handle expansion with scroll management
  const handleExpansion = (type: 'chat' | 'caddie' | 'swing', id: string, element?: HTMLElement) => {
    const newExpanded = expandedCard?.type === type && expandedCard?.id === id ? null : { type, id };
    setExpandedCard(newExpanded);
    
    // Scroll management
    if (newExpanded && element) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  const { toast } = useToast();

  // Echo Protection System
  const {
    isProtectionOpen,
    pendingOperation,
    requestEchoAccess,
    handleProtectionSuccess,
    handleProtectionClose
  } = useEchoProtection();

  // Auto-scroll hooks for each tab
  const chatAutoScroll = useAutoScroll({
    dependencies: [conversations, expandedCard],
    enabled: activeTab === 'chat',
    direction: 'top' // Latest conversations are at the top
  });
  
  const logsAutoScroll = useAutoScroll({
    dependencies: [caddieLogs],
    enabled: activeTab === 'insights',
    direction: 'top'
  });
  
  const swingAutoScroll = useAutoScroll({
    dependencies: [swingAnalyses],
    enabled: activeTab === 'swing',
    direction: 'top'
  });

  // Load data when component opens
  useEffect(() => {
    if (isOpen) {
      loadChatConversations();
      // loadCaddieLogs(); // Now handled by hook
      loadSwingAnalyses();
    }
  }, [isOpen]);

  const loadChatConversations = async () => {
    console.log('🔍 Loading chat conversations...');
    setLoadingStates(prev => ({ ...prev, conversations: true }));
    setErrorStates(prev => ({ ...prev, conversations: null }));
    
    try {
      // Load from conversation session hook (database) first
      console.log('📱 Loading from conversation session...');
      await conversationSession.loadConversations();
      console.log('📱 Conversation session data:', conversationSession.conversations.length, 'conversations');
      
      // Convert conversation session format to our chat conversation format
      const sessionConversations = conversationSession.conversations.map(conv => ({
        id: conv.id,
        title: conv.title || "New conversation",
        customTitle: conv.title,
         messages: conv.messages.map((msg, index) => ({
           id: `${conv.id}-${index}`,
           type: (msg.type === 'user' ? 'user' : 'ai') as 'user' | 'ai',
           content: msg.content || '',
           timestamp: new Date(msg.timestamp),
           metadata: msg.metadata
         })),
        timestamp: new Date(conv.lastActivityAt),
        createdAt: new Date(conv.createdAt),
        lastActivityAt: new Date(conv.lastActivityAt),
        messageCount: conv.messages.length
      }));

      console.log('📱 Session conversations processed:', sessionConversations.length);
      setConversations(sessionConversations);

    } catch (error) {
      console.error('Failed to load chat conversations:', error);
      setErrorStates(prev => ({ ...prev, conversations: 'Failed to load conversations. Please try again.' }));
    } finally {
      setLoadingStates(prev => ({ ...prev, conversations: false }));
    }
  };

  const loadSwingAnalyses = async () => {
    setLoadingStates(prev => ({ ...prev, swingAnalyses: true }));
    setErrorStates(prev => ({ ...prev, swingAnalyses: null }));
    
    try {
      // For now, just set empty swing analyses since the table doesn't exist
      setSwingAnalyses([]);
    } catch (error) {
      console.error('Failed to load swing analyses:', error);
      setErrorStates(prev => ({ ...prev, swingAnalyses: 'Failed to load swing analyses. Please try again.' }));
    } finally {
      setLoadingStates(prev => ({ ...prev, swingAnalyses: false }));
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      // Delete from conversation session
      await conversationSession.deleteConversation(conversationId);
      
      // Update local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // Collapse if this conversation was expanded
      if (expandedCard?.type === 'chat' && expandedCard?.id === conversationId) {
        setExpandedCard(null);
      }
      
      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed from your history",
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete the conversation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const deleteSwingAnalysis = async (analysisId: string) => {
    try {
      setSwingAnalyses(prev => prev.filter(analysis => analysis.id !== analysisId));
      
      // Collapse if this analysis was expanded
      if (expandedCard?.type === 'swing' && expandedCard?.id === analysisId) {
        setExpandedCard(null);
      }
      
      toast({
        title: "Analysis deleted",
        description: "The swing analysis has been removed from your history",
      });
    } catch (error) {
      console.error('Error deleting swing analysis:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete the swing analysis. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conversation =>
    conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter swing analyses based on search
  const filteredSwingAnalyses = swingAnalyses.filter(analysis =>
    analysis.save_card.toLowerCase().includes(searchQuery.toLowerCase()) ||
    analysis.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <SlideOver
        open={isOpen}
        onClose={onClose}
        width="w-full"
        zIndex="z-[1100]"
        ariaLabel="Echo History"
      >
        <div 
          className="w-full h-full flex flex-col overflow-hidden"
          style={{
            background: '#F6F7F6',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 flex-shrink-0"
            style={{
              height: '64px',
              background: 'linear-gradient(135deg, #1D3557, #2A9D8F)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.10)'
            }}
          >
            <div className="flex items-center gap-3">
              <PiWaveform 
                size={32} 
                className="text-white/90 transition-all duration-200 ease-in-out"
              />
              <div>
                <h2 className="text-xl font-semibold text-white">Echo History</h2>
                <p className="text-sm text-white/90">Find any past chat or swing</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-white/15 transition-colors duration-120"
            >
              <X className="h-4 w-4 text-white" />
            </Button>
          </div>

          {/* Search and Filter Controls */}
          <div className="px-6 pt-4 pb-2 border-b border-gray-200/50 bg-[rgba(110,146,119,0.06)]">
            <div className="relative">
              <Input
                placeholder="Search conversations and analyses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4 pr-4 py-3 bg-white/85 backdrop-blur-sm border border-white/50 shadow-sm rounded-full text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-primary/20 focus:border-primary/20"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-6 pt-2 pb-4">
              <TabsList className="w-full h-11 rounded-full bg-white/85 backdrop-blur-sm border border-white/50 shadow-sm flex items-center justify-between px-1">
                <TabsTrigger 
                  value="chat" 
                  className="flex-1 rounded-full mx-1 px-4 py-2 text-sm font-medium text-gray-800 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow data-[state=active]:ring-1 data-[state=active]:ring-black/5 transition-all"
                >
                  Chat {filteredConversations.length > 0 && <span className="ml-1 text-gray-500">({filteredConversations.length})</span>}
                </TabsTrigger>
                <TabsTrigger 
                  value="swing" 
                  className="flex-1 rounded-full mx-1 px-4 py-2 text-sm font-medium text-gray-800 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow data-[state=active]:ring-1 data-[state=active]:ring-black/5 transition-all"
                >
                  Swing Coach {filteredSwingAnalyses.length > 0 && <span className="ml-1 text-gray-500">({filteredSwingAnalyses.length})</span>}
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden bg-[rgba(110,146,119,0.06)]">
              {/* Chat Tab */}
              <TabsContent value="chat" className="h-full m-0" role="tabpanel" id="chat-panel" aria-labelledby="chat-tab">
                <ScrollArea 
                  ref={chatAutoScroll.scrollAreaRef}
                  className="h-full overflow-y-auto"
                  style={{ 
                    overscrollBehavior: 'contain',
                    WebkitOverflowScrolling: 'touch',
                    maxHeight: 'calc(100vh - 220px)',
                    flex: '1 1 auto',
                    minHeight: 0
                  }}
                >
                  <div className="space-y-6 px-4 sm:px-6 pb-6">
                    {loadingStates.conversations ? (
                      <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                      </>
                    ) : errorStates.conversations ? (
                      <ErrorState
                        message={errorStates.conversations}
                        onRetry={loadChatConversations}
                      />
                    ) : filteredConversations.length === 0 ? (
                      <EmptyState
                        icon={<MessageCircle className="h-8 w-8" />}
                        title="No conversations found"
                        subtitle="Start a conversation to see your chat history here"
                      />
                    ) : (
                      <>
                        {/* Last 7 Days */}
                        {(() => {
                          const last7Days = filteredConversations.filter(conv => {
                            const daysDiff = Math.floor((Date.now() - conv.timestamp.getTime()) / (1000 * 60 * 60 * 24));
                            return daysDiff <= 7;
                          });
                          
                          if (last7Days.length === 0) return null;
                          
                          return (
                            <div>
                              <h3 className="px-4 sm:px-6 pt-6 pb-2 text-sm font-semibold text-gray-800/80">
                                Last 7 Days
                              </h3>
                              <div className="grid gap-3 px-4 sm:px-6 sm:grid-cols-2">
                                {last7Days.map((conversation) => (
                                  <div 
                                    key={conversation.id} 
                                    className={`
                                      rounded-2xl bg-white/92 backdrop-blur shadow px-4 py-3 sm:px-5 sm:py-4 
                                      hover:-translate-y-0.5 transition-all duration-200
                                      ${expandedCard?.type === 'chat' && expandedCard?.id === conversation.id ? 'bg-white/95 shadow-lg' : 'cursor-pointer'}
                                    `}
                                    style={{
                                      transition: 'max-height 0.25s ease, opacity 0.2s ease'
                                    }}
                                    onClick={expandedCard?.type === 'chat' && expandedCard?.id === conversation.id ? undefined : () => handleExpansion('chat', conversation.id)}
                                  >
                                    {expandedCard?.type === 'chat' && expandedCard?.id === conversation.id ? (
                                      <div>
                                        <div className="flex justify-between items-center mb-3">
                                          <h3 className="text-[17px] font-semibold text-gray-900">
                                            {conversation.customTitle || conversation.title}
                                          </h3>
                                          <button 
                                            onClick={() => setExpandedCard(null)}
                                            aria-label="Collapse" 
                                            className="p-2 rounded-full hover:bg-gray-100"
                                          >
                                            <ChevronUp className="h-4 w-4" />
                                          </button>
                                        </div>

                                        <div className="space-y-3 max-h-80 overflow-y-auto">
                                          {conversation.messages.map((message) => (
                                            <div
                                              key={message.id}
                                              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                              <div
                                                className={`
                                                  max-w-[75%] px-3 py-2 rounded-xl text-sm
                                                  ${message.type === 'user'
                                                    ? 'bg-gradient-to-br from-[#1D3557] to-[#2A9D8F] text-white rounded-br-none'
                                                    : 'bg-gray-100 text-gray-900 rounded-bl-none'}
                                                `}
                                              >
                                                {message.content}
                                              </div>
                                            </div>
                                          ))}
                                        </div>

                                        <div className="mt-3 flex justify-end">
                                          <button 
                                            onClick={() => {
                                              const lastUserMessage = conversation.messages.filter(m => m.type === 'user').pop();
                                              if (lastUserMessage) {
                                                onSelectMessage(lastUserMessage.content);
                                                onClose();
                                              }
                                            }}
                                            className="text-sm font-medium text-[#2A9D8F] hover:underline"
                                          >
                                            Use this response
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-start gap-3">
                                        <div className="h-8 w-8 rounded-full bg-[rgba(110,146,119,0.12)] grid place-items-center text-[18px]">
                                          🗨️
                                        </div>
                                        <div className="flex-1">
                                          <h3 className="text-[17px] font-semibold text-gray-900 leading-tight">
                                            {conversation.customTitle || conversation.title}
                                          </h3>
                                          <p className="text-[14px] text-gray-700/85 mt-1 line-clamp-2">
                                            {conversation.messages.find(m => m.type === 'user')?.content}
                                          </p>
                                          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                                            <span>{conversation.timestamp.toLocaleDateString()}</span>
                                            <span>• {conversation.messages.length} replies</span>
                                            <span className="ml-auto text-sm font-medium text-[#2A9D8F] hover:underline">
                                              Show Conversation
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* This Month */}
                        {(() => {
                          const thisMonth = filteredConversations.filter(conv => {
                            const daysDiff = Math.floor((Date.now() - conv.timestamp.getTime()) / (1000 * 60 * 60 * 24));
                            return daysDiff > 7 && daysDiff <= 30;
                          });
                          
                          if (thisMonth.length === 0) return null;
                          
                          return (
                            <div>
                              <h3 className="px-4 sm:px-6 pt-6 pb-2 text-sm font-semibold text-gray-800/80">
                                This Month
                              </h3>
                              <div className="grid gap-3 px-4 sm:px-6 sm:grid-cols-2">
                                {thisMonth.map((conversation) => (
                                  <div 
                                    key={conversation.id} 
                                    className="rounded-2xl bg-white/92 backdrop-blur shadow px-4 py-3 sm:px-5 sm:py-4 hover:-translate-y-0.5 transition-transform cursor-pointer"
                                    onClick={() => handleExpansion('chat', conversation.id)}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="h-8 w-8 rounded-full bg-[rgba(110,146,119,0.12)] grid place-items-center text-[18px]">
                                        🗨️
                                      </div>
                                      <div className="flex-1">
                                        <h3 className="text-[17px] font-semibold text-gray-900 leading-tight">
                                          {conversation.customTitle || conversation.title}
                                        </h3>
                                        <p className="text-[14px] text-gray-700/85 mt-1 line-clamp-2">
                                          {conversation.messages.find(m => m.type === 'user')?.content}
                                        </p>
                                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                                          <span>{conversation.timestamp.toLocaleDateString()}</span>
                                          <span>• {conversation.messages.length} replies</span>
                                          <span className="ml-auto text-sm font-medium text-[#2A9D8F] hover:underline">
                                            Show Conversation
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Older */}
                        {(() => {
                          const older = filteredConversations.filter(conv => {
                            const daysDiff = Math.floor((Date.now() - conv.timestamp.getTime()) / (1000 * 60 * 60 * 24));
                            return daysDiff > 30;
                          });
                          
                          if (older.length === 0) return null;
                          
                          return (
                            <div>
                              <h3 className="px-4 sm:px-6 pt-6 pb-2 text-sm font-semibold text-gray-800/80">
                                Older
                              </h3>
                              <div className="grid gap-3 px-4 sm:px-6 sm:grid-cols-2">
                                {older.map((conversation) => (
                                  <div 
                                    key={conversation.id} 
                                    className="rounded-2xl bg-white/92 backdrop-blur shadow px-4 py-3 sm:px-5 sm:py-4 hover:-translate-y-0.5 transition-transform cursor-pointer"
                                    onClick={() => handleExpansion('chat', conversation.id)}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="h-8 w-8 rounded-full bg-[rgba(110,146,119,0.12)] grid place-items-center text-[18px]">
                                        🗨️
                                      </div>
                                      <div className="flex-1">
                                        <h3 className="text-[17px] font-semibold text-gray-900 leading-tight">
                                          {conversation.customTitle || conversation.title}
                                        </h3>
                                        <p className="text-[14px] text-gray-700/85 mt-1 line-clamp-2">
                                          {conversation.messages.find(m => m.type === 'user')?.content}
                                        </p>
                                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                                          <span>{conversation.timestamp.toLocaleDateString()}</span>
                                          <span>• {conversation.messages.length} replies</span>
                                          <span className="ml-auto text-sm font-medium text-[#2A9D8F] hover:underline">
                                            Show Conversation
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Swing Coach Tab */}
              <TabsContent value="swing" className="h-full m-0" role="tabpanel" id="swing-panel" aria-labelledby="swing-tab">
                <ScrollArea 
                  ref={swingAutoScroll.scrollAreaRef}
                  className="h-full overflow-y-auto"
                  style={{ 
                    overscrollBehavior: 'contain',
                    WebkitOverflowScrolling: 'touch',
                    maxHeight: 'calc(100vh - 220px)',
                    flex: '1 1 auto',
                    minHeight: 0
                  }}
                >
                  <div className="space-y-6 px-4 sm:px-6 pb-6">
                    {loadingStates.swingAnalyses ? (
                      <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                      </>
                    ) : errorStates.swingAnalyses ? (
                      <ErrorState 
                        message={errorStates.swingAnalyses}
                        onRetry={loadSwingAnalyses}
                      />
                    ) : filteredSwingAnalyses.length === 0 ? (
                      <EmptyState
                        icon={<BarChart3 className="h-8 w-8" />}
                        title="No swing analyses found"
                        subtitle="Upload a swing video to see analyses here"
                      />
                    ) : (
                      <>
                        {/* Group swing analyses by recency */}
                        {(() => {
                          const last7Days = filteredSwingAnalyses.filter(analysis => {
                            const daysDiff = Math.floor((Date.now() - analysis.timestamp.getTime()) / (1000 * 60 * 60 * 24));
                            return daysDiff <= 7;
                          });
                          
                          if (last7Days.length === 0) return null;
                          
                          return (
                            <div>
                              <h3 className="px-4 sm:px-6 pt-6 pb-2 text-sm font-semibold text-gray-800/80">
                                Last 7 Days
                              </h3>
                              <div className="grid gap-3 px-4 sm:px-6 sm:grid-cols-2">
                                {last7Days.map((analysis) => (
                                  <SwingAnalysisCard
                                    key={analysis.id}
                                    analysis={analysis}
                                    onDelete={() => deleteSwingAnalysis(analysis.id)}
                                    isExpanded={expandedCard?.type === 'swing' && expandedCard?.id === analysis.id}
                                    onToggleExpand={() => handleExpansion('swing', analysis.id)}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {(() => {
                          const thisMonth = filteredSwingAnalyses.filter(analysis => {
                            const daysDiff = Math.floor((Date.now() - analysis.timestamp.getTime()) / (1000 * 60 * 60 * 24));
                            return daysDiff > 7 && daysDiff <= 30;
                          });
                          
                          if (thisMonth.length === 0) return null;
                          
                          return (
                            <div>
                              <h3 className="px-4 sm:px-6 pt-6 pb-2 text-sm font-semibold text-gray-800/80">
                                This Month
                              </h3>
                              <div className="grid gap-3 px-4 sm:px-6 sm:grid-cols-2">
                                {thisMonth.map((analysis) => (
                                  <SwingAnalysisCard
                                    key={analysis.id}
                                    analysis={analysis}
                                    onDelete={() => deleteSwingAnalysis(analysis.id)}
                                    isExpanded={expandedCard?.type === 'swing' && expandedCard?.id === analysis.id}
                                    onToggleExpand={() => handleExpansion('swing', analysis.id)}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {(() => {
                          const older = filteredSwingAnalyses.filter(analysis => {
                            const daysDiff = Math.floor((Date.now() - analysis.timestamp.getTime()) / (1000 * 60 * 60 * 24));
                            return daysDiff > 30;
                          });
                          
                          if (older.length === 0) return null;
                          
                          return (
                            <div>
                              <h3 className="px-4 sm:px-6 pt-6 pb-2 text-sm font-semibold text-gray-800/80">
                                Older
                              </h3>
                              <div className="grid gap-3 px-4 sm:px-6 sm:grid-cols-2">
                                {older.map((analysis) => (
                                  <SwingAnalysisCard
                                    key={analysis.id}
                                    analysis={analysis}
                                    onDelete={() => deleteSwingAnalysis(analysis.id)}
                                    isExpanded={expandedCard?.type === 'swing' && expandedCard?.id === analysis.id}
                                    onToggleExpand={() => handleExpansion('swing', analysis.id)}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </SlideOver>

      {/* EchoProtection Modal */}
      {isProtectionOpen && (
        <EchoProtection
          isOpen={isProtectionOpen}
          onClose={handleProtectionClose}
          onSuccess={handleProtectionSuccess}
          operation={pendingOperation}
        />
      )}
    </>
  );
};

export default AIChatHistory;