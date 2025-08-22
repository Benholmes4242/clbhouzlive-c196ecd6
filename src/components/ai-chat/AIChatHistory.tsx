import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Filter, Trash2, RotateCcw, Play, Maximize2, Calendar, FileText, Plus, Edit2, MessageSquare, Minimize2 } from 'lucide-react';
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
            <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full border border-gray-200">
              Analysis
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="h-7 px-2 text-xs text-gray-400 hover:text-gray-600"
              title={isExpanded ? "Minimize" : "View details"}
            >
              {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-7 px-2 text-gray-400 hover:text-red-500 hover:bg-red-50"
            title="Delete analysis"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
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

const AIChatHistory: React.FC<AIChatHistoryProps> = ({ isOpen, onClose, onSelectMessage, onNewConversation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [historyMessages, setHistoryMessages] = useState<HistoryMessage[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  
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
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const conversationsWithMessages = data?.map(conv => {
        const messages = (conv.messages as any[]) || [];
        return {
          id: conv.id,
          title: conv.title || "New conversation",
          customTitle: conv.title,
          messages: messages.map((msg, index) => ({
            id: `${conv.id}-${index}`,
            type: msg.role as 'user' | 'ai',
            content: msg.content,
            timestamp: new Date(msg.timestamp || conv.created_at),
            metadata: msg.metadata
          })),
          timestamp: new Date(conv.updated_at),
          createdAt: new Date(conv.created_at),
          lastActivityAt: new Date(conv.updated_at),
          messageCount: messages.length
        };
      }) || [];

      setConversations(conversationsWithMessages);
    } catch (error) {
      console.error('Error loading chat conversations:', error);
    }
  };

  const loadCaddieLogs = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('caddie_logs')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCaddieLogs(data || []);
    } catch (error) {
      console.error('Error loading caddie logs:', error);
    }
  };

  const loadSwingAnalyses = async () => {
    // No swing analyses table exists in the database yet
    setSwingAnalyses([]);
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

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

  const deleteCaddieLog = async (logId: string) => {
    try {
      const { error } = await supabase
        .from('caddie_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;

      setCaddieLogs(prev => prev.filter(log => log.id !== logId));
      toast({
        title: "Caddie log deleted",
        description: "The log has been removed from your history."
      });
    } catch (error) {
      console.error('Error deleting caddie log:', error);
      toast({
        title: "Error",
        description: "Failed to delete caddie log. Please try again.",
        variant: "destructive"
      });
    }
  };

  const deleteSwingAnalysis = async (analysisId: string) => {
    // No swing analyses table exists yet
    setSwingAnalyses(prev => prev.filter(analysis => analysis.id !== analysisId));
    toast({
      title: "Analysis deleted",
      description: "The swing analysis has been removed from your history."
    });
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
              <TabsTrigger value="swing-coach" className="data-[state=active]:bg-white/80">
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
                  {filteredConversations.length > 0 ? (
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
                                   <h3 className="font-semibold text-sm text-gray-900 flex-1 mr-3 line-clamp-1" title={conversation.messages.find(msg => msg.type === 'user')?.content || conversation.title}>
                                     {conversation.messages.find(msg => msg.type === 'user')?.content || conversation.title}
                                   </h3>
                                   <span className="text-xs text-gray-500 flex-shrink-0">
                                     {conversation.timestamp.toLocaleDateString()}
                                   </span>
                                 </div>

                                 {/* Body Preview - First AI Response */}
                                 <div className="flex-1 mb-3">
                                   {(() => {
                                     const firstAIMessage = conversation.messages.find(msg => msg.type === 'ai');
                                     return firstAIMessage ? (
                                       <p className="text-sm text-gray-600 line-clamp-2 sm:line-clamp-3">
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
                                      className="bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700 rounded-full px-3 py-1.5 text-xs h-auto"
                                    >
                                      {expandedCard?.type === 'chat' && expandedCard?.id === conversation.id ? "Hide" : "Show"} Conversation
                                    </Button>
                                    {conversation.messageCount && (
                                      <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full border border-gray-200">
                                        {conversation.messageCount}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleExpansion('chat', conversation.id)}
                                      className="h-7 px-2 text-xs text-gray-400 hover:text-gray-600"
                                      title={expandedCard?.type === 'chat' && expandedCard?.id === conversation.id ? "Minimize" : "View details"}
                                    >
                                      {expandedCard?.type === 'chat' && expandedCard?.id === conversation.id ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteConversation(conversation.id)}
                                      className="h-7 px-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-100"
                                      aria-label={`Delete conversation: ${conversation.title}`}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {expandedCard?.type === 'chat' && expandedCard?.id === conversation.id && (
                            <div className="mt-3 pt-3 border-t border-gray-200 animate-accordion-down">
                              <div className="space-y-3 max-h-80 overflow-y-auto">
                                {conversation.messages.map((message) => (
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
                    <div className="text-center text-gray-600 py-8">
                      <div className="text-center">
                        <p className="text-sm">No chat history found</p>
                        <p className="text-xs mt-1 opacity-70">Start a conversation with Echo to see it here</p>
                      </div>
                    </div>
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
                  {filteredCaddieLogs.length > 0 ? (
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
                                  <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full border border-gray-200">
                                    Caddie Log
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleExpansion('caddie', log.id)}
                                    className="h-7 px-2 text-xs text-gray-400 hover:text-gray-600"
                                    title={isExpanded ? "Minimize" : "View details"}
                                  >
                                    {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                                  </Button>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteCaddieLog(log.id)}
                                  className="h-7 px-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-100"
                                  aria-label={`Delete caddie log from ${new Date(log.created_at).toLocaleDateString()}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
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
                    <div className="text-center text-gray-600 py-8">
                      <div className="text-center">
                        <p className="text-sm">No caddie logs found</p>
                        <p className="text-xs mt-1 opacity-70">Record voice notes during your rounds to see them here</p>
                      </div>
                    </div>
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
                  {filteredSwingAnalyses.length > 0 ? (
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
                    <div className="text-center text-gray-600 py-8">
                      <div className="text-center">
                        <p className="text-sm">No swing analyses found</p>
                        <p className="text-xs mt-1 opacity-70">Upload swing videos to Swing Coach to see them here</p>
                      </div>
                    </div>
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