import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Filter, Trash2, RotateCcw, Play, Maximize2, Calendar, FileText, Plus, Edit2, MessageSquare, Minimize2, AlertCircle, MessageCircle, Mic, BarChart3, ChevronUp, Settings } from 'lucide-react';
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
  defaultCategory?: string;
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
    <article 
      ref={cardRef}
      className={cn(
        "group relative block overflow-hidden rounded-2xl bg-white/92 backdrop-blur shadow-sm border border-black/10 hover:border-black/15",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)] active:translate-y-0 cursor-pointer",
        "focus-visible:outline-none focus-within:ring-2 focus-within:ring-[#2A9D8F]/30",
        isExpanded && "shadow-lg"
      )}
      onClick={!isExpanded ? onToggleExpand : undefined}
      role="button"
      tabIndex={0}
      aria-label={`Swing analysis from ${analysis.timestamp.toLocaleDateString()}`}
    >
      {!isExpanded ? (
        <>
          <div className="px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex items-start gap-2">
              <span className="shrink-0 mt-0.5 px-2 h-6 inline-flex items-center gap-1 rounded-full text-[11px] font-medium bg-[#2A9D8F]/10 text-[#2A9D8F] border border-[#2A9D8F]/20">
                <PiWaveform className="h-3.5 w-3.5" />
                Swing
              </span>
              
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15.5px] sm:text-[16px] font-semibold text-gray-900">
                  Swing Analysis
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[12.5px] text-gray-600">
                  <span className="truncate">
                    {analysis.tags && analysis.tags.length > 0 ? analysis.tags.slice(0, 2).join(' • ') : analysis.content?.substring(0, 60) || 'Golf swing'}
                  </span>
                  <span className="mx-1 h-1 w-1 rounded-full bg-gray-400/60 shrink-0"></span>
                  <time className="shrink-0">{analysis.timestamp.toLocaleDateString()}</time>
                  {analysis.conversation && (
                    <span className="hidden sm:inline text-gray-500 shrink-0">• {analysis.conversation.length} msgs</span>
                  )}
                </div>
              </div>
              
              {analysis.videoThumbnail && (
                <div className="shrink-0 h-10 w-10 rounded-xl overflow-hidden bg-white/80 backdrop-blur border border-black/10">
                  {!thumbnailError ? (
                    <img 
                      src={analysis.videoThumbnail} 
                      alt="Swing preview"
                      className="h-full w-full object-cover"
                      onError={handleThumbnailError}
                      onLoad={handleThumbnailLoad}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <FileText className="h-3 w-3 text-gray-400" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Hover affordance stripe */}
          <div className="pointer-events-none absolute inset-x-0 -bottom-px h-8 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent"></div>
          </div>
        </>
      ) : (
        <div className="px-4 sm:px-5 py-4">{/* Expanded content stays as-is */}
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[17px] font-semibold text-gray-900">
              Swing Analysis
            </h3>
            <div className="flex items-center gap-1">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}
                aria-label="Collapse"
                className="h-8 w-8 grid place-items-center rounded-full hover:bg-black/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40"
              >
                <Minimize2 className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Are you sure you want to delete this swing analysis? This action cannot be undone.')) {
                    onDelete();
                  }
                }}
                aria-label="Delete"
                className="h-8 w-8 grid place-items-center rounded-full hover:bg-red-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </button>
            </div>
          </div>

          {/* Expanded Content - Video & Analysis */}
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
    </article>
  );
};

// Skeleton Loading Component
const SkeletonCard: React.FC = () => (
  <div className="h-[92px] rounded-2xl bg-white/70 backdrop-blur border border-black/10 shadow-sm animate-pulse" />
);

// Empty State Component - Phase 54
const EmptyState: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  subtitle: string;
}> = ({ icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center text-center px-6 py-24 sm:py-32 space-y-5">
    <div className="h-24 w-24 rounded-full bg-white/85 backdrop-blur border border-black/10 shadow grid place-items-center text-gray-700">
      {icon}
    </div>
    <div className="text-[18px] font-semibold text-gray-900">
      {title}
    </div>
    <div className="text-[14px] text-gray-600 max-w-[280px]">
      {subtitle}
    </div>
  </div>
);

// Error State Component - Phase 54
const ErrorState: React.FC<{ 
  message: string; 
  onRetry: () => void;
}> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center text-center px-6 py-20 sm:py-28 space-y-5">
    <div className="h-20 w-20 rounded-full bg-red-50 border border-red-200 text-red-600 grid place-items-center">
      <AlertCircle className="h-9 w-9" />
    </div>
    <div className="text-[17px] font-semibold text-gray-900">
      Something went wrong
    </div>
    <div className="text-[14px] text-gray-600 max-w-[280px]">
      {message}
    </div>
    <button
      onClick={onRetry}
      className="mt-2 h-10 px-5 rounded-full bg-[#2A9D8F] text-white font-medium shadow hover:shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40"
    >
      Retry
    </button>
  </div>
);

const AIChatHistory: React.FC<AIChatHistoryProps> = ({ isOpen, onClose, onSelectMessage, onNewConversation, defaultCategory }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory || 'all');
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
    console.log('🔍 Loading swing analyses...');
    setLoadingStates(prev => ({ ...prev, swingAnalyses: true }));
    setErrorStates(prev => ({ ...prev, swingAnalyses: null }));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user for loading swing analyses');
        setSwingAnalyses([]);
        return;
      }

      const { data, error } = await supabase
        .from('pro_ai_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Swing analyses query result - data:', data, 'error:', error);

      if (error) {
        console.error('Error loading swing analyses:', error);
        setErrorStates(prev => ({ ...prev, swingAnalyses: 'Failed to load swing analyses. Please try again.' }));
        return;
      }

      if (data) {
        const formattedAnalyses = data.map(analysis => {
          const analysisResults = analysis.analysis_results as any;
          const swingContextData = analysis.swing_context as string;
          
          let swingContext: any = {};
          try {
            if (swingContextData) {
              swingContext = JSON.parse(swingContextData);
            }
          } catch (e) {
            console.error('Error parsing swing context:', e);
          }

          return {
            id: analysis.id,
            save_card: analysisResults?.metadata?.save_card || 'Swing Analysis',
            category: analysisResults?.metadata?.category || 'Swing',
            content: analysisResults?.aiResponse || '',
            tags: analysisResults?.metadata?.tags || [],
            videoUrl: analysis.video_url,
            videoThumbnail: swingContext.videoThumbnail || null,
            timestamp: new Date(analysis.created_at)
          };
        });
        console.log('Formatted swing analyses:', formattedAnalyses);
        setSwingAnalyses(formattedAnalyses);
      }
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
    conversation.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.messages.some(msg => msg.content?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter swing analyses based on search
  const filteredSwingAnalyses = swingAnalyses.filter(analysis =>
    analysis.save_card?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    analysis.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <SlideOver
        open={isOpen}
        onClose={onClose}
        width="w-full"
        zIndex="z-[1100]"
        ariaLabel="Echo History"
        backdrop="none"
      >
        {/* Backdrop with vignette */}
        <div 
          className="fixed inset-0 z-[1099] pointer-events-auto"
          style={{
            background: 'radial-gradient(120% 80% at 50% 0%, rgba(0,0,0,0.28), rgba(0,0,0,0.55))',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            willChange: 'backdrop-filter'
          }}
          onClick={onClose}
        />
        
        {/* Panel shell */}
        <div className="fixed inset-0 z-[1100] w-full h-full overflow-hidden pointer-events-auto">
          {/* Safe-area wrapper */}
          <div 
            className="flex h-full flex-col"
            style={{
              paddingTop: 'max(8px, env(safe-area-inset-top))',
              paddingBottom: 'max(8px, env(safe-area-inset-bottom))'
            }}
          >
            {/* Header */}
            <header
              className="relative z-[1] border-b border-white/10 bg-gradient-to-b from-white/60 to-white/40 backdrop-blur-xl supports-[backdrop-filter]:bg-white/50"
              data-echo-topbar
            >
              <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4">
                <div className="h-14 sm:h-16 grid grid-cols-[auto,1fr,auto] items-center gap-2">
                  {/* Left: close button */}
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={onClose}
                    className="h-9 w-9 grid place-items-center rounded-full hover:bg-black/5 active:bg-black/10 transition"
                  >
                    <X className="h-5 w-5 text-gray-700" />
                  </button>

                  {/* Center: title/meta */}
                  <div className="min-w-0 text-center">
                    <div className="truncate text-[17px] sm:text-[18px] font-semibold text-gray-900">
                      Echo History
                    </div>
                    <div className="truncate text-[12px] sm:text-[13px] text-gray-600/90 leading-tight">
                      All chats & swing analyses
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-1.5">
                    {onNewConversation && (
                      <button
                        type="button"
                        aria-label="New chat"
                        onClick={onNewConversation}
                        className="h-9 w-9 grid place-items-center rounded-full hover:bg-black/5 active:bg-black/10 transition"
                      >
                        <Plus className="h-5 w-5 text-gray-700" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {/* hairline highlight */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/30"></div>
            </header>

            {/* Search & Tabs (sticky under header) - Phase 55 */}
            <div className="sticky top-14 sm:top-16 z-[1] bg-gradient-to-b from-white/40 to-transparent backdrop-blur-sm border-b border-white/10">
              <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 py-2">
                {/* Search bar */}
                <div className="flex items-center gap-2 mb-2">
                  <label className="flex-1 h-11 rounded-full bg-white/90 backdrop-blur border border-black/10 shadow-sm px-3 flex items-center gap-2 transition">
                    <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    <input
                      type="search"
                      placeholder="Search Echo…"
                      className="w-full bg-transparent outline-none text-[14px] placeholder:text-gray-500"
                      onChange={(e) => setSearchQuery(e.target.value)}
                      value={searchQuery}
                      aria-label="Search Echo history"
                    />
                    {searchQuery && (
                      <button
                        className="h-7 w-7 grid place-items-center rounded-full hover:bg-black/5 active:scale-[0.98] transition"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    )}
                  </label>

                  {/* Filter button (UI placeholder) */}
                  <button
                    className="h-11 px-4 rounded-full bg-white border border-black/10 hover:bg-gray-50 shadow-sm text-[14px] font-medium text-gray-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40 flex items-center gap-1.5"
                    aria-label="Open filters"
                  >
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">Filter</span>
                  </button>
                </div>

                {/* Tabs */}
                <div className="h-11 w-full rounded-full bg-white/85 backdrop-blur border border-white/50 shadow-sm grid grid-cols-2 gap-1 p-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('chat')}
                    className={cn(
                      "rounded-full px-4 text-[14px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40",
                      activeTab === 'chat' 
                        ? "bg-white shadow ring-1 ring-black/5" 
                        : "text-gray-700 hover:bg-white/50"
                    )}
                  >
                    Chat {filteredConversations.length > 0 && <span className="ml-1 opacity-70">({filteredConversations.length})</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('swing')}
                    className={cn(
                      "rounded-full px-4 text-[14px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40",
                      activeTab === 'swing' 
                        ? "bg-white shadow ring-1 ring-black/5" 
                        : "text-gray-700 hover:bg-white/50"
                    )}
                  >
                    Swing {filteredSwingAnalyses.length > 0 && <span className="ml-1 opacity-70">({filteredSwingAnalyses.length})</span>}
                  </button>
                </div>

                {/* Results header */}
                {(searchQuery || filteredConversations.length > 0 || filteredSwingAnalyses.length > 0) && (
                  <div className="mt-2 text-[12px] text-gray-600">
                    {searchQuery ? (
                      <>
                        Results for <span className="font-medium text-gray-800">&ldquo;{searchQuery}&rdquo;</span> · {' '}
                        {activeTab === 'chat' ? filteredConversations.length : filteredSwingAnalyses.length}
                      </>
                    ) : (
                      <>
                        {activeTab === 'chat' ? 'Recent conversations' : 'Recent analyses'} · {' '}
                        {activeTab === 'chat' ? filteredConversations.length : filteredSwingAnalyses.length}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                  {/* Chat Tab */}
                  <TabsContent value="chat" className="m-0 flex-1" style={{ minHeight: 0 }} role="tabpanel" id="chat-panel" aria-labelledby="chat-tab">
                      <div 
                        className="relative h-full overflow-y-auto overscroll-contain scroll-smooth pt-4 pb-6 px-3 sm:px-4"
                        style={{ WebkitOverflowScrolling: "touch" }}
                        data-echo-canvas
                        ref={chatAutoScroll.scrollAreaRef}
                      >
                        {/* Top fade - Phase 52 */}
                        <div className="pointer-events-none absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-white/60 to-transparent z-10" />
                        {/* Bottom fade - Phase 52 */}
                        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-white/60 to-transparent z-10" />
                         <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 py-5 space-y-4 sm:space-y-5">
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
                      searchQuery ? (
                        <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 py-10">
                          <div className="rounded-2xl bg-white/80 backdrop-blur border border-black/10 text-center px-6 py-10">
                            <div className="mx-auto mb-3 h-12 w-12 rounded-full grid place-items-center bg-white border border-black/10 shadow-sm text-gray-700">
                              <Search className="h-6 w-6" />
                            </div>
                            <div className="text-[17px] font-semibold text-gray-900">No matches</div>
                            <div className="mt-1.5 text-[13px] text-gray-600/90">
                              Try a different search term or clear filters.
                            </div>
                            <div className="mt-4 flex items-center justify-center gap-2">
                              <button 
                                className="h-10 px-4 rounded-full bg-white border border-black/10 hover:bg-gray-50 shadow-sm text-[14px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40"
                                onClick={() => setSearchQuery('')}
                              >
                                Clear search
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <EmptyState
                          icon={<MessageCircle className="h-10 w-10" />}
                          title="No conversations yet"
                          subtitle="Your chats and swing analyses will appear here once you've started."
                        />
                      )
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
                              <h3 className="text-[13px] font-medium text-gray-700 mb-3">
                                Last 7 Days
                              </h3>
                                <div className="space-y-4 sm:space-y-5">
                                 {last7Days.map((conversation) => (
                                   <article 
                                     key={conversation.id} 
                                     className="group relative rounded-2xl bg-white/92 backdrop-blur shadow-sm border border-black/10 hover:border-black/15 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)] active:translate-y-0 focus-within:ring-2 focus-within:ring-[#2A9D8F]/30 px-4 py-3 sm:px-5 sm:py-4 cursor-pointer"
                                     onClick={expandedCard?.type === 'chat' && expandedCard?.id === conversation.id ? undefined : () => handleExpansion('chat', conversation.id)}
                                     role="button"
                                     tabIndex={0}
                                     aria-label={`Open conversation: ${conversation.customTitle || conversation.title}`}
                                     onKeyDown={(e) => {
                                       if (e.key === 'Enter' || e.key === ' ') {
                                         e.preventDefault();
                                         if (!(expandedCard?.type === 'chat' && expandedCard?.id === conversation.id)) {
                                           handleExpansion('chat', conversation.id);
                                         }
                                       }
                                     }}
                                   >
                                     
                                     {expandedCard?.type === 'chat' && expandedCard?.id === conversation.id ? (
                                       <>
                                         <div className="flex justify-between items-center mb-3">
                                           <h3 className="text-[17px] font-semibold text-gray-900">
                                             {conversation.customTitle || conversation.title}
                                           </h3>
                                           <button 
                                             onClick={(e) => {
                                               e.stopPropagation();
                                               setExpandedCard(null);
                                             }}
                                             aria-label="Collapse" 
                                             className="h-8 w-8 grid place-items-center rounded-full hover:bg-black/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40"
                                           >
                                             <ChevronUp className="h-4 w-4 text-gray-600" />
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
                                             onClick={(e) => {
                                               e.stopPropagation();
                                               const lastUserMessage = conversation.messages.filter(m => m.type === 'user').pop();
                                               if (lastUserMessage) {
                                                 onSelectMessage(lastUserMessage.content);
                                                 onClose();
                                               }
                                             }}
                                             className="text-sm font-medium text-[#2A9D8F] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40 rounded"
                                           >
                                             Use this response
                                           </button>
                                         </div>
                                       </>
                                     ) : (
                                       <>
                                         <div className="flex items-start gap-2">
                                           <span className="shrink-0 mt-0.5 px-2 h-6 inline-flex items-center rounded-full text-[11px] font-medium bg-[#2A9D8F]/10 text-[#2A9D8F] border border-[#2A9D8F]/20">
                                             Chat
                                           </span>
                                           <div className="min-w-0 flex-1">
                                             <div className="truncate text-[15.5px] sm:text-[16px] font-semibold text-gray-900">
                                               {conversation.customTitle || conversation.title}
                                             </div>
                                             <div className="mt-1.5 flex items-center gap-2 text-[12.5px] text-gray-600">
                                               <span className="truncate">
                                                 {conversation.messages.find(m => m.type === 'user')?.content || 'No messages yet'}
                                               </span>
                                               <span className="mx-1 h-1 w-1 rounded-full bg-gray-400/60 shrink-0"></span>
                                               <time className="shrink-0">{conversation.timestamp.toLocaleDateString()}</time>
                                               <span className="hidden sm:inline text-gray-500 shrink-0">• {conversation.messages.length} msgs</span>
                                             </div>
                                           </div>
                                         </div>
                                         
                                         {/* Hover affordance stripe */}
                                         <div className="pointer-events-none absolute inset-x-0 -bottom-px h-8 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                                           <div className="mx-4 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent"></div>
                                         </div>
                                       </>
                                     )}
                                   </article>
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
                              <h3 className="text-[13px] font-medium text-gray-700 mb-3">
                                This Month
                              </h3>
                              <div className="space-y-4 sm:space-y-5">
                                {thisMonth.map((conversation) => (
                                  <article 
                                    key={conversation.id} 
                                    className="group relative rounded-2xl bg-white/92 backdrop-blur shadow-sm border border-black/10 hover:border-black/15 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)] active:translate-y-0 focus-within:ring-2 focus-within:ring-[#2A9D8F]/30 px-4 py-3 sm:px-5 sm:py-4 cursor-pointer"
                                    onClick={expandedCard?.type === 'chat' && expandedCard?.id === conversation.id ? undefined : () => handleExpansion('chat', conversation.id)}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Open conversation: ${conversation.customTitle || conversation.title}`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <span className="shrink-0 mt-0.5 px-2 h-6 inline-flex items-center rounded-full text-[11px] font-medium bg-[#2A9D8F]/10 text-[#2A9D8F] border border-[#2A9D8F]/20">
                                        Chat
                                      </span>
                                      <div className="min-w-0 flex-1">
                                        <div className="truncate text-[15.5px] sm:text-[16px] font-semibold text-gray-900">
                                          {conversation.customTitle || conversation.title}
                                        </div>
                                        <div className="mt-1.5 flex items-center gap-2 text-[12.5px] text-gray-600">
                                          <span className="truncate">
                                            {conversation.messages.find(m => m.type === 'user')?.content || 'No messages yet'}
                                          </span>
                                          <span className="mx-1 h-1 w-1 rounded-full bg-gray-400/60 shrink-0"></span>
                                          <time className="shrink-0">{conversation.timestamp.toLocaleDateString()}</time>
                                          <span className="hidden sm:inline text-gray-500 shrink-0">• {conversation.messages.length} msgs</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Hover affordance stripe */}
                                    <div className="pointer-events-none absolute inset-x-0 -bottom-px h-8 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                                      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent"></div>
                                    </div>
                                   </article>
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
                              <h3 className="text-[13px] font-medium text-gray-700 mb-3">
                                Older
                              </h3>
                              <div className="space-y-4 sm:space-y-5">
                                {older.map((conversation) => (
                                  <article 
                                    key={conversation.id} 
                                    className="group relative rounded-2xl bg-white/92 backdrop-blur shadow-sm border border-black/10 hover:border-black/15 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)] active:translate-y-0 focus-within:ring-2 focus-within:ring-[#2A9D8F]/30 px-4 py-3 sm:px-5 sm:py-4 cursor-pointer"
                                    onClick={expandedCard?.type === 'chat' && expandedCard?.id === conversation.id ? undefined : () => handleExpansion('chat', conversation.id)}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Open conversation: ${conversation.customTitle || conversation.title}`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <span className="shrink-0 mt-0.5 px-2 h-6 inline-flex items-center rounded-full text-[11px] font-medium bg-[#2A9D8F]/10 text-[#2A9D8F] border border-[#2A9D8F]/20">
                                        Chat
                                      </span>
                                      <div className="min-w-0 flex-1">
                                        <div className="truncate text-[15.5px] sm:text-[16px] font-semibold text-gray-900">
                                          {conversation.customTitle || conversation.title}
                                        </div>
                                        <div className="mt-1.5 flex items-center gap-2 text-[12.5px] text-gray-600">
                                          <span className="truncate">
                                            {conversation.messages.find(m => m.type === 'user')?.content || 'No messages yet'}
                                          </span>
                                          <span className="mx-1 h-1 w-1 rounded-full bg-gray-400/60 shrink-0"></span>
                                          <time className="shrink-0">{conversation.timestamp.toLocaleDateString()}</time>
                                          <span className="hidden sm:inline text-gray-500 shrink-0">• {conversation.messages.length} msgs</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Hover affordance stripe */}
                                    <div className="pointer-events-none absolute inset-x-0 -bottom-px h-8 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                                      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent"></div>
                                    </div>
                                  </article>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                        
                        {/* End of list marker */}
                        {filteredConversations.length > 0 && (
                          <div className="py-6 text-center text-[12px] text-gray-500 select-none">
                            You're all caught up
                          </div>
                        )}
                       </>
                     )}
                       </div>
                     </div>
                   </TabsContent>

                  {/* Swing Coach Tab */}
                  <TabsContent value="swing" className="m-0 flex-1" style={{ minHeight: 0 }} role="tabpanel" id="swing-panel" aria-labelledby="swing-tab">
                     <div 
                       className="relative h-full overflow-y-auto overscroll-contain scroll-smooth pt-4 pb-6 px-3 sm:px-4"
                       style={{ WebkitOverflowScrolling: "touch" }}
                       data-echo-canvas
                       ref={swingAutoScroll.scrollAreaRef}
                     >
                        {/* Top fade - Phase 52 */}
                        <div className="pointer-events-none absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-white/60 to-transparent z-10" />
                        {/* Bottom fade - Phase 52 */}
                        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-white/60 to-transparent z-10" />
                        <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 py-5 space-y-4 sm:space-y-5">
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
                      searchQuery ? (
                        <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 py-10">
                          <div className="rounded-2xl bg-white/80 backdrop-blur border border-black/10 text-center px-6 py-10">
                            <div className="mx-auto mb-3 h-12 w-12 rounded-full grid place-items-center bg-white border border-black/10 shadow-sm text-gray-700">
                              <Search className="h-6 w-6" />
                            </div>
                            <div className="text-[17px] font-semibold text-gray-900">No matches</div>
                            <div className="mt-1.5 text-[13px] text-gray-600/90">
                              Try a different search term or clear filters.
                            </div>
                            <div className="mt-4 flex items-center justify-center gap-2">
                              <button 
                                className="h-10 px-4 rounded-full bg-white border border-black/10 hover:bg-gray-50 shadow-sm text-[14px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]/40"
                                onClick={() => setSearchQuery('')}
                              >
                                Clear search
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <EmptyState
                          icon={<BarChart3 className="h-8 w-8" />}
                          title="No swing analyses found"
                          subtitle="Upload a swing video to see analyses here"
                        />
                      )
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
                               <h3 className="text-[13px] font-medium text-gray-700 mb-3">
                                 Last 7 Days
                               </h3>
                               <div className="space-y-4 sm:space-y-5">
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
                               <h3 className="text-[13px] font-medium text-gray-700 mb-3">
                                 This Month
                               </h3>
                               <div className="space-y-4 sm:space-y-5">
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
                               <h3 className="text-[13px] font-medium text-gray-700 mb-3">
                                 Older
                               </h3>
                               <div className="space-y-4 sm:space-y-5">
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
                        
                        {/* End of list marker */}
                        {filteredSwingAnalyses.length > 0 && (
                          <div className="py-6 text-center text-[12px] text-gray-500 select-none">
                            You're all caught up
                          </div>
                        )}
                       </>
                     )}
                    </div>
                    </div>
                    </TabsContent>
                 </Tabs>
                </div>
              </div>
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