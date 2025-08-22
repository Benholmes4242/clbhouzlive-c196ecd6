import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Filter, Trash2, RotateCcw, Play, Maximize2, Calendar, FileText, Plus, Edit2, MessageSquare, Minimize2, AlertCircle, MessageCircle, Mic, BarChart3 } from 'lucide-react';
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
              {analysis.save_card && analysis.save_card !== "Swing Analysis" && (
                <p className="text-xs text-gray-600 line-clamp-1">
                  {analysis.save_card}
                </p>
              )}
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
               className="h-8 px-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
                <video
                  src={analysis.videoUrl || analysis.videoSrc}
                  poster={analysis.videoThumbnail || analysis.videoPoster}
                  controls
                  className="w-full h-full object-cover"
                  onLoadStart={() => setIsVideoLoading(true)}
                  onCanPlay={() => setIsVideoLoading(false)}
                  onError={() => setIsVideoLoading(false)}
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
                    <p className="text-sm font-medium mb-1">Video Preview</p>
                    <p className="text-xs opacity-80">New swing analyses will have permanent video links</p>
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
                          ? 'bg-primary/10 border-l-4 border-primary' 
                          : 'bg-muted border-l-4 border-muted-foreground'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
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
  const [caddieLogs, setCaddieLogs] = useState<CaddieLog[]>([]);
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
      loadCaddieLogs();
      loadSwingAnalyses();
    }
  }, [isOpen]);

  const loadChatConversations = async () => {
    console.log('🔍 Loading chat conversations from Supabase only...');
    setLoadingStates(prev => ({ ...prev, conversations: true }));
    setErrorStates(prev => ({ ...prev, conversations: null }));
    
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) {
        console.log('❌ No authenticated user found');
        setLoadingStates(prev => ({ ...prev, conversations: false }));
        return;
      }

      console.log('👤 Loading conversations for user:', user.data.user.id);

      // Load conversations from Supabase only
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.data.user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading conversations:', error);
        setErrorStates(prev => ({ ...prev, conversations: `Failed to load conversations: ${error.message}` }));
        setLoadingStates(prev => ({ ...prev, conversations: false }));
        return;
      }

      console.log('✅ Loaded conversations from Supabase:', conversationsData?.length || 0);

      // Convert Supabase format to our chat conversation format
      const formattedConversations = conversationsData?.map(conv => {
        const messages = (conv.messages as any[]) || [];
        return {
          id: conv.id,
          title: conv.title || "New conversation",
          customTitle: conv.title,
          messages: messages.map((msg, index) => ({
            id: `${conv.id}-${index}`,
            type: msg.type,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            metadata: msg.metadata
          })),
          timestamp: new Date(conv.updated_at),
          createdAt: new Date(conv.created_at),
          lastActivityAt: new Date(conv.updated_at),
          messageCount: messages.length
        };
      }) || [];

      console.log('📱 Formatted conversations:', formattedConversations.length);
      setConversations(formattedConversations);
      
      // Also create a flat array of all messages for search functionality  
      const allMessages: HistoryMessage[] = [];
      formattedConversations.forEach(conv => {
        conv.messages.forEach(msg => {
          allMessages.push(msg);
        });
      });
      
      setHistoryMessages(allMessages);
      console.log('📨 Total messages loaded:', allMessages.length);
      
    } catch (error) {
      console.error('❌ Unexpected error loading conversations:', error);
      setErrorStates(prev => ({ ...prev, conversations: `Unexpected error: ${error}` }));
    }
    
    setLoadingStates(prev => ({ ...prev, conversations: false }));
  };

  const loadCaddieLogs = async () => {
    console.log('🔍 Loading caddie logs from Supabase...');
    setLoadingStates(prev => ({ ...prev, caddieLogs: true }));
    setErrorStates(prev => ({ ...prev, caddieLogs: null }));
    
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) {
        console.log('❌ No authenticated user found');
        setLoadingStates(prev => ({ ...prev, caddieLogs: false }));
        return;
      }

      const { data: caddieLogs, error } = await supabase
        .from('caddie_logs')
        .select('*')
        .eq('user_id', user.data.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading caddie logs:', error);
        setErrorStates(prev => ({ ...prev, caddieLogs: `Failed to load caddie logs: ${error.message}` }));
      } else {
        console.log('✅ Loaded caddie logs:', caddieLogs?.length || 0);
        setCaddieLogs(caddieLogs || []);
      }
    } catch (error) {
      console.error('❌ Unexpected error loading caddie logs:', error);
      setErrorStates(prev => ({ ...prev, caddieLogs: `Unexpected error: ${error}` }));
    }
    
    setLoadingStates(prev => ({ ...prev, caddieLogs: false }));
  };

  const loadSwingAnalyses = async () => {
    console.log('🔍 Loading swing analyses from Supabase...');
    setLoadingStates(prev => ({ ...prev, swingAnalyses: true }));
    setErrorStates(prev => ({ ...prev, swingAnalyses: null }));
    
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) {
        console.log('❌ No authenticated user found');
        setLoadingStates(prev => ({ ...prev, swingAnalyses: false }));
        return;
      }

      const { data: analyses, error } = await supabase
        .from('pro_ai_analyses')
        .select('*')
        .eq('user_id', user.data.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading swing analyses:', error);
        setErrorStates(prev => ({ ...prev, swingAnalyses: `Failed to load swing analyses: ${error.message}` }));
      } else {
        console.log('✅ Loaded swing analyses:', analyses?.length || 0);
        
        // Convert to SwingAnalysis format
        const formattedAnalyses = analyses?.map(analysis => ({
          id: analysis.id,
          save_card: analysis.swing_context || 'Swing Analysis',
          tags: [],
          category: 'Analysis',
          content: JSON.stringify(analysis.analysis_results || {}),
          videoUrl: analysis.video_url,
          timestamp: new Date(analysis.created_at),
          conversation: (analysis.analysis_results as any)?.conversation || []
        })) || [];
        
        setSwingAnalyses(formattedAnalyses);
      }
    } catch (error) {
      console.error('❌ Unexpected error loading swing analyses:', error);
      setErrorStates(prev => ({ ...prev, swingAnalyses: `Unexpected error: ${error}` }));
    }
    
    setLoadingStates(prev => ({ ...prev, swingAnalyses: false }));
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      // Delete from Supabase database only
      const user = await supabase.auth.getUser();
      if (user.data.user) {
        const { error } = await supabase
          .from('conversations')
          .delete()
          .eq('id', conversationId)
          .eq('user_id', user.data.user.id);

        if (error) {
          console.error('❌ Error deleting conversation:', error);
          toast({
            title: "Error",
            description: "Failed to delete conversation",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Update local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // If expanded conversation was deleted, collapse
      if (expandedCard?.type === 'chat' && expandedCard?.id === conversationId) {
        setExpandedCard(null);
      }
      
      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed from your history",
      });
      
    } catch (error) {
      console.error('❌ Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    }
  };

  const deleteCaddieLog = async (logId: string) => {
    try {
      const user = await supabase.auth.getUser();
      if (user.data.user) {
        const { error } = await supabase
          .from('caddie_logs')
          .delete()
          .eq('id', logId)
          .eq('user_id', user.data.user.id);

        if (error) {
          console.error('❌ Error deleting caddie log:', error);
          toast({
            title: "Error",
            description: "Failed to delete caddie log",
            variant: "destructive",
          });
          return;
        }
      }
      
      setCaddieLogs(prev => prev.filter(log => log.id !== logId));
      
      if (expandedCard?.type === 'caddie' && expandedCard?.id === logId) {
        setExpandedCard(null);
      }
      
      toast({
        title: "Caddie log deleted",
        description: "The log has been removed from your history",
      });
      
    } catch (error) {
      console.error('❌ Error deleting caddie log:', error);
      toast({
        title: "Error",
        description: "Failed to delete caddie log",
        variant: "destructive",
      });
    }
  };

  const deleteSwingAnalysis = async (analysisId: string) => {
    try {
      const user = await supabase.auth.getUser();
      if (user.data.user) {
        const { error } = await supabase
          .from('pro_ai_analyses')
          .delete()
          .eq('id', analysisId)
          .eq('user_id', user.data.user.id);

        if (error) {
          console.error('❌ Error deleting swing analysis:', error);
          toast({
            title: "Error",
            description: "Failed to delete swing analysis",
            variant: "destructive",
          });
          return;
        }
      }
      
      setSwingAnalyses(prev => prev.filter(analysis => analysis.id !== analysisId));
      
      if (expandedCard?.type === 'swing' && expandedCard?.id === analysisId) {
        setExpandedCard(null);
      }
      
      toast({
        title: "Swing analysis deleted",
        description: "The analysis has been removed from your history",
      });
      
    } catch (error) {
      console.error('❌ Error deleting swing analysis:', error);
      toast({
        title: "Error",
        description: "Failed to delete swing analysis",
        variant: "destructive",
      });
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredCaddieLogs = caddieLogs.filter(log => 
    (log.content?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (log.course_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (log.transcription?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  );

  const filteredSwingAnalyses = swingAnalyses.filter(analysis => 
    analysis.save_card.toLowerCase().includes(searchQuery.toLowerCase()) ||
    analysis.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [...new Set([
    ...savedInsights.map(insight => insight.category),
    ...swingAnalyses.map(analysis => analysis.category)
  ])];

  const allTags = [...new Set([
    ...savedInsights.flatMap(insight => insight.tags),
    ...swingAnalyses.flatMap(analysis => analysis.tags),
    ...(caddieLogs.flatMap(log => log.tags || []))
  ])];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 gap-0 bg-gradient-to-br from-blue-50/30 via-white to-cyan-50/30 border border-blue-100/50 shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-blue-100/30 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
              Echo History
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="p-6 pb-4 bg-white/30 backdrop-blur-sm border-b border-blue-100/30">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations, insights, and analyses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/80 border-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20"
              />
            </div>
            <div className="flex gap-2">
              {onNewConversation && (
                <Button
                  onClick={onNewConversation}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mx-6 mt-4 bg-white/50 border border-blue-200/30">
            <TabsTrigger 
              value="chat" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
            >
              <MessageSquare className="h-4 w-4" />
              Chat ({conversations.length})
            </TabsTrigger>
            <TabsTrigger 
              value="insights" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
            >
              <Mic className="h-4 w-4" />
              Caddie ({caddieLogs.length})
            </TabsTrigger>
            <TabsTrigger 
              value="swing-coach" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
            >
              <BarChart3 className="h-4 w-4" />
              Swing Coach ({swingAnalyses.length})
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="flex-1 m-0 p-6 pt-4">
            <ScrollArea 
              className="h-[60vh]" 
              ref={chatAutoScroll.scrollAreaRef}
            >
              <div className="space-y-4 pr-4">
                {loadingStates.conversations ? (
                  Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
                ) : errorStates.conversations ? (
                  <ErrorState 
                    message={errorStates.conversations} 
                    onRetry={loadChatConversations}
                  />
                ) : filteredConversations.length === 0 ? (
                  <EmptyState
                    icon={<MessageCircle className="h-12 w-12" />}
                    title="No conversations found"
                    subtitle={searchQuery ? "Try adjusting your search terms" : "Start a conversation to see your chat history here"}
                  />
                ) : (
                  filteredConversations.map((conversation) => (
                    <div key={conversation.id} className="group">
                      <div 
                        className={`min-h-[112px] sm:min-h-[120px] px-4 sm:px-5 py-3 sm:py-3.5 rounded-[14px] bg-white/90 border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex flex-col ${
                          expandedCard?.type === 'chat' && expandedCard?.id === conversation.id ? 'shadow-lg h-auto' : ''
                        }`}
                        onClick={() => handleExpansion('chat', conversation.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Conversation Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            {editingConversationId === conversation.id ? (
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <Input
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      // TODO: Save title
                                      setEditingConversationId(null);
                                    } else if (e.key === 'Escape') {
                                      setEditingConversationId(null);
                                    }
                                  }}
                                  className="text-sm font-semibold bg-white border-blue-200 focus:border-blue-400"
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <h4 className="font-semibold text-sm text-gray-900 truncate">
                                {conversation.title}
                              </h4>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {conversation.timestamp.toLocaleDateString()}
                          </span>
                        </div>

                        {/* Preview Messages */}
                        <div className="flex-1 mb-3 overflow-hidden">
                          <div className="space-y-1">
                            {conversation.messages.slice(0, 2).map((message, index) => (
                              <div key={index} className="text-xs text-gray-600 line-clamp-1">
                                <span className="font-medium">
                                  {message.type === 'user' ? 'You' : 'Echo'}:
                                </span>{' '}
                                {message.content}
                              </div>
                            ))}
                            {conversation.messages.length > 2 && (
                              <div className="text-xs text-gray-400">
                                +{conversation.messages.length - 2} more messages
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-100 text-blue-600 text-xs px-2.5 py-1 rounded-full font-medium">
                              {conversation.messages.length} messages
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditTitle(conversation.title);
                                setEditingConversationId(conversation.id);
                              }}
                              className="h-8 px-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                              title="Rename"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExpansion('chat', conversation.id);
                              }}
                              className="h-8 px-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                              title={expandedCard?.type === 'chat' && expandedCard?.id === conversation.id ? "Collapse" : "Expand"}
                            >
                              {expandedCard?.type === 'chat' && expandedCard?.id === conversation.id ? 
                                <Minimize2 className="h-4 w-4" /> : 
                                <Maximize2 className="h-4 w-4" />
                              }
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
                                  deleteConversation(conversation.id);
                                }
                              }}
                              className="h-8 px-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {expandedCard?.type === 'chat' && expandedCard?.id === conversation.id && (
                          <div className="mt-3 pt-3 border-t border-gray-200 animate-accordion-down">
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                              {conversation.messages.map((message, index) => (
                                <div
                                  key={index}
                                  className={`p-3 rounded-lg ${
                                    message.type === 'user' 
                                      ? 'bg-blue-50 border-l-4 border-blue-500' 
                                      : 'bg-gray-50 border-l-4 border-gray-300'
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                      {message.type === 'user' ? 'You' : 'Echo'}
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {message.content}
                                  </div>
                                  {message.type === 'user' && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          onSelectMessage(message.content);
                                          onClose();
                                        }}
                                        className="text-xs bg-white hover:bg-gray-50 border-gray-300"
                                      >
                                        Use This Message
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Caddie Logs Tab */}
          <TabsContent value="insights" className="flex-1 m-0 p-6 pt-4">
            <ScrollArea 
              className="h-[60vh]" 
              ref={logsAutoScroll.scrollAreaRef}
            >
              <div className="space-y-4 pr-4">
                {loadingStates.caddieLogs ? (
                  Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
                ) : errorStates.caddieLogs ? (
                  <ErrorState 
                    message={errorStates.caddieLogs} 
                    onRetry={loadCaddieLogs}
                  />
                ) : filteredCaddieLogs.length === 0 ? (
                  <EmptyState
                    icon={<Mic className="h-12 w-12" />}
                    title="No caddie logs found"
                    subtitle={searchQuery ? "Try adjusting your search terms" : "Record some caddie notes to see them here"}
                  />
                ) : (
                  filteredCaddieLogs.map((log) => (
                    <div key={log.id} className="group">
                      <div 
                        className="min-h-[112px] sm:min-h-[120px] px-4 sm:px-5 py-3 sm:py-3.5 rounded-[14px] bg-white/90 border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex flex-col cursor-pointer"
                        onClick={() => handleExpansion('caddie', log.id)}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-sm text-gray-900 truncate">
                            {log.course_name || 'Caddie Note'}
                          </h4>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {new Date(log.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Content Preview */}
                        <div className="flex-1 mb-3 overflow-hidden">
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {log.content || log.transcription || 'No content'}
                          </p>
                        </div>

                        {/* Action Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="bg-green-100 text-green-600 text-xs px-2.5 py-1 rounded-full font-medium">
                              Caddie Log
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExpansion('caddie', log.id);
                              }}
                              className="h-8 px-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                              title={expandedCard?.type === 'caddie' && expandedCard?.id === log.id ? "Collapse" : "Expand"}
                            >
                              {expandedCard?.type === 'caddie' && expandedCard?.id === log.id ? 
                                <Minimize2 className="h-4 w-4" /> : 
                                <Maximize2 className="h-4 w-4" />
                              }
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Are you sure you want to delete this caddie log? This action cannot be undone.')) {
                                  deleteCaddieLog(log.id);
                                }
                              }}
                              className="h-8 px-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {expandedCard?.type === 'caddie' && expandedCard?.id === log.id && (
                          <div className="mt-3 pt-3 border-t border-gray-200 animate-accordion-down">
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                              <div className="p-4 rounded-lg bg-gray-50">
                                <h5 className="text-sm font-semibold mb-2">Content</h5>
                                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                  {log.content}
                                </div>
                              </div>
                              {log.transcription && log.transcription !== log.content && (
                                <div className="p-4 rounded-lg bg-blue-50">
                                  <h5 className="text-sm font-semibold mb-2">Transcription</h5>
                                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {log.transcription}
                                  </div>
                                </div>
                              )}
                              {log.location_name && (
                                <div className="p-3 rounded-lg bg-gray-50">
                                  <h5 className="text-sm font-semibold mb-1">Location</h5>
                                  <div className="text-sm text-gray-600">
                                    {log.location_name}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Swing Coach Tab */}
          <TabsContent value="swing-coach" className="flex-1 m-0 p-6 pt-4">
            <ScrollArea 
              className="h-[60vh]" 
              ref={swingAutoScroll.scrollAreaRef}
            >
              <div className="space-y-4 pr-4">
                {loadingStates.swingAnalyses ? (
                  Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
                ) : errorStates.swingAnalyses ? (
                  <ErrorState 
                    message={errorStates.swingAnalyses} 
                    onRetry={loadSwingAnalyses}
                  />
                ) : filteredSwingAnalyses.length === 0 ? (
                  <EmptyState
                    icon={<BarChart3 className="h-12 w-12" />}
                    title="No swing analyses found"
                    subtitle={searchQuery ? "Try adjusting your search terms" : "Upload a swing video to get started"}
                  />
                ) : (
                  filteredSwingAnalyses.map((analysis) => (
                    <SwingAnalysisCard
                      key={analysis.id}
                      analysis={analysis}
                      onDelete={() => deleteSwingAnalysis(analysis.id)}
                      isExpanded={expandedCard?.type === 'swing' && expandedCard?.id === analysis.id}
                      onToggleExpand={() => handleExpansion('swing', analysis.id)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AIChatHistory;