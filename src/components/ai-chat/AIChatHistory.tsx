import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search, Filter, Trash2, RotateCcw, Play, Maximize2, Calendar, FileText, Plus, Edit2, MessageSquare, Minimize2, AlertCircle, MessageCircle, Mic, BarChart3, ChevronUp, Settings } from 'lucide-react';
import { PiWaveform } from 'react-icons/pi';

console.log('🔴 [AIChatHistory] MODULE LOADED - Timestamp:', Date.now());

import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import Hls from 'hls.js';
import EchoAvatar from './EchoAvatar';
import ChatMessage from './ChatMessage';
import { EchoMessageRow } from '@/features/echo/components/EchoMessageRow';
import type { EchoMessage as EchoRowMessage } from '@/features/echo/state/echoTypes';

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
import { useEchoConversationsOptional } from '@/features/echo/components/EchoConversationsProvider';
import { analyticsEvents } from '@/utils/analyticsEvents';
import {
  getLegacyConversations,
  type ChatConversationRow,
} from '@/features/echo/utils/echoLegacy';
import { useEchoLegacyMigration } from '@/features/echo/hooks/useEchoLegacyMigration';
import { LegacyImportBanner } from '@/features/echo/components/LegacyImportBanner';
import { LocalTag } from '@/features/echo/components/LocalTag';

// HLS Video Player Component
export const HLSVideoPlayer: React.FC<{ src: string; poster?: string; className?: string }> = ({ src, poster, className }) => {
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
  source?: 'db' | 'legacy';
}

interface AIChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMessage: (message: string) => void;
  onNewConversation?: () => void;
  defaultCategory?: string;
  initialTab?: 'chat' | 'swing';
  paneMode?: boolean;
  layout?: 'overlay' | 'page'; // NEW - page mode strips all chrome for Hub integration
}

