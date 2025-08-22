import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Filter, Trash2, RotateCcw, Play, Maximize2, Calendar, FileText, Plus, Edit2, MessageSquare, Minimize2, AlertCircle, MessageCircle, Mic, BarChart3 } from 'lucide-react';
import Hls from 'hls.js';

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
      className={`min-h-[112px] sm:min-h-[120px] px-4 sm:px-5 py-3 sm:py-3.5 rounded-[14px] bg-white/90 border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex flex-col ${isExpanded ? 'shadow-lg h-auto' : ''}`}
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
              {/* Remove the save_card text display */}
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
                          ? 'bg-orange-50 border-l-4 border-orange-400' 
                          : 'bg-muted border-l-4 border-muted-foreground'
                      }`}
                    >
                       <div className="flex justify-between items-start mb-2">
                         <div className={`text-xs px-2 py-1 rounded-full ${
                           message.role === 'user' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
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
  <div className="min-h-[112px] sm:min-h-[120px] px-4 sm:px-5 py-3 sm:py-3.5 rounded-[14px] bg-white/90 border border-gray-100 animate-pulse">
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
    enabled: activeTab === 'swing-coach',
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
      // Load from conversation session hook (localStorage) first
      console.log('📱 Loading from conversation session...');
      conversationSession.loadConversations();
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

      // Also try to load from Supabase database if available
      const { data: user } = await supabase.auth.getUser();
      console.log('👤 Current user:', user.user?.id);
      if (user.user) {
        console.log('💾 Loading from Supabase conversations table...');
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', user.user.id)
          .order('updated_at', { ascending: false });

        console.log('💾 Supabase conversations result:', { data: data?.length || 0, error });

        if (!error && data && data.length > 0) {
          const dbConversations = data.map(conv => {
            const messages = (conv.messages as any[]) || [];
            console.log('📝 Conversation DB debug:', {
              id: conv.id,
              title: conv.title,
              totalMessages: messages.length,
              messageTypes: messages.map(m => m.type),
              messageContent: messages.map(m => ({ type: m.type, content: m.content?.substring(0, 30) + '...' })),
              fullMessages: messages // Let's see the complete structure
            });
            
            return {
              id: conv.id,
              title: conv.title || "New conversation",
              customTitle: conv.title,
              messages: messages.map((msg, index) => ({
                id: `${conv.id}-${index}`,
                type: (msg.type === 'user' ? 'user' : 'ai') as 'user' | 'ai',
                content: msg.content || '',
                timestamp: new Date(msg.timestamp || conv.created_at),
                metadata: msg.metadata
               })),
              timestamp: new Date(conv.updated_at),
              createdAt: new Date(conv.created_at),
              lastActivityAt: new Date(conv.updated_at),
              messageCount: messages.length
            };
          });

          // Merge database conversations with local storage conversations
          const allConversations = [...sessionConversations];
          dbConversations.forEach(dbConv => {
            if (!allConversations.find(localConv => localConv.id === dbConv.id)) {
              allConversations.push(dbConv);
            }
          });

          // Sort by last activity
          allConversations.sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
          setConversations(allConversations);
        }
      }
    } catch (error) {
      console.error('Error loading chat conversations:', error);
      setErrorStates(prev => ({ ...prev, conversations: 'Failed to load conversations. Please try again.' }));
    } finally {
      setLoadingStates(prev => ({ ...prev, conversations: false }));
    }
  };

  const loadSwingAnalyses = async () => {
    console.log('🏌️‍♂️ Loading swing analyses...');
    setLoadingStates(prev => ({ ...prev, swingAnalyses: true }));
    setErrorStates(prev => ({ ...prev, swingAnalyses: null }));
    
    try {
      const { data: user } = await supabase.auth.getUser();
      console.log('👤 User for swing analyses:', user.user?.id);
      if (!user.user) return;

      const { data, error } = await supabase
        .from('pro_ai_analyses')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      console.log('🏌️‍♂️ Swing analyses result:', { data: data?.length || 0, error });
      if (error) throw error;

      const analysesWithFormatted = data?.map(analysis => {
        let conversation: Array<{role: 'user' | 'coach', content: string, timestamp?: string}> = [];
        let videoThumbnail = '';
        let videoUrl = analysis.video_url || '';
        
        // Parse analysis results for conversation and video data
        try {
          if (analysis.analysis_results && typeof analysis.analysis_results === 'object') {
            const results = analysis.analysis_results as any;
            
            // Extract conversation from various possible formats
            if (results.conversation && Array.isArray(results.conversation)) {
              conversation = results.conversation.map((msg: any) => ({
                role: msg.role === 'user' ? 'user' : 'coach',
                content: msg.content || msg.message || '',
                timestamp: msg.timestamp
              }));
            } else if (results.messages && Array.isArray(results.messages)) {
              conversation = results.messages.map((msg: any) => ({
                role: msg.role === 'user' ? 'user' : 'coach',
                content: msg.content || msg.message || '',
                timestamp: msg.timestamp
              }));
            }
            
            // Extract video thumbnail if available
            if (results.videoThumbnail) {
              videoThumbnail = results.videoThumbnail;
            } else if (results.metadata?.videoThumbnail) {
              videoThumbnail = results.metadata.videoThumbnail;
            }
          }
        } catch (parseError) {
          console.error('Error parsing analysis results:', parseError);
        }

        return {
          id: analysis.id,
          save_card: analysis.swing_context || 'Swing Analysis',
          tags: [],
          category: 'swing-analysis',
          content: conversation.length > 0 
            ? conversation.map(msg => `${msg.role === 'user' ? 'You' : 'Coach'}: ${msg.content}`).join('\n\n')
            : analysis.swing_context || 'Swing analysis',
          videoThumbnail,
          videoUrl,
          timestamp: new Date(analysis.created_at),
          conversation,
          title: 'Swing Analysis'
        };
      }) || [];

      console.log('🏌️‍♂️ Processed swing analyses:', analysesWithFormatted.length);
      setSwingAnalyses(analysesWithFormatted);
    } catch (error) {
      console.error('Error loading swing analyses:', error);
      setErrorStates(prev => ({ ...prev, swingAnalyses: 'Failed to load swing analyses. Please try again.' }));
    } finally {
      setLoadingStates(prev => ({ ...prev, swingAnalyses: false }));
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      // Delete from local storage first
      conversationSession.deleteConversation(conversationId);
      
      // Also try to delete from database if it exists there
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const { error } = await supabase
          .from('conversations')
          .delete()
          .eq('id', conversationId)
          .eq('user_id', user.user.id);

        // Don't throw error if database deletion fails - local deletion succeeded
        if (error) {
          console.warn('Failed to delete conversation from database:', error);
        }
      }

      // Update local state
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed from your history."
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCaddieLog = async (logId: string) => {
    const success = await deleteCaddieLogHook(logId);
    if (success) {
      toast({
        title: "Caddie log deleted",
        description: "The log has been removed from your history."
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete caddie log. Please try again.",
        variant: "destructive"
      });
    }
  };

  const deleteSwingAnalysis = async (analysisId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('pro_ai_analyses')
        .delete()
        .eq('id', analysisId)
        .eq('user_id', user.user.id);

      if (error) throw error;

      setSwingAnalyses(prev => prev.filter(analysis => analysis.id !== analysisId));
      toast({
        title: "Analysis deleted",
        description: "The swing analysis has been removed from your history."
      });
    } catch (error) {
      console.error('Error deleting swing analysis:', error);
      toast({
        title: "Error",
        description: "Failed to delete swing analysis. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conversation =>
    conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter caddie logs based on search  
  const filteredCaddieLogs = caddieLogs.filter(log =>
    log.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter swing analyses based on search
  const filteredSwingAnalyses = swingAnalyses.filter(analysis =>
    analysis.save_card.toLowerCase().includes(searchQuery.toLowerCase()) ||
    analysis.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 overflow-hidden"
      style={{ 
        zIndex: 9999
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onScroll={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-md flex flex-col overflow-hidden animate-scale-in"
        style={{
          height: 'min(72vh, 576px)',
          background: 'rgba(246, 247, 246, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: window.innerWidth <= 768 ? '24px 24px 0 0' : '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `
            0 0 0 1px rgba(255, 255, 255, 0.08),
            0 8px 32px rgba(0, 0, 0, 0.12),
            0 2px 8px rgba(0, 0, 0, 0.08)
          `
        }}
        onWheel={(e) => {
          const target = e.currentTarget;
          const scrollableElement = target.querySelector('[data-radix-scroll-area-viewport]');
          
          if (scrollableElement) {
            const { scrollTop, scrollHeight, clientHeight } = scrollableElement;
            const isAtTop = scrollTop === 0;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
            
            if ((e.deltaY < 0 && isAtTop) || (e.deltaY > 0 && isAtBottom)) {
              e.preventDefault();
            }
          }
          
          e.stopPropagation();
        }}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{
            height: window.innerWidth <= 768 ? '56px' : '64px',
            background: 'linear-gradient(180deg, transparent 0%, rgba(246, 247, 246, 0.85) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <h2 className="text-lg font-semibold text-gray-900">Echo History</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-48 bg-white/50 backdrop-blur-sm border border-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all duration-160 placeholder:text-gray-500/70 rounded-lg"
                style={{
                  background: 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)'
                }}
                aria-label="Search chat history, caddie logs, and swing analyses"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-white/20 rounded-full"
              aria-label="Close history modal"
            >
              <X className="h-4 w-4 text-gray-900" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-2 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-3 bg-white/30 backdrop-blur-sm">
              <TabsTrigger value="chat" className="data-[state=active]:bg-white/80">
                Chat
                {conversations.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 text-xs">
                    {conversations.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="insights" className="data-[state=active]:bg-white/80">
                Caddie Logs
                {caddieLogs.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 text-xs">
                    {caddieLogs.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="swing-coach" className="data-[state=active]:bg-white/80 data-[state=active]:border-transparent">
                Swing Coach
                {swingAnalyses.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 text-xs">
                    {swingAnalyses.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            {/* Chat Tab */}
            <TabsContent value="chat" className="h-full m-0" role="tabpanel" id="chat-panel" aria-labelledby="chat-tab">
              <ScrollArea 
                ref={chatAutoScroll.scrollAreaRef}
                className="h-full"
                style={{ overscrollBehavior: 'contain' }}
              >
                <div className="px-6 py-5">
                  {loadingStates.conversations ? (
                    <div className="space-y-4 sm:space-y-5">
                      {[1, 2, 3].map((i) => (
                        <SkeletonCard key={i} />
                      ))}
                    </div>
                  ) : errorStates.conversations ? (
                    <ErrorState
                      message={errorStates.conversations}
                      onRetry={loadChatConversations}
                    />
                  ) : filteredConversations.length > 0 ? (
                    <div className="space-y-4 sm:space-y-5">
                      {filteredConversations.map((conversation, index) => (
                        <div
                          key={`conversation-${conversation.id || index}`}
                          className={`min-h-[112px] sm:min-h-[120px] max-h-[160px] px-4 sm:px-5 py-3 sm:py-3.5 rounded-[14px] bg-white/90 border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex flex-col ${
                            expandedCard?.type === 'chat' && expandedCard?.id === conversation.id ? 'h-auto max-h-none shadow-lg' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2 flex-1">
                            {editingConversationId === conversation.id ? (
                              <div className="flex items-center gap-2 flex-1">
                                <Input
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="flex-1"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      // Handle save edit
                                    } else if (e.key === 'Escape') {
                                      setEditingConversationId(null);
                                      setEditTitle('');
                                    }
                                  }}
                                  autoFocus
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Handle save edit
                                  }}
                                  className="h-7 px-2"
                                >
                                  Save
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingConversationId(null);
                                    setEditTitle('');
                                  }}
                                  className="h-7 px-2"
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                               <div className="flex-1 flex flex-col">
                                 {/* Header Row */}
                                   <div className="flex items-start justify-between mb-2">
                                     {(() => {
                                        const firstUserMessage = conversation.messages.find(msg => msg.type === 'user')?.content;
                                        const displayTitle = firstUserMessage || conversation.title || "New conversation";
                                       return (
                                         <h3 className="font-semibold text-sm text-gray-900 flex-1 mr-3 line-clamp-1" title={displayTitle}>
                                           {displayTitle}
                                         </h3>
                                       );
                                     })()}
                                    <span className="text-xs text-gray-500 flex-shrink-0">
                                      {conversation.timestamp.toLocaleDateString()}
                                    </span>
                                  </div>

                                  {/* Body Preview - First AI Response */}
                                  <div className="flex-1 mb-3">
                                     {(() => {
                                       const firstAIMessage = conversation.messages.find(msg => msg.type === 'ai');
                                       return firstAIMessage ? (
                                         <p className="text-sm text-gray-600 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                                           {firstAIMessage.content}
                                         </p>
                                       ) : (
                                         <p className="text-sm text-gray-400 italic">No response yet</p>
                                       );
                                     })()}
                                 </div>

                                 {/* Action Row */}
                                 <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-2">
                                     <Button
                                       variant="outline"
                                       size="sm"
                                       onClick={() => handleExpansion('chat', conversation.id)}
                                       className="bg-gray-100 hover:bg-gray-200 border-0 text-gray-700 rounded-full px-4 py-1.5 text-xs h-auto font-medium transition-colors focus:ring-0 focus:outline-none focus:border-0"
                                     >
                                       {expandedCard?.type === 'chat' && expandedCard?.id === conversation.id ? "Hide" : "Show"} Conversation
                                     </Button>
                                     {conversation.messageCount && (
                                       <div className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full font-medium">
                                         {conversation.messageCount}
                                       </div>
                                     )}
                                   </div>
                                   <div className="flex items-center gap-1">
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       onClick={() => handleExpansion('chat', conversation.id)}
                                        className="h-8 px-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors focus:ring-0 focus:border-0 focus:outline-none"
                                       title={expandedCard?.type === 'chat' && expandedCard?.id === conversation.id ? "Collapse" : "Expand"}
                                     >
                                       {expandedCard?.type === 'chat' && expandedCard?.id === conversation.id ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                     </Button>
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       onClick={() => {
                                         if (window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
                                           deleteConversation(conversation.id);
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
                            )}
                          </div>

                          {expandedCard?.type === 'chat' && expandedCard?.id === conversation.id && (
                            <div className="mt-3 pt-3 border-t border-gray-200 animate-accordion-down">
                               <div className="space-y-3 max-h-80 overflow-y-auto">
                                 <div className="text-xs text-gray-400 mb-2">
                                   Debug: {conversation.messages.length} messages | Types: {conversation.messages.map(m => `${m.type}(${m.content?.substring(0, 20)}...)`).join(', ')}
                                 </div>
                                 {conversation.messages
                                   .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                                   .map((message) => (
                                   <div
                                     key={message.id}
                                     className={`p-3 rounded-lg ${
                                       message.type === 'user' 
                                         ? 'bg-orange-50 border-l-4 border-orange-500' 
                                         : 'bg-gray-50 border-l-4 border-gray-300'
                                     }`}
                                   >
                                     <div className="flex justify-between items-start mb-1">
                                       <div className="bg-gray-100 text-gray-600 border-gray-200 text-xs px-2 py-1 rounded-full">
                                         {message.type === 'user' ? 'You' : 'Echo'}
                                       </div>
                                       <span className="text-xs text-gray-600">
                                         {message.timestamp.toLocaleTimeString()}
                                       </span>
                                     </div>
                                     <p className="text-sm leading-relaxed">{message.content}</p>
                                     {message.type === 'ai' && (
                                       <Button
                                         variant="link"
                                         size="sm"
                                         onClick={() => onSelectMessage(message.content)}
                                         className="p-0 h-auto mt-2 text-xs text-gray-600 hover:text-gray-800"
                                       >
                                         Use this response
                                       </Button>
                                     )}
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}
                         </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<MessageCircle className="h-12 w-12" />}
                      title="No conversations yet"
                      subtitle="Your chat history with Echo will appear here"
                    />
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Caddie Logs Tab */}
            <TabsContent value="insights" className="h-full m-0" role="tabpanel" id="insights-panel" aria-labelledby="insights-tab">
              <ScrollArea 
                ref={logsAutoScroll.scrollAreaRef}
                className="h-full"
                style={{ overscrollBehavior: 'contain' }}
              >
                <div className="px-6 py-5">
                  {caddieLogsLoading ? (
                    <div className="space-y-4 sm:space-y-5">
                      {[1, 2, 3].map((i) => (
                        <SkeletonCard key={i} />
                      ))}
                    </div>
                  ) : false ? ( // No error states from hook
                    <ErrorState
                      message={errorStates.caddieLogs}
                      onRetry={() => {}} // Handled by hook
                    />
                  ) : filteredCaddieLogs.length > 0 ? (
                    <div className="space-y-4 sm:space-y-5">
                      {filteredCaddieLogs.map((log) => {
                        const isExpanded = expandedCard?.type === 'caddie' && expandedCard?.id === log.id;
                        const contentPreview = log.content.length > 120 ? log.content.slice(0, 120) + '...' : log.content;
                        const hasMoreContent = log.content.length > 120 || (log.transcription && log.transcription !== log.content);
                        
                        return (
                          <div
                            key={log.id}
                            className={`min-h-[112px] sm:min-h-[120px] px-4 sm:px-5 py-3 sm:py-3.5 rounded-[14px] bg-white/90 border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex flex-col ${isExpanded ? 'shadow-lg h-auto' : ''}`}
                          >
                            {/* Collapsed Content */}
                            <div className="flex-1 flex flex-col">
                              {/* Header Row */}
                              <div className="flex items-start justify-between mb-2">
                                <span className="font-semibold text-sm text-gray-900 flex-shrink-0">
                                  {new Date(log.created_at).toLocaleDateString()}
                                </span>
                                {log.location_name && (
                                  <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full border border-gray-200 flex-shrink-0">
                                    {log.location_name}
                                  </div>
                                )}
                              </div>

                              {/* Body Preview */}
                              <div className="flex-1 mb-3 overflow-hidden">
                                <p className="text-sm text-gray-600 line-clamp-4 sm:line-clamp-5 break-words">
                                  {isExpanded ? log.content : contentPreview}
                                </p>
                              </div>
                              
                               {/* Action Row */}
                               <div className="flex justify-between items-center">
                                 <div className="flex items-center gap-2">
                                   <div className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full font-medium">
                                     Caddie Log
                                   </div>
                                 </div>
                                 <div className="flex items-center gap-1">
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => handleExpansion('caddie', log.id)}
                                     className="h-8 px-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors focus:ring-0 focus:border-0 focus:outline-none"
                                     title={isExpanded ? "Collapse" : "Expand"}
                                   >
                                     {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                   </Button>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => {
                                       if (window.confirm('Are you sure you want to delete this caddie log? This action cannot be undone.')) {
                                         handleDeleteCaddieLog(log.id);
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
                                  {/* Full Content */}
                                  <div className="space-y-3">
                                    <div>
                                      <h5 className="text-sm font-medium mb-2">Content</h5>
                                      <p className="text-sm leading-relaxed text-gray-900 bg-gray-50 p-3 rounded-lg">
                                        {log.content}
                                      </p>
                                    </div>

                                    {log.transcription && log.transcription !== log.content && (
                                      <div>
                                        <h5 className="text-sm font-medium mb-2">Transcription</h5>
                                        <p className="text-sm leading-relaxed text-gray-900 bg-gray-50 p-3 rounded-lg">
                                          {log.transcription}
                                        </p>
                                      </div>
                                    )}

                                    {(log.location_name || log.course_name) && (
                                      <div>
                                        <h5 className="text-sm font-medium mb-2">Location Details</h5>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                          {log.course_name && (
                                            <p className="text-sm text-gray-700 mb-1">
                                              <strong>Course:</strong> {log.course_name}
                                            </p>
                                          )}
                                          {log.location_name && (
                                            <p className="text-sm text-gray-700">
                                              <strong>Location:</strong> {log.location_name}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {log.tags && log.tags.length > 0 && (
                                      <div>
                                        <h5 className="text-sm font-medium mb-2">Tags</h5>
                                        <div className="flex flex-wrap gap-2">
                                          {log.tags.map((tag, index) => (
                                            <div key={index} className="bg-gray-100 border-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                                              {tag}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<Mic className="h-12 w-12" />}
                      title="No caddie logs yet"
                      subtitle="Record voice notes during your rounds to see them here"
                    />
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Swing Coach Tab */}
            <TabsContent value="swing-coach" className="h-full m-0" role="tabpanel" id="swing-coach-panel" aria-labelledby="swing-coach-tab">
              <ScrollArea 
                ref={swingAutoScroll.scrollAreaRef}
                className="h-full"
                style={{ overscrollBehavior: 'contain' }}
              >
                <div className="px-6 py-5">
                  {loadingStates.swingAnalyses ? (
                    <div className="space-y-4 sm:space-y-5">
                      {[1, 2, 3].map((i) => (
                        <SkeletonCard key={i} />
                      ))}
                    </div>
                  ) : errorStates.swingAnalyses ? (
                    <ErrorState
                      message={errorStates.swingAnalyses}
                      onRetry={loadSwingAnalyses}
                    />
                  ) : filteredSwingAnalyses.length > 0 ? (
                    <div className="space-y-4 sm:space-y-5">
                      {filteredSwingAnalyses.map((analysis) => (
                        <div key={analysis.id} className="transition-transform duration-100">
                          <SwingAnalysisCard
                            analysis={{
                              ...analysis,
                              tags: analysis.tags || [], // Ensure tags is always an array
                              conversation: analysis.conversation || [] // Ensure conversation is always an array
                            }}
                            onDelete={() => deleteSwingAnalysis(analysis.id)}
                            isExpanded={expandedCard?.type === 'swing' && expandedCard?.id === analysis.id}
                            onToggleExpand={() => handleExpansion('swing', analysis.id)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<BarChart3 className="h-12 w-12" />}
                      title="No swing analyses yet"
                      subtitle="Upload swing videos to Swing Coach to see them here"
                    />
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AIChatHistory;