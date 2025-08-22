import React, { useState, useEffect } from 'react';
import { X, Search, Filter, Trash2, RotateCcw, Play, Maximize2, Calendar, FileText, Plus, Edit2, MessageSquare, Minimize2, ChevronUp, ChevronDown } from 'lucide-react';
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
import { useIsMobile } from '@/hooks/use-mobile';

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

// Chat Card Component
const ChatCard: React.FC<{
  conversation: ChatConversation;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ conversation, onDelete, onRename, isExpanded, onToggleExpand }) => {
  const isMobile = useIsMobile();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(conversation.customTitle || conversation.title);

  const handleRename = () => {
    if (newTitle.trim() !== conversation.title && newTitle.trim() !== '') {
      onRename(newTitle.trim());
    }
    setIsRenaming(false);
  };

  const firstUserMessage = conversation.messages.find(m => m.type === 'user')?.content || 'No user message';
  const firstAiResponse = conversation.messages.find(m => m.type === 'ai')?.content || 'No AI response';

  const cardPadding = isMobile ? 'p-4' : 'px-5 py-3.5';
  const cardHeight = isMobile ? 'min-h-[112px]' : 'min-h-[120px]';
  const titleLines = isMobile ? 'line-clamp-1' : 'line-clamp-1';
  const previewLines = isMobile ? 'line-clamp-2' : 'line-clamp-3';

  return (
    <div 
      className={`${cardPadding} ${cardHeight} rounded-[14px] bg-card shadow-sm border transition-all duration-200 ${
        isExpanded ? 'h-auto max-h-[600px]' : ''
      }`}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') {
                  setIsRenaming(false);
                  setNewTitle(conversation.customTitle || conversation.title);
                }
              }}
              className="w-full text-sm font-semibold bg-transparent border-b border-border focus:outline-none focus:border-primary"
              autoFocus
            />
          ) : (
            <h3 
              className={`text-sm font-semibold ${titleLines} cursor-pointer hover:text-primary transition-colors`}
              onClick={() => setIsRenaming(true)}
              title={conversation.customTitle || conversation.title}
            >
              {conversation.customTitle || conversation.title}
            </h3>
          )}
        </div>
        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
          {conversation.lastActivityAt.toLocaleDateString()}
        </span>
      </div>

      {/* Body Preview */}
      {!isExpanded && (
        <div className="mb-3">
          <p className={`text-xs text-muted-foreground ${previewLines} leading-relaxed`}>
            {firstAiResponse}
          </p>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mb-3 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {conversation.messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg text-xs ${
                  message.type === 'user' 
                    ? 'bg-primary/10 border-l-2 border-primary' 
                    : 'bg-muted border-l-2 border-muted-foreground/30'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <Badge variant={message.type === 'user' ? 'default' : 'secondary'} className="text-xs">
                    {message.type === 'user' ? 'You' : 'Echo AI'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-xs leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="h-7 px-3 text-xs bg-muted/50 hover:bg-muted border-0 focus:ring-0"
          >
            {isExpanded ? 'Hide Conversation' : 'Show Conversation'}
          </Button>
          <Badge variant="secondary" className="text-xs border-0">
            {conversation.messageCount || conversation.messages.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="h-7 w-7 p-0 hover:bg-muted border-0 focus:ring-0"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 border-0 focus:ring-0"
            title="Delete conversation"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Caddie Log Card Component
const CaddieLogCard: React.FC<{
  log: CaddieLog;
  onDelete: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ log, onDelete, isExpanded, onToggleExpand }) => {
  const isMobile = useIsMobile();
  
  const cardPadding = isMobile ? 'p-4' : 'px-5 py-3.5';
  const cardHeight = isMobile ? 'min-h-[112px]' : 'min-h-[120px]';
  const previewLines = isMobile ? 'line-clamp-4' : 'line-clamp-5';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div 
      className={`${cardPadding} ${cardHeight} rounded-[14px] bg-card shadow-sm border transition-all duration-200 ${
        isExpanded ? 'h-auto' : ''
      }`}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-semibold line-clamp-1">
          {formatDate(log.created_at)}
        </h3>
        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
          {log.location_name && (
            <Badge variant="outline" className="text-xs border-0 bg-muted/50">
              {log.location_name}
            </Badge>
          )}
        </div>
      </div>

      {/* Body Preview */}
      <div className="mb-3">
        <p className={`text-xs text-foreground leading-relaxed ${isExpanded ? '' : previewLines}`}>
          {log.content || log.transcription || 'No content available'}
        </p>
      </div>

      {/* Action Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs border-0">
            Caddie Log
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="h-7 w-7 p-0 hover:bg-muted border-0 focus:ring-0"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 border-0 focus:ring-0"
            title="Delete log"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Swing Coach Card Component
const SwingCoachCard: React.FC<{
  analysis: SwingAnalysis;
  onDelete: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ analysis, onDelete, isExpanded, onToggleExpand }) => {
  const isMobile = useIsMobile();
  const [thumbnailError, setThumbnailError] = useState(false);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  const cardPadding = isMobile ? 'p-4' : 'px-5 py-3.5';
  const cardHeight = isMobile ? 'min-h-[112px]' : 'min-h-[120px]';

  const handleThumbnailError = () => {
    setThumbnailError(true);
    setThumbnailLoading(false);
  };

  const handleThumbnailLoad = () => {
    setThumbnailLoading(false);
  };

  return (
    <div 
      className={`${cardPadding} ${cardHeight} rounded-[14px] bg-card shadow-sm border transition-all duration-200 ${
        isExpanded ? 'h-auto' : ''
      }`}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-0 bg-muted/50">
            Swing
          </Badge>
          <span className="text-xs text-muted-foreground">
            {analysis.timestamp.toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Body Preview */}
      {!isExpanded && (
        <div className="flex gap-3 mb-3">
          {/* Video Thumbnail */}
          <div className="flex-shrink-0">
            <div className="relative w-20 h-12 bg-muted rounded-lg overflow-hidden">
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
                    <div className="bg-white/90 rounded-full p-1">
                      <Play className="h-2 w-2 text-black" fill="currentColor" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-medium line-clamp-1 mb-1">
              {analysis.title || analysis.save_card || 'Swing Analysis'}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-1">
              Analysis available
            </p>
          </div>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mb-3 space-y-4">
          {/* Video Section */}
          {(analysis.videoUrl || analysis.videoSrc) && !(analysis.videoSrc && analysis.videoSrc.startsWith('blob:')) ? (
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              {isVideoLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
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
                  <FileText className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-xs font-medium mb-1">Video Preview</p>
                  <p className="text-xs opacity-80">New swing analyses will have permanent video links</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <FileText className="h-6 w-6 mx-auto mb-2" />
                <p className="text-xs">No video available</p>
              </div>
            </div>
          )}
          
          {/* Analysis Content */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Analysis</h4>
            {analysis.conversation && analysis.conversation.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {analysis.conversation.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-xs ${
                      message.role === 'user' 
                        ? 'bg-primary/10 border-l-2 border-primary' 
                        : 'bg-muted border-l-2 border-muted-foreground/30'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <Badge variant={message.role === 'user' ? 'default' : 'secondary'} className="text-xs">
                        {message.role === 'user' ? 'You' : 'Echo Coach'}
                      </Badge>
                      {message.timestamp && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="text-xs leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-xs leading-relaxed whitespace-pre-wrap">
                  {analysis.content}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs border-0">
            Analysis
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="h-7 w-7 p-0 hover:bg-muted border-0 focus:ring-0"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 border-0 focus:ring-0"
            title="Delete analysis"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
}> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-sm font-medium mb-2">{title}</h3>
    <p className="text-xs text-muted-foreground max-w-sm">{description}</p>
  </div>
);

// Main Component
const AIChatHistory: React.FC<AIChatHistoryProps> = ({ isOpen, onClose, onSelectMessage, onNewConversation }) => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [expandedItems, setExpandedItems] = useState<{[key: string]: boolean}>({});
  
  // Data states
  const [chatConversations, setChatConversations] = useState<ChatConversation[]>([]);
  const [caddieLogsData, setCaddieLogsData] = useState<CaddieLog[]>([]);
  const [swingAnalyses, setSwingAnalyses] = useState<SwingAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load data
  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadChatConversations(),
        loadCaddieLogsFromSupabase(),
        loadSwingAnalyses()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error loading history",
        description: "Some data might not be available.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatConversations = () => {
    try {
      const conversations = localStorage.getItem('clbhouz_ai_chat');
      if (conversations) {
        const parsed = JSON.parse(conversations);
        const mapped = parsed.map((conv: any) => ({
          ...conv,
          timestamp: new Date(conv.timestamp),
          createdAt: new Date(conv.createdAt),
          lastActivityAt: new Date(conv.lastActivityAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setChatConversations(mapped);
      }
    } catch (error) {
      console.error('Error loading chat conversations:', error);
    }
  };

  const loadCaddieLogsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('caddie_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCaddieLogsData(data || []);
    } catch (error) {
      console.error('Error loading caddie logs:', error);
    }
  };

  const loadSwingAnalyses = async () => {
    try {
      // Load from localStorage for now (Supabase table doesn't exist yet)
      const localData = localStorage.getItem('swing_insights');
      let localAnalyses: SwingAnalysis[] = [];
      
      if (localData) {
        const parsed = JSON.parse(localData);
        localAnalyses = parsed.map((analysis: any) => ({
          ...analysis,
          timestamp: new Date(analysis.timestamp)
        }));
      }

      const sortedAnalyses = localAnalyses.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setSwingAnalyses(sortedAnalyses);
    } catch (error) {
      console.error('Error loading swing analyses:', error);
    }
  };

  // Toggle expand
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const newExpanded = { [id]: !prev[id] };
      return newExpanded;
    });
  };

  // Delete functions
  const deleteChatConversation = (conversationId: string) => {
    try {
      const conversations = localStorage.getItem('clbhouz_ai_chat');
      if (conversations) {
        const parsed = JSON.parse(conversations);
        const filtered = parsed.filter((conv: any) => conv.id !== conversationId);
        localStorage.setItem('clbhouz_ai_chat', JSON.stringify(filtered));
        loadChatConversations();
        toast({
          title: "Conversation deleted",
          description: "The conversation has been removed from your history.",
        });
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation.",
        variant: "destructive",
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

      setCaddieLogsData(prev => prev.filter(log => log.id !== logId));
      toast({
        title: "Caddie log deleted",
        description: "The log has been removed from your history.",
      });
    } catch (error) {
      console.error('Error deleting caddie log:', error);
      toast({
        title: "Error",
        description: "Failed to delete caddie log.",
        variant: "destructive",
      });
    }
  };

  const deleteSwingAnalysis = async (analysisId: string) => {
    try {
      // Delete from localStorage
      const localData = localStorage.getItem('swing_insights');
      if (localData) {
        const parsed = JSON.parse(localData);
        const filtered = parsed.filter((analysis: any) => analysis.id !== analysisId);
        localStorage.setItem('swing_insights', JSON.stringify(filtered));
      }

      // Update state
      setSwingAnalyses(prev => prev.filter(analysis => analysis.id !== analysisId));
      toast({
        title: "Swing analysis deleted",
        description: "The analysis has been removed from your history.",
      });
    } catch (error) {
      console.error('Error deleting swing analysis:', error);
      toast({
        title: "Error",
        description: "Failed to delete swing analysis.",
        variant: "destructive",
      });
    }
  };

  // Rename conversation
  const renameChatConversation = (conversationId: string, newTitle: string) => {
    try {
      const conversations = localStorage.getItem('clbhouz_ai_chat');
      if (conversations) {
        const parsed = JSON.parse(conversations);
        const updated = parsed.map((conv: any) => 
          conv.id === conversationId ? { ...conv, customTitle: newTitle } : conv
        );
        localStorage.setItem('clbhouz_ai_chat', JSON.stringify(updated));
        loadChatConversations();
        toast({
          title: "Conversation renamed",
          description: "The conversation title has been updated.",
        });
      }
    } catch (error) {
      console.error('Error renaming conversation:', error);
      toast({
        title: "Error",
        description: "Failed to rename conversation.",
        variant: "destructive",
      });
    }
  };

  // Filter data based on search
  const filteredChatConversations = chatConversations.filter(conv =>
    (conv.customTitle || conv.title).toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredCaddieLogsData = caddieLogsData.filter(log =>
    (log.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     log.transcription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     log.location_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     log.course_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredSwingAnalyses = swingAnalyses.filter(analysis =>
    (analysis.save_card?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     analysis.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     analysis.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     analysis.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  // Calculate gap between cards
  const cardGap = isMobile ? 'gap-4' : 'gap-5';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] h-[80vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-lg font-semibold">Echo History</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="px-6 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-0 bg-muted/50 focus:ring-0"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mx-6 mb-4 grid w-full grid-cols-3 [&>*]:border-0 [&>*]:focus:ring-0 [&>*]:focus-visible:ring-0">
            <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
            <TabsTrigger value="caddie" className="text-xs">Caddie Logs</TabsTrigger>
            <TabsTrigger value="swing" className="text-xs">Swing Coach</TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="flex-1 m-0">
            <ScrollArea className="h-full px-6 pb-6">
              {isLoading ? (
                <div className={`flex flex-col ${cardGap}`}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-[120px] rounded-[14px] bg-muted animate-pulse" />
                  ))}
                </div>
              ) : filteredChatConversations.length === 0 ? (
                <EmptyState
                  icon={<MessageSquare className="h-6 w-6 text-muted-foreground" />}
                  title="No conversations yet"
                  description="Your chat conversations will appear here."
                />
              ) : (
                <div className={`flex flex-col ${cardGap}`}>
                  {filteredChatConversations.map((conversation) => (
                    <ChatCard
                      key={conversation.id}
                      conversation={conversation}
                      onDelete={() => deleteChatConversation(conversation.id)}
                      onRename={(newTitle) => renameChatConversation(conversation.id, newTitle)}
                      isExpanded={expandedItems[conversation.id] || false}
                      onToggleExpand={() => toggleExpand(conversation.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Caddie Logs Tab */}
          <TabsContent value="caddie" className="flex-1 m-0">
            <ScrollArea className="h-full px-6 pb-6">
              {isLoading ? (
                <div className={`flex flex-col ${cardGap}`}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-[120px] rounded-[14px] bg-muted animate-pulse" />
                  ))}
                </div>
              ) : filteredCaddieLogsData.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-6 w-6 text-muted-foreground" />}
                  title="No caddie logs yet"
                  description="Your voice notes and course logs will appear here."
                />
              ) : (
                <div className={`flex flex-col ${cardGap}`}>
                  {filteredCaddieLogsData.map((log) => (
                    <CaddieLogCard
                      key={log.id}
                      log={log}
                      onDelete={() => deleteCaddieLog(log.id)}
                      isExpanded={expandedItems[log.id] || false}
                      onToggleExpand={() => toggleExpand(log.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Swing Coach Tab */}
          <TabsContent value="swing" className="flex-1 m-0">
            <ScrollArea className="h-full px-6 pb-6">
              {isLoading ? (
                <div className={`flex flex-col ${cardGap}`}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-[120px] rounded-[14px] bg-muted animate-pulse" />
                  ))}
                </div>
              ) : filteredSwingAnalyses.length === 0 ? (
                <EmptyState
                  icon={<Play className="h-6 w-6 text-muted-foreground" />}
                  title="No swing analyses yet"
                  description="Your swing coaching sessions will appear here."
                />
              ) : (
                <div className={`flex flex-col ${cardGap}`}>
                  {filteredSwingAnalyses.map((analysis) => (
                    <SwingCoachCard
                      key={analysis.id}
                      analysis={analysis}
                      onDelete={() => deleteSwingAnalysis(analysis.id)}
                      isExpanded={expandedItems[analysis.id] || false}
                      onToggleExpand={() => toggleExpand(analysis.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AIChatHistory;