// Swing Analysis Card Component
  const SwingAnalysisCard: React.FC<{
  analysis: SwingAnalysis;
  onDelete: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  navigate?: (path: string) => void; // NEW - for page mode navigation
  isPageMode?: boolean; // NEW - to control behavior
}> = ({ analysis, onDelete, isExpanded, onToggleExpand, navigate: navigateFn, isPageMode }) => {
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

  const handleCardClick = () => {
    if (isExpanded) return;
    
    console.log('🎯 [SwingAnalysisCard] Clicked:', {
      analysisId: analysis.id,
      isPageMode,
      hasNavigateFn: !!navigateFn,
      willNavigate: isPageMode && !!navigateFn
    });
    
    if (isPageMode && navigateFn) {
      navigateFn(`/hub/echo/history/swing/${analysis.id}`);
    } else {
      onToggleExpand();
    }
  };

  return (
    <article 
      ref={cardRef}
      className={cn(
        "group relative block overflow-hidden rounded-2xl bg-white/06 backdrop-blur border border-white/08 hover:border-white/12",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] active:translate-y-0 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.3)]",
        "focus-visible:outline-none focus-within:ring-2 focus-within:ring-white/20",
        isExpanded && "shadow-lg"
      )}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-label={`Swing analysis from ${analysis.timestamp.toLocaleDateString()}`}
    >
      {!isExpanded ? (
        <>
          <div className="px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex items-start gap-2">
              <span className="shrink-0 mt-0.5 px-2 h-6 inline-flex items-center gap-1 rounded-md text-meta font-medium bg-white/08 backdrop-blur border border-white/12 text-white/80">
                <PiWaveform className="h-3.5 w-3.5" />
                Swing
              </span>
              
              <div className="min-w-0 flex-1">
                <div className="truncate text-body-md font-semibold text-white">
                  Swing Analysis
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-meta text-white/60">
                  <span className="truncate">
                    {analysis.tags && analysis.tags.length > 0 ? analysis.tags.slice(0, 2).join(' • ') : analysis.content?.substring(0, 60) || 'Golf swing'}
                  </span>
                  <span className="mx-1 h-1 w-1 rounded-full bg-white/20 shrink-0"></span>
                  <time className="shrink-0 text-white/40">{analysis.timestamp.toLocaleDateString()}</time>
                  {analysis.conversation && (
                    <span className="hidden sm:inline text-white/40 shrink-0">• {analysis.conversation.length} msgs</span>
                  )}
                </div>
              </div>
              
              {analysis.videoThumbnail && (
                <div className="shrink-0 h-10 w-10 rounded-xl overflow-hidden bg-white/06 backdrop-blur border border-white/08">
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
                      <FileText className="h-3 w-3 text-white/60" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Hover affordance stripe */}
          <div className="pointer-events-none absolute inset-x-0 -bottom-px h-8 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/06 to-transparent"></div>
          </div>
        </>
      ) : (
        <div className="px-4 sm:px-5 py-4">{/* Expanded content stays as-is */}
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-heading-md font-semibold leading-snug text-white">
              Swing Analysis
            </h3>
            <div className="flex items-center gap-1">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}
                aria-label="Collapse"
                className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/08 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 text-white/80"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Are you sure you want to delete this swing analysis? This action cannot be undone.')) {
                    onDelete();
                  }
                }}
                aria-label="Delete"
                className="h-8 w-8 grid place-items-center rounded-full hover:bg-red-900/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <Trash2 className="h-4 w-4 text-red-400" />
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
                         <div className={`text-meta px-2 py-1 rounded-full ${
                           message.role === 'user' ? 'bg-[#3da0a9]/10 text-[#3da0a9]' : 'bg-gray-100 text-gray-600'
                         }`}>
                           {message.role === 'user' ? 'You' : 'Echo Coach'}
                         </div>
                        {message.timestamp && (
                          <span className="text-meta text-muted-foreground">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="text-body-md leading-relaxed whitespace-pre-wrap">
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
  <div className="h-[92px] rounded-2xl bg-white/04 border border-white/06 animate-pulse" />
);

// Empty State Component - Phase 54
const EmptyState: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  subtitle: string;
}> = ({ icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center text-center px-6 py-24 sm:py-32 space-y-5">
    <div className="h-24 w-24 rounded-full bg-white/08 backdrop-blur border border-white/12 grid place-items-center text-white/60">
      {icon}
    </div>
    <div className="font-display text-heading-lg font-semibold leading-snug text-white">
      {title}
    </div>
    <div className="text-body-md text-white/60 max-w-[280px]">
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
    <div className="h-20 w-20 rounded-full bg-red-900/20 border border-red-500/20 text-red-400 grid place-items-center">
      <AlertCircle className="h-9 w-9" />
    </div>
    <div className="text-heading-md font-semibold leading-snug text-white">
      Something went wrong
    </div>
    <div className="text-body-md text-white/60 max-w-[280px]">
      {message}
    </div>
    <Button
      variant="secondary"
      onClick={onRetry}
      className="mt-2"
    >
      Retry
    </Button>
  </div>
);

const AIChatHistory: React.FC<AIChatHistoryProps> = ({ isOpen, onClose, onSelectMessage, onNewConversation, defaultCategory, initialTab = 'chat', paneMode = false, layout = 'overlay' }) => {
  const navigate = useNavigate();
  const isPageMode = layout === 'page';
  
  console.log('🚀 [AIChatHistory] Component mounted/updated', { isOpen, paneMode, initialTab, layout });
  
  // Legacy migration hook
  const {
    hasLegacy,
    needsConsent,
    isMigrating,
    acceptAndMigrate,
    dismissMigration,
  } = useEchoLegacyMigration({ batchSize: 25, requireConsent: true });
  
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory || 'all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [historyMessages, setHistoryMessages] = useState<HistoryMessage[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  
  // Swing pagination
  const [swingPage, setSwingPage] = useState(0);
  const [swingHasMore, setSwingHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  
  // ✅ Correct: Always call hook (Rules of Hooks), but only use when paneMode
  const echoCtx = useEchoConversationsOptional(); // Won't throw if no provider
  const providerConvos = (paneMode && echoCtx) ? echoCtx.conversations : [];
  
  console.log('🔍 [AIChatHistory] Context check:', {
    paneMode,
    hasContext: !!echoCtx,
    providerCount: providerConvos.length,
    conversationsCount: conversations.length
  });
  
  // Debug logging
  useEffect(() => {
    if (paneMode) {
      console.log('🔍 [AIChatHistory] Provider conversations:', {
        hasContext: !!echoCtx,
        count: providerConvos.length,
        sample: providerConvos.slice(0, 3).map(c => ({ id: c.id, title: c.title }))
      });
    }
  }, [paneMode, echoCtx, providerConvos.length]);
  
  // DB session for single source of truth in Hub
  const session = useConversationSession({
    storageKey: 'echo_chat',
    isModalOpen: false
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
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  // Helper function to handle expansion with scroll management
  const handleExpansion = (type: 'chat' | 'caddie' | 'swing', id: string, element?: HTMLElement, source?: 'db' | 'legacy') => {
    // ✅ In paneMode, navigate to detail view instead of expanding
    if (paneMode) {
      if (type === 'chat') {
        analyticsEvents.track('hub_echo_history_open', { category: 'hub', label: 'chat', source: source ?? 'db' });
        navigate(`/hub/echo/history/chat/${id}`);
      } else if (type === 'swing') {
        analyticsEvents.track('hub_echo_history_open', { category: 'hub', label: 'swing', source: source ?? 'db' });
        navigate(`/hub/echo/history/swing/${id}`);
      }
      return;
    }

    // Regular expansion behavior for overlay mode
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

  // Mapper function for session conversations
  function mapSessionToRows(input: typeof session.conversations): ChatConversationRow[] {
    return input.map(conv => ({
      id: conv.id,
      title: conv.title ?? 'New conversation',
      createdAt: conv.createdAt.toISOString(),
      lastActivityAt: conv.lastActivityAt.toISOString(),
      messages: conv.messages.map((m, i) => ({
        id: m.id ?? `${conv.id}-${i}`,
        type: m.type === 'user' ? 'user' : 'ai',
        content: m.content ?? '',
        timestamp: m.timestamp.toISOString(),
        metadata: m.metadata,
      })),
    }));
  }

  // Load data when component opens or when provider data changes
  useEffect(() => {
    if (isOpen) {
      analyticsEvents.track('hub_echo_open', { category: 'hub' });
      loadPage(0);
      loadSwingPage(0);
    }
  }, [isOpen]);

  // Track tab switches
  useEffect(() => {
    if (isOpen && activeTab) {
      analyticsEvents.track('hub_echo_tab', { category: 'hub', label: activeTab });
    }
  }, [activeTab, isOpen]);

  // Load chat conversations with pagination (DB + legacy localStorage merged)
  async function loadPage(nextPage = 0) {
    if (loadingStates.conversations) return;
    
    setLoadingStates(prev => ({ ...prev, conversations: true }));
    setErrorStates(prev => ({ ...prev, conversations: null }));
    
    try {
      const rows: Array<{ id: string; title: string; dateISO: string; count?: number; source: 'db' | 'legacy' }> = [];

      // 1) DB first (when available) - DB takes precedence
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const from = nextPage * PAGE_SIZE;
          const to = from + PAGE_SIZE - 1;

          // Note: This uses legacy conversation columns - using any to bypass type checking
          const conversationsTable = supabase.from('conversations') as any;
          const { data, error } = await conversationsTable
            .select('*')
            .eq('user_id', user.id)
            .eq('conversation_type', 'chat')
            .order('updated_at', { ascending: false })
            .range(from, to);

          if (!error && data) {
            for (const conv of data) {
              const messages = Array.isArray(conv.messages) ? conv.messages : [];
              rows.push({
                id: conv.id,
                title: conv.title ?? 'New conversation',
                dateISO: conv.updated_at || conv.created_at,
                count: messages.length,
                source: 'db'
              });
            }
          }
        }
      } catch (e) {
        console.warn('DB chat history load skipped', e);
      }

      // 2) Legacy localStorage (merged)
      try {
        const legacy = getLegacyConversations();
        for (const conv of legacy) {
          rows.push({
            id: conv.id,
            title: conv.title,
            dateISO: conv.lastActivityAt || conv.createdAt,
            count: conv.messages?.length || undefined,
            source: 'legacy'
          });
        }
      } catch (e) {
        console.warn('Legacy chat history load skipped', e);
      }

      // 3) De-dup by id (DB wins over legacy), sort desc
      const dedup = new Map<string, { id: string; title: string; dateISO: string; count?: number; source: 'db' | 'legacy' }>();
      for (const r of rows) {
        if (r.id && (!dedup.has(r.id) || r.source === 'db')) {
          dedup.set(r.id, r);
        }
      }
      const merged = Array.from(dedup.values())
        .sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime())
        .slice(0, PAGE_SIZE);

      // Helper for safe date parsing
      const toDate = (v?: string) => (v && !Number.isNaN(Date.parse(v)) ? new Date(v) : new Date());

      // Map to UI format
      const uiRows = merged.map(row => ({
        id: row.id,
        title: row.title,
        customTitle: row.title,
        messages: [],
        timestamp: toDate(row.dateISO),
        createdAt: toDate(row.dateISO),
        lastActivityAt: toDate(row.dateISO),
        messageCount: row.count,
        source: row.source
      }));

      setHasMore(merged.length === PAGE_SIZE);
      setConversations(prev => nextPage === 0 ? uiRows : [...prev, ...uiRows]);
      setPage(nextPage);

      console.log('✅ [loadPage] Loaded conversations (DB + legacy):', {
        page: nextPage,
        loaded: merged.length,
        dbCount: rows.filter(r => r.source === 'db').length,
        legacyCount: rows.filter(r => r.source === 'legacy').length,
        hasMore: merged.length === PAGE_SIZE
      });
    } catch (error) {
      console.error('Failed to load chat conversations:', error);
      setErrorStates(prev => ({ ...prev, conversations: 'Failed to load conversations. Please try again.' }));
    } finally {
      setLoadingStates(prev => ({ ...prev, conversations: false }));
    }
  }

  // Load swing analyses with pagination
  async function loadSwingPage(nextPage = 0) {
    if (loadingStates.swingAnalyses) return;
    
    setLoadingStates(prev => ({ ...prev, swingAnalyses: true }));
    setErrorStates(prev => ({ ...prev, swingAnalyses: null }));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSwingAnalyses([]);
        setSwingHasMore(false);
        return;
      }

      const from = nextPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from('pro_ai_analyses')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Error loading swing analyses:', error);
        setErrorStates(prev => ({ ...prev, swingAnalyses: 'Failed to load swing analyses. Please try again.' }));
        setSwingHasMore(false);
        return;
      }

      const formattedAnalyses = (data ?? []).map(analysis => {
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

      setSwingHasMore((from + formattedAnalyses.length) < (count ?? 0));
      setSwingAnalyses(prev => nextPage === 0 ? formattedAnalyses : [...prev, ...formattedAnalyses]);
      setSwingPage(nextPage);

      console.log('✅ [loadSwingPage] Loaded swing analyses:', {
        page: nextPage,
        loaded: formattedAnalyses.length,
        total: count,
        hasMore: (from + formattedAnalyses.length) < (count ?? 0)
      });
    } catch (error) {
      console.error('Failed to load swing analyses:', error);
      setErrorStates(prev => ({ ...prev, swingAnalyses: 'Failed to load swing analyses. Please try again.' }));
    } finally {
      setLoadingStates(prev => ({ ...prev, swingAnalyses: false }));
    }
  }

  const deleteConversation = async (conversationId: string) => {
    try {
      // Delete from DB session
      await session.deleteConversation(conversationId);
      
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

  // Pane mode: render inline without SlideOver modal chrome
  if (paneMode) {
    return (
      <div className={cn(
        "h-full w-full flex flex-col overflow-hidden",
        !isPageMode && "bg-gradient-to-b from-black via-[#0A0A0A] to-black"
      )}>
        {/* Search & Tabs */}
        <div className={cn(
          "border-b border-white/08",
          !isPageMode && "bg-gradient-to-b from-black/60 to-transparent backdrop-blur-sm"
        )}>
          <div className={cn(isPageMode ? "px-0 py-3" : "px-4 py-2")}>
            {/* Search bar */}
            <div className="flex items-center gap-2 mb-2">
              <label className="flex-1 h-11 rounded-xl bg-white/06 backdrop-blur border border-white/12 px-3 flex items-center gap-2 transition focus-within:bg-white/08 focus-within:border-white/20">
                <Search className="h-4 w-4 text-white/60" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search Echo…"
                  className="w-full bg-transparent outline-none text-body-md text-white placeholder:text-white/40"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  value={searchQuery}
                  aria-label="Search Echo history"
                />
                {searchQuery && (
                  <button
                    className="h-7 w-7 grid place-items-center rounded-full hover:bg-white/08 active:scale-[0.98] transition"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4 text-white/60" />
                  </button>
                )}
              </label>
            </div>

            {/* Tabs */}
            <div className="h-11 w-full rounded-full bg-white/06 backdrop-blur border border-white/12 grid grid-cols-2 gap-1 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={cn(
                  "rounded-full px-4 text-body-md font-medium transition-all",
                  activeTab === 'chat'
                    ? "bg-white/05 text-white shadow-[0_0_16px_rgba(255,255,255,0.18)] ring-1 ring-inset ring-white/20" 
                    : "text-white/60 hover:bg-white/05"
                )}
              >
                Chat
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('swing')}
                className={cn(
                  "rounded-full px-4 text-body-md font-medium transition-all",
                  activeTab === 'swing'
                    ? "bg-white/05 text-white shadow-[0_0_16px_rgba(255,255,255,0.18)] ring-1 ring-inset ring-white/20" 
                    : "text-white/60 hover:bg-white/05"
                )}
              >
                Swing
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className={cn(
          "flex-1 overflow-y-auto",
          isPageMode ? "px-0 pt-4 pb-4" : "px-4 pt-3 pb-4"
        )}>
          {activeTab === 'chat' ? (
            loadingStates.conversations ? (
              <div className="space-y-4">
                <div className="h-24 rounded-xl bg-white/05 animate-pulse" />
                <div className="h-24 rounded-xl bg-white/05 animate-pulse" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-20 text-white/60">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <div className="text-lg font-medium">No conversations yet</div>
                <div className="text-sm mt-1">Your chats will appear here</div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Legacy import banner */}
                {needsConsent && (
                  <LegacyImportBanner
                    isMigrating={isMigrating}
                    onAccept={acceptAndMigrate}
                    onDismiss={dismissMigration}
                  />
                )}
                
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleExpansion('chat', conv.id, undefined, (conv as any).source)}
                    className="w-full text-left rounded-xl bg-white/06 hover:bg-white/08 border border-white/08 hover:border-white/12 p-4 transition"
                  >
                    <div className="flex items-center font-medium text-white mb-1">
                      <span className="line-clamp-1">{conv.customTitle || conv.title}</span>
                      {conv.source === 'legacy' && <LocalTag />}
                    </div>
                    <div className="text-sm text-white/60 line-clamp-2">
                      {conv.messages.find(m => m.type === 'user')?.content || 'No messages'}
                    </div>
                    <div className="text-xs text-white/40 mt-2">
                      {conv.timestamp.toLocaleDateString()}
                      {typeof conv.messageCount === 'number' && <span aria-hidden="true"> • {conv.messageCount} {conv.messageCount === 1 ? 'message' : 'messages'}</span>}
                    </div>
                  </button>
                ))}
                
                {/* Load more button */}
                {hasMore && !loadingStates.conversations && (
                  <div className="flex justify-center py-4">
                    <button
                      className="px-6 py-3 rounded-full bg-white/08 hover:bg-white/12 border border-white/12 hover:border-white/20 text-white font-medium transition-all duration-200"
                      onClick={() => loadPage(page + 1)}
                      disabled={loadingStates.conversations}
                    >
                      {loadingStates.conversations ? 'Loading…' : 'Load more'}
                    </button>
                  </div>
                )}
                
                {/* End of list marker */}
                {!hasMore && filteredConversations.length > 0 && (
                  <div className="py-4 text-center text-meta text-white/40 select-none">
                    You're all caught up
                  </div>
                )}
              </div>
            )
          ) : (
            loadingStates.swingAnalyses ? (
              <div className="space-y-4">
                <div className="h-24 rounded-xl bg-white/05 animate-pulse" />
                <div className="h-24 rounded-xl bg-white/05 animate-pulse" />
              </div>
            ) : filteredSwingAnalyses.length === 0 ? (
              <div className="text-center py-20 text-white/60">
                <PiWaveform className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <div className="text-lg font-medium">No swing analyses yet</div>
                <div className="text-sm mt-1">Your analyses will appear here</div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSwingAnalyses.map((analysis) => (
                  <button
                    key={analysis.id}
                    onClick={() => handleExpansion('swing', analysis.id)}
                    className="w-full text-left rounded-xl bg-white/06 hover:bg-white/08 border border-white/08 hover:border-white/12 p-4 transition"
                  >
                    <div className="font-medium text-white mb-1">Swing Analysis</div>
                    <div className="text-sm text-white/60 line-clamp-2">{analysis.content}</div>
                    <div className="text-xs text-white/40 mt-2">{analysis.timestamp.toLocaleDateString()}</div>
                  </button>
                ))}
                
                {/* Load more button */}
                {swingHasMore && !loadingStates.swingAnalyses && (
                  <div className="flex justify-center py-4">
                    <button
                      className="px-6 py-3 rounded-full bg-white/08 hover:bg-white/12 border border-white/12 hover:border-white/20 text-white font-medium transition-all duration-200"
                      onClick={() => loadSwingPage(swingPage + 1)}
                      disabled={loadingStates.swingAnalyses}
                    >
                      {loadingStates.swingAnalyses ? 'Loading…' : 'Load more'}
                    </button>
                  </div>
                )}
                
                {/* End of list marker */}
                {!swingHasMore && filteredSwingAnalyses.length > 0 && (
                  <div className="py-4 text-center text-meta text-white/40 select-none">
                    You're all caught up
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  // Page mode: full-bleed, no chrome
  if (isPageMode) {
    return (
      <div className="w-full h-full bg-transparent flex flex-col">
        {/* No header - Hub provides it */}
        
        {/* Search & Tabs */}
        <div className="sticky top-0 z-[1] bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="w-full px-4 md:px-5 py-3">
            {/* Search bar */}
            <div className="flex items-center gap-2 mb-3">
              <label className="flex-1 h-11 rounded-lg bg-muted/50 border border-border px-3 flex items-center gap-2 focus-within:bg-muted focus-within:border-border">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search history…"
                  className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  value={searchQuery}
                />
                {searchQuery && (
                  <button
                    className="p-1 hover:bg-muted rounded-full transition"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </label>
              <Button variant="secondary" className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="hidden sm:inline text-sm">Filter</span>
              </Button>
            </div>

            {/* Category tabs */}
            <div className="h-11 w-full rounded-full bg-muted/50 border border-border/50 grid grid-cols-2 gap-1 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={cn(
                  "rounded-full px-4 text-sm font-medium transition-all",
                  activeTab === 'chat'
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                Chat {filteredConversations.length > 0 && <span className="ml-1 opacity-70">({filteredConversations.length})</span>}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('swing')}
                className={cn(
                  "rounded-full px-4 text-sm font-medium transition-all",
                  activeTab === 'swing'
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                Swing {filteredSwingAnalyses.length > 0 && <span className="ml-1 opacity-70">({filteredSwingAnalyses.length})</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsContent value="chat" className="m-0 flex-1 overflow-y-auto px-4 md:px-5">
              <div className="w-full max-w-3xl mx-auto py-6 space-y-4">
                {/* Legacy import banner */}
                {needsConsent && (
                  <LegacyImportBanner
                    isMigrating={isMigrating}
                    onAccept={acceptAndMigrate}
                    onDismiss={dismissMigration}
                  />
                )}
                
                {loadingStates.conversations ? (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                ) : errorStates.conversations ? (
                  <ErrorState message={errorStates.conversations} onRetry={() => loadPage(0)} />
                ) : filteredConversations.length === 0 ? (
                  <EmptyState
                    icon={<MessageCircle className="h-10 w-10" />}
                    title="No conversations yet"
                    subtitle="Your chats will appear here once you've started."
                  />
                ) : (
                  <>
                    {filteredConversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => onSelectMessage?.(conv.id)}
                        className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate flex items-center">
                              <span className="line-clamp-1">{conv.title}</span>
                              {conv.source === 'legacy' && <LocalTag />}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {conv.messages.length} messages · {new Date(conv.lastActivityAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(conv.id);
                            }}
                            className="p-2 hover:bg-muted rounded-md transition"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {hasMore && (
                      <div className="flex justify-center py-4">
                        <button
                          className="px-6 py-3 rounded-full bg-muted hover:bg-muted/80 border border-border text-sm font-medium transition"
                          onClick={() => loadPage(page + 1)}
                          disabled={loadingStates.conversations}
                        >
                          {loadingStates.conversations ? 'Loading…' : 'Load more'}
                        </button>
                      </div>
                    )}
                    {!hasMore && filteredConversations.length > 0 && (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        You're all caught up
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="swing" className="m-0 flex-1 overflow-y-auto px-4 md:px-5">
              <div className="w-full max-w-3xl mx-auto py-6 space-y-4">
                {loadingStates.swingAnalyses ? (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                ) : errorStates.swingAnalyses ? (
                  <ErrorState message={errorStates.swingAnalyses} onRetry={() => loadSwingPage(0)} />
                ) : filteredSwingAnalyses.length === 0 ? (
                  <EmptyState
                    icon={<BarChart3 className="h-10 w-10" />}
                    title="No swing analyses found"
                    subtitle="Upload a swing video to see analyses here"
                  />
                ) : (
                  <>
                    {filteredSwingAnalyses.map((analysis) => (
                      <div
                        key={analysis.id}
                        onClick={() => navigate(`/hub/echo/history/swing/${analysis.id}`)}
                        className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {analysis.videoThumbnail && (
                            <div className="w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                              <img src={analysis.videoThumbnail} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{analysis.title || analysis.save_card}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(analysis.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {swingHasMore && (
                      <div className="flex justify-center py-4">
                        <button
                          className="px-6 py-3 rounded-full bg-muted hover:bg-muted/80 border border-border text-sm font-medium transition"
                          onClick={() => loadSwingPage(swingPage + 1)}
                          disabled={loadingStates.swingAnalyses}
                        >
                          {loadingStates.swingAnalyses ? 'Loading…' : 'Load more'}
                        </button>
                      </div>
                    )}
                    {!swingHasMore && filteredSwingAnalyses.length > 0 && (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        You're all caught up
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <>
      <SlideOver
        open={isOpen}
        onClose={onClose}
        width="w-full"
        zIndex="z-[1100]"
        ariaLabel="Echo History"
        backdrop="blurred"
      >
        {/* Panel shell */}
        <div className="relative h-full bg-gradient-to-b from-black via-[#0A0A0A] to-black backdrop-blur-xl flex flex-col">
          {/* Header */}
          <header
            className="sticky top-0 z-[2] border-b border-white/08 bg-gradient-to-b from-black/95 to-black/60 backdrop-blur"
            data-echo-topbar
          >
              <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 pt-[max(env(safe-area-inset-top),0px)]">
                <div className="h-14 sm:h-16 grid grid-cols-[auto,1fr,auto] items-center gap-2">
                  {/* Left: close button */}
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={onClose}
                    className="h-9 w-9 grid place-items-center rounded-full hover:bg-white/08 active:bg-white/12 transition text-white/80"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  {/* Center: title/meta */}
                  <div className="min-w-0 text-center">
                    <div className="truncate text-heading-md font-semibold leading-snug text-white">
                      Echo History
                    </div>
                    <div className="truncate text-body-sm text-white/60 leading-tight">
                      All chats & swing analyses
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-1.5">
                    {/* Removed plus icon */}
                  </div>
                </div>
              </div>
              {/* hairline highlight */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/08"></div>
            </header>

            {/* Search & Tabs (sticky under header) - Phase 55 */}
            <div className="sticky top-[56px] sm:top-[64px] z-[1] bg-gradient-to-b from-black/90 to-transparent backdrop-blur-sm border-b border-white/06">
              <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 py-2">
                {/* Search bar */}
                <div className="flex items-center gap-2 mb-2">
                  <label className="flex-1 h-11 rounded-xl bg-white/06 backdrop-blur border border-white/12 px-3 flex items-center gap-2 transition focus-within:bg-white/08 focus-within:border-white/20">
                    <Search className="h-4 w-4 text-white/60" aria-hidden="true" />
                    <input
                      type="search"
                      placeholder="Search Echo…"
                      className="w-full bg-transparent outline-none text-body-md text-white placeholder:text-white/40"
                      onChange={(e) => setSearchQuery(e.target.value)}
                      value={searchQuery}
                      aria-label="Search Echo history"
                    />
                    {searchQuery && (
                      <button
                        className="h-7 w-7 grid place-items-center rounded-full hover:bg-white/08 active:scale-[0.98] transition"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4 text-white/60" />
                      </button>
                    )}
                  </label>

                  {/* Filter button (UI placeholder) */}
                  <Button
                    variant="secondary"
                    className="flex items-center gap-1.5"
                    aria-label="Open filters"
                  >
                    <Filter className="h-4 w-4 text-white/60" />
                    <span className="hidden sm:inline">Filter</span>
                  </Button>
                </div>

                {/* Tabs */}
                <div className="h-11 w-full rounded-full bg-white/06 backdrop-blur border border-white/12 grid grid-cols-2 gap-1 p-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('chat')}
                    className={cn(
                      "rounded-full px-4 text-body-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                      activeTab === 'chat'
                        ? "bg-white/05 text-white shadow-[0_0_16px_rgba(255,255,255,0.18)] ring-1 ring-inset ring-white/20" 
                        : "text-white/60 hover:bg-white/05 hover:ring-1 hover:ring-inset hover:ring-white/10"
                    )}
                  >
                    Chat {filteredConversations.length > 0 && <span className="ml-1 opacity-70">({filteredConversations.length})</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('swing')}
                    className={cn(
                      "rounded-full px-4 text-body-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                      activeTab === 'swing'
                        ? "bg-white/05 text-white shadow-[0_0_16px_rgba(255,255,255,0.18)] ring-1 ring-inset ring-white/20" 
                        : "text-white/60 hover:bg-white/05 hover:ring-1 hover:ring-inset hover:ring-white/10"
                    )}
                  >
                    Swing {filteredSwingAnalyses.length > 0 && <span className="ml-1 opacity-70">({filteredSwingAnalyses.length})</span>}
                  </button>
                </div>

                {/* Results header */}
                {(searchQuery || filteredConversations.length > 0 || filteredSwingAnalyses.length > 0) && (
                  <div className="mt-2 text-meta text-white/60">
                    {searchQuery ? (
                      <>
                        Results for <span className="font-medium text-white">&ldquo;{searchQuery}&rdquo;</span> · {' '}
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

            <div className="flex-1 min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
                  {/* Chat Tab */}
                  <TabsContent value="chat" className="m-0 flex-1" style={{ minHeight: 0 }} role="tabpanel" id="chat-panel" aria-labelledby="chat-tab">
                      <div 
                        className="h-full overflow-y-auto overscroll-contain scroll-smooth pb-[max(env(safe-area-inset-bottom),0px)]"
                        style={{ WebkitOverflowScrolling: "touch" }}
                        data-echo-canvas
                        ref={chatAutoScroll.scrollAreaRef}
                      >
                        {/* Top fade - Phase 52 */}
                        <div className="pointer-events-none absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-black/90 to-transparent z-10" />
                        {/* Bottom fade - Phase 52 */}
                        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-black/90 to-transparent z-10" />
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
                        onRetry={() => loadPage(0)}
                      />
                    ) : filteredConversations.length === 0 ? (
                      searchQuery ? (
                        <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 py-10">
                          <div className="rounded-2xl bg-white/06 backdrop-blur border border-white/08 text-center px-6 py-10">
                            <div className="mx-auto mb-3 h-12 w-12 rounded-full grid place-items-center bg-white/08 border border-white/12 shadow-sm text-white/60">
                              <Search className="h-6 w-6" />
                            </div>
                            <div className="text-heading-md font-semibold leading-snug text-white">No matches</div>
                            <div className="mt-1.5 text-body-sm text-white/60">
                              Try a different search term or clear filters.
                            </div>
                            <div className="mt-4 flex items-center justify-center gap-2">
                              <Button 
                                variant="secondary"
                                onClick={() => setSearchQuery('')}
                              >
                                Clear search
                              </Button>
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
                              <h3 className="text-body-sm font-medium text-white/80 mb-3">
                                Last 7 Days
                              </h3>
                                <div className="space-y-4 sm:space-y-5">
                                 {last7Days.map((conversation) => (
                                   <article 
                                     key={conversation.id} 
                                     className="group relative rounded-2xl bg-white/06 backdrop-blur border border-white/08 hover:border-white/12 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] active:translate-y-0 focus-within:ring-2 focus-within:ring-white/20 px-4 py-3 sm:px-5 sm:py-4 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                                     onClick={expandedCard?.type === 'chat' && expandedCard?.id === conversation.id ? undefined : () => handleExpansion('chat', conversation.id, undefined, conversation.source)}
                                     role="button"
                                     tabIndex={0}
                                     aria-label={`Open conversation: ${conversation.customTitle || conversation.title}`}
                                     onKeyDown={(e) => {
                                       if (e.key === 'Enter' || e.key === ' ') {
                                         e.preventDefault();
                                         if (!(expandedCard?.type === 'chat' && expandedCard?.id === conversation.id)) {
                                           handleExpansion('chat', conversation.id, undefined, conversation.source);
                                         }
                                       }
                                     }}
                                   >
                                     
                                     {expandedCard?.type === 'chat' && expandedCard?.id === conversation.id ? (
                                       <>
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="text-heading-md font-semibold leading-snug text-white">
                              {conversation.customTitle || conversation.title}
                            </h3>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedCard(null);
                                }}
                                aria-label="Collapse" 
                                className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/08 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 text-white/80"
                              >
                                             <ChevronUp className="h-4 w-4" />
                                           </button>
                                         </div>

         <div className="space-y-3 max-h-80 overflow-y-auto">
            {conversation.messages.map((message, idx) => {
              const row: EchoRowMessage = {
                id: (message as any).id ?? String(idx),
                role: ((message as any).type === 'user' ? 'user' : 'assistant'),
                content: (message as any).content ?? '',
                createdAt: (message as any).timestamp ?? new Date().toISOString(),
              };
              return (
                <EchoMessageRow key={row.id} message={row} />
              );
            })}
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
                                              className="text-sm font-medium text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded"
                                            >
                                             Use this response
                                           </button>
                                         </div>
                                       </>
                                     ) : (
                                       <>
                                         <div className="flex items-start gap-2">
                                            <span className="shrink-0 mt-0.5 px-2 h-6 inline-flex items-center rounded-md text-meta font-medium bg-white/08 backdrop-blur border border-white/12 text-white/80">
                                              Chat
                                            </span>
                                            <div className="min-w-0 flex-1">
                                              <div className="truncate text-body-md font-semibold text-white">
                                                {conversation.customTitle || conversation.title}
                                              </div>
                                              <div className="mt-1.5 flex items-center gap-2 text-meta text-white/60">
                                               <span className="truncate">
                                                 {conversation.messages.find(m => m.type === 'user')?.content || 'No messages yet'}
                                               </span>
                                               <span className="mx-1 h-1 w-1 rounded-full bg-white/20 shrink-0"></span>
                                               <time className="shrink-0 text-white/40">{conversation.timestamp.toLocaleDateString()}</time>
                                               <span className="hidden sm:inline text-white/40 shrink-0">• {conversation.messages.length} msgs</span>
                                             </div>
                                           </div>
                                         </div>
                                         
                                         {/* Hover affordance stripe */}
                                         <div className="pointer-events-none absolute inset-x-0 -bottom-px h-8 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                                           <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/06 to-transparent"></div>
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
                              <h3 className="text-body-sm font-medium text-white/80 mb-3">
                                This Month
                              </h3>
                              <div className="space-y-4 sm:space-y-5">
                                {thisMonth.map((conversation) => (
                                   <article 
                                     key={conversation.id} 
                                     className="group relative rounded-2xl bg-white/06 backdrop-blur border border-white/08 hover:border-white/12 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] active:translate-y-0 focus-within:ring-2 focus-within:ring-white/20 px-4 py-3 sm:px-5 sm:py-4 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                                     onClick={expandedCard?.type === 'chat' && expandedCard?.id === conversation.id ? undefined : () => handleExpansion('chat', conversation.id, undefined, conversation.source)}
                                     role="button"
                                     tabIndex={0}
                                     aria-label={`Open conversation: ${conversation.customTitle || conversation.title}`}
                                     onKeyDown={(e) => {
                                       if (e.key === 'Enter' || e.key === ' ') {
                                         e.preventDefault();
                                         if (!(expandedCard?.type === 'chat' && expandedCard?.id === conversation.id)) {
                                           handleExpansion('chat', conversation.id, undefined, conversation.source);
                                         }
                                       }
                                     }}
                                   >
                                     
                                     {expandedCard?.type === 'chat' && expandedCard?.id === conversation.id ? (
                                       <>
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="text-heading-md font-semibold leading-snug text-white">
                              {conversation.customTitle || conversation.title}
                            </h3>
                                           <button 
                                             onClick={(e) => {
                                               e.stopPropagation();
                                               setExpandedCard(null);
                                             }}
                                              aria-label="Collapse" 
                                              className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/08 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 text-white/80"
                                            >
                                             <ChevronUp className="h-4 w-4" />
                                           </button>
                                         </div>

         <div className="space-y-3 max-h-80 overflow-y-auto">
            {conversation.messages.map((message, idx) => {
              const row: EchoRowMessage = {
                id: (message as any).id ?? String(idx),
                role: ((message as any).type === 'user' ? 'user' : 'assistant'),
                content: (message as any).content ?? '',
                createdAt: (message as any).timestamp ?? new Date().toISOString(),
              };
              return (
                <EchoMessageRow key={row.id} message={row} />
              );
            })}
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
                                              className="text-sm font-medium text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded"
                                            >
                                             Use this response
                                           </button>
                                         </div>
                                       </>
                                     ) : (
                                       <>
                          <div className="flex items-start gap-2">
                            <span className="shrink-0 mt-0.5 px-2 h-6 inline-flex items-center rounded-md text-meta font-medium bg-white/08 backdrop-blur border border-white/12 text-white/80">
                              Chat
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-body-md font-semibold text-white">
                                {conversation.customTitle || conversation.title}
                              </div>
                                             <div className="mt-1.5 flex items-center gap-2 text-meta text-white/60">
                                               <span className="truncate">
                                                 {conversation.messages.find(m => m.type === 'user')?.content || 'No messages yet'}
                                               </span>
                                               <span className="mx-1 h-1 w-1 rounded-full bg-white/20 shrink-0"></span>
                                               <time className="shrink-0 text-white/40">{conversation.timestamp.toLocaleDateString()}</time>
                                               <span className="hidden sm:inline text-white/40 shrink-0">• {conversation.messages.length} msgs</span>
                                             </div>
                                           </div>
                                         </div>
                                         
                                         {/* Hover affordance stripe */}
                                         <div className="pointer-events-none absolute inset-x-0 -bottom-px h-8 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                                           <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/06 to-transparent"></div>
                                         </div>
                                       </>
                                     )}
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
                              <h3 className="text-body-sm font-medium text-white/80 mb-3">
                                Older
                              </h3>
                              <div className="space-y-4 sm:space-y-5">
                                {older.map((conversation) => (
                                   <article 
                                     key={conversation.id} 
                                     className="group relative rounded-2xl bg-white/06 backdrop-blur border border-white/08 hover:border-white/12 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] active:translate-y-0 focus-within:ring-2 focus-within:ring-white/20 px-4 py-3 sm:px-5 sm:py-4 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                                     onClick={expandedCard?.type === 'chat' && expandedCard?.id === conversation.id ? undefined : () => handleExpansion('chat', conversation.id, undefined, conversation.source)}
                                     role="button"
                                     tabIndex={0}
                                     aria-label={`Open conversation: ${conversation.customTitle || conversation.title}`}
                                     onKeyDown={(e) => {
                                       if (e.key === 'Enter' || e.key === ' ') {
                                         e.preventDefault();
                                         if (!(expandedCard?.type === 'chat' && expandedCard?.id === conversation.id)) {
                                           handleExpansion('chat', conversation.id, undefined, conversation.source);
                                         }
                                       }
                                     }}
                                   >
                                     
                                     {expandedCard?.type === 'chat' && expandedCard?.id === conversation.id ? (
                                       <>
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="text-heading-md font-semibold leading-snug text-white">
                              {conversation.customTitle || conversation.title}
                            </h3>
                                           <button 
                                             onClick={(e) => {
                                               e.stopPropagation();
                                               setExpandedCard(null);
                                             }}
                                              aria-label="Collapse" 
                                              className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/08 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 text-white/80"
                                            >
                                             <ChevronUp className="h-4 w-4" />
                                           </button>
                                         </div>

         <div className="space-y-3 max-h-80 overflow-y-auto">
            {conversation.messages.map((message, idx) => {
              const row: EchoRowMessage = {
                id: (message as any).id ?? String(idx),
                role: ((message as any).type === 'user' ? 'user' : 'assistant'),
                content: (message as any).content ?? '',
                createdAt: (message as any).timestamp ?? new Date().toISOString(),
              };
              return (
                <EchoMessageRow key={row.id} message={row} />
              );
            })}
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
                                              className="text-sm font-medium text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded"
                                            >
                                             Use this response
                                           </button>
                                         </div>
                                       </>
                                     ) : (
                                        <>
                                          <div className="flex items-start gap-2">
                                            <span className="shrink-0 mt-0.5 px-2 h-6 inline-flex items-center rounded-md text-meta font-medium bg-white/08 backdrop-blur border border-white/12 text-white/80">
                                              Chat
                                            </span>
                                            <div className="min-w-0 flex-1">
                                              <div className="truncate text-heading-md font-semibold text-white">
                                                {conversation.customTitle || conversation.title}
                                              </div>
                                              <div className="mt-1.5 flex items-center gap-2 text-meta text-white/60">
                                               <span className="truncate">
                                                 {conversation.messages.find(m => m.type === 'user')?.content || 'No messages yet'}
                                               </span>
                                               <span className="mx-1 h-1 w-1 rounded-full bg-white/20 shrink-0"></span>
                                               <time className="shrink-0 text-white/40">{conversation.timestamp.toLocaleDateString()}</time>
                                               <span className="hidden sm:inline text-white/40 shrink-0">• {conversation.messages.length} msgs</span>
                                              </div>
                                            </div>
                                         </div>
                                         
                                         {/* Hover affordance stripe */}
                                         <div className="pointer-events-none absolute inset-x-0 -bottom-px h-8 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                                           <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/06 to-transparent"></div>
                                         </div>
                                       </>
                                     )}
                                   </article>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                        
                        {/* Load more button */}
                        {hasMore && !loadingStates.conversations && (
                          <div className="flex justify-center py-6">
                            <button
                              className="px-6 py-3 rounded-full bg-white/08 hover:bg-white/12 border border-white/12 hover:border-white/20 text-white font-medium transition-all duration-200"
                              onClick={() => loadPage(page + 1)}
                              disabled={loadingStates.conversations}
                            >
                              {loadingStates.conversations ? 'Loading…' : 'Load more'}
                            </button>
                          </div>
                        )}
                        
                        {/* End of list marker */}
                        {!hasMore && filteredConversations.length > 0 && (
                          <div className="py-6 text-center text-meta text-white/40 select-none">
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
                       className="h-full overflow-y-auto overscroll-contain scroll-smooth pb-[max(env(safe-area-inset-bottom),0px)]"
                       style={{ WebkitOverflowScrolling: "touch" }}
                       data-echo-canvas
                       ref={swingAutoScroll.scrollAreaRef}
                     >
                        {/* Top fade - Phase 52 */}
                        <div className="pointer-events-none absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-black/90 to-transparent z-10" />
                        {/* Bottom fade - Phase 52 */}
                        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-black/90 to-transparent z-10" />
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
                        onRetry={() => loadSwingPage(0)}
                      />
                    ) : filteredSwingAnalyses.length === 0 ? (
                      searchQuery ? (
                        <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 py-10">
                          <div className="rounded-2xl bg-white/80 backdrop-blur border border-black/10 text-center px-6 py-10">
                            <div className="mx-auto mb-3 h-12 w-12 rounded-full grid place-items-center bg-white border border-black/10 shadow-sm text-gray-700">
                              <Search className="h-6 w-6" />
                            </div>
                            <div className="text-heading-md font-semibold text-gray-900">No matches</div>
                            <div className="mt-1.5 text-body-sm text-gray-600/90">
                              Try a different search term or clear filters.
                            </div>
                            <div className="mt-4 flex items-center justify-center gap-2">
                             <Button 
                                variant="secondary"
                                onClick={() => setSearchQuery('')}
                              >
                                Clear search
                              </Button>
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
                                <h3 className="text-body-sm font-medium text-white/80 mb-3">
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
                                     navigate={navigate}
                                     isPageMode={isPageMode}
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
                                <h3 className="text-body-sm font-medium text-white/80 mb-3">
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
                                     navigate={navigate}
                                     isPageMode={isPageMode}
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
                                <h3 className="text-body-sm font-medium text-white/80 mb-3">
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
                                     navigate={navigate}
                                     isPageMode={isPageMode}
                                   />
                                 ))}
                              </div>
                            </div>
                          );
                        })()}
                        
                        {/* Load more button */}
                        {swingHasMore && !loadingStates.swingAnalyses && (
                          <div className="flex justify-center py-6">
                            <button
                              className="px-6 py-3 rounded-full bg-white/08 hover:bg-white/12 border border-white/12 hover:border-white/20 text-white font-medium transition-all duration-200"
                              onClick={() => loadSwingPage(swingPage + 1)}
                              disabled={loadingStates.swingAnalyses}
                            >
                              {loadingStates.swingAnalyses ? 'Loading…' : 'Load more'}
                            </button>
                          </div>
                        )}
                        
                        {/* End of list marker */}
                        {!swingHasMore && filteredSwingAnalyses.length > 0 && (
                          <div className="py-6 text-center text-meta text-white/40 select-none">
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