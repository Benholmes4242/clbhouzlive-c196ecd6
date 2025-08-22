import React, { useState, useEffect } from 'react';
import { X, Search, Filter, Trash2, RotateCcw, Play, Maximize2, Calendar, FileText, Plus, Edit2, MessageSquare } from 'lucide-react';
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

// Video Player Dialog Component
const VideoPlayerDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  videoSrc?: string;
  videoPoster?: string;
  title: string;
  date: string;
  tags: string[];
}> = ({ isOpen, onClose, videoSrc, videoPoster, title, date, tags }) => {
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            {title}
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {date}
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {videoSrc && !videoSrc.startsWith('blob:') ? (
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              {isVideoLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
              <video
                src={videoSrc}
                poster={videoPoster}
                controls
                className="w-full h-full object-cover"
                onLoadStart={() => setIsVideoLoading(true)}
                onCanPlay={() => setIsVideoLoading(false)}
                onError={() => setIsVideoLoading(false)}
              />
            </div>
          ) : videoPoster ? (
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              <img 
                src={videoPoster} 
                alt="Swing analysis"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="text-white text-center p-4">
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm font-medium mb-1">Video Preview</p>
                  <p className="text-xs opacity-80">Video playback not available for historical analyses</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Video not available</p>
              </div>
            </div>
          )}
          
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Full Conversation Dialog Component
const ConversationDetailsDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  analysis: SwingAnalysis;
}> = ({ isOpen, onClose, analysis }) => {
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Maximize2 className="h-4 w-4" />
            {analysis.title || analysis.save_card}
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {analysis.timestamp.toLocaleDateString()} at {analysis.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            {analysis.tags && analysis.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {analysis.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
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
          
          {/* Conversation Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Analysis Conversation</h3>
            {analysis.conversation && analysis.conversation.length > 0 ? (
              <div className="space-y-3">
                {analysis.conversation.map((message, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-primary/10 border-l-4 border-primary' 
                        : 'bg-muted border-l-4 border-muted-foreground'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={message.role === 'user' ? 'default' : 'secondary'}>
                        {message.role === 'user' ? 'You' : 'Echo Coach'}
                      </Badge>
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
      </DialogContent>
    </Dialog>
  );
};

// Swing Analysis Card Component
const SwingAnalysisCard: React.FC<{
  analysis: SwingAnalysis;
  onDelete: () => void;
}> = ({ analysis, onDelete }) => {
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);

  const handleThumbnailError = () => {
    setThumbnailError(true);
    setThumbnailLoading(false);
  };

  const handleThumbnailLoad = () => {
    setThumbnailLoading(false);
  };

  return (
    <>
      <div className="p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/20 hover:bg-white/70 transition-all duration-160 hover:shadow-md">
        <div className="flex items-start gap-3">
          {/* Left Column - Video Thumbnail */}
          <div className="flex-shrink-0">
            <div className="relative w-28 sm:w-36 aspect-video bg-white/40 rounded-lg overflow-hidden border border-white/30 shadow-sm hover:shadow-md transition-shadow">
              {analysis.videoThumbnail && !thumbnailError ? (
                <>
                  {thumbnailLoading && (
                    <div className="absolute inset-0 bg-muted animate-pulse" />
                  )}
                  <img 
                    src={analysis.videoThumbnail} 
                    alt="Swing thumbnail"
                    className="w-full h-full object-cover cursor-pointer"
                    onError={handleThumbnailError}
                    onLoad={handleThumbnailLoad}
                    onClick={() => setVideoDialogOpen(true)}
                  />
                  <button
                    onClick={() => setVideoDialogOpen(true)}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group"
                    aria-label="Play swing video"
                  >
                    <div className="bg-white/90 rounded-full p-2 group-hover:scale-110 transition-transform">
                      <Play className="h-4 w-4 text-black" fill="currentColor" />
                    </div>
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-6 w-6 mx-auto mb-1" />
                    <p className="text-xs">No video</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Text Content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{analysis.category}</Badge>
                <span className="text-xs text-muted-foreground">
                  {analysis.timestamp.toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDetailsDialogOpen(true)}
                  className="h-7 px-2 text-xs"
                  title="View details"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="h-7 px-2 text-destructive hover:text-destructive"
                  title="Delete analysis"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <h3 className="text-sm font-medium mb-2 line-clamp-2">{analysis.save_card}</h3>
            
            {analysis.tags && analysis.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {analysis.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {analysis.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{analysis.tags.length - 3} more
                  </Badge>
                )}
              </div>
            )}
            
            {analysis.voiceNote && (
              <Badge variant="outline" className="text-xs">
                Voice note attached
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Video Player Dialog */}
      <VideoPlayerDialog
        isOpen={videoDialogOpen}
        onClose={() => setVideoDialogOpen(false)}
        videoSrc={analysis.videoUrl || analysis.videoSrc}
        videoPoster={analysis.videoThumbnail || analysis.videoPoster}
        title={analysis.title || analysis.save_card}
        date={analysis.timestamp.toLocaleDateString()}
        tags={analysis.tags}
      />

      {/* Full Conversation Details Dialog */}
      <ConversationDetailsDialog
        isOpen={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        analysis={analysis}
      />
    </>
  );
};

const AIChatHistory: React.FC<AIChatHistoryProps> = ({ isOpen, onClose, onSelectMessage, onNewConversation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [historyMessages, setHistoryMessages] = useState<HistoryMessage[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null);
  const [savedInsights, setSavedInsights] = useState<SavedInsight[]>([]);
  const [swingAnalyses, setSwingAnalyses] = useState<SwingAnalysis[]>([]);
  const [caddieLogs, setCaddieLogs] = useState<CaddieLog[]>([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const { toast } = useToast();

  // Conversation session management for new grouped conversations
  const conversationSession = useConversationSession({
    storageKey: 'clbhouz_ai_chat',
    isModalOpen: false // Not managing sessions here, just reading
  });

  // Auto-scroll hooks for each tab
  const chatAutoScroll = useAutoScroll({
    dependencies: [conversations, expandedConversation],
    enabled: activeTab === 'chat',
    direction: 'top' // Latest conversations are at the top
  });
  
  const logsAutoScroll = useAutoScroll({
    dependencies: [caddieLogs],
    enabled: activeTab === 'logs',
    direction: 'top' // Latest logs are at the top
  });
  
  const swingAutoScroll = useAutoScroll({
    dependencies: [swingAnalyses],
    enabled: activeTab === 'swing-coach',
    direction: 'top' // Latest analyses are at the top
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Note: Body scroll locking is handled by parent AIChatOverlay component

  const loadData = async () => {
    // Load new conversation sessions first
    conversationSession.loadConversations();
    
    // Convert session conversations to the format expected by the UI
    const sessionConversations = conversationSession.conversations.map(session => ({
      id: session.id,
      title: session.customTitle || session.title || 'New conversation',
      customTitle: session.customTitle,
      messages: session.messages.map(msg => ({
        id: msg.id,
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp,
        metadata: msg.metadata
      })),
      timestamp: session.lastActivityAt,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      messageCount: session.messages.length
    }));

    // Load legacy history from localStorage (existing chat messages)
    const history = JSON.parse(localStorage.getItem('clbhouz_ai_history') || '[]');
    const parsedHistory = history.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
    
    // Group legacy messages into conversations if any exist
    const legacyConversations = parsedHistory.length > 0 ? groupMessagesIntoConversations(parsedHistory) : [];
    
    // Combine both sources, with session conversations taking priority
    const allConversations = [...sessionConversations, ...legacyConversations];
    setConversations(allConversations);
    setHistoryMessages(parsedHistory);

    // Load saved insights
    const saved = JSON.parse(localStorage.getItem('clbhouz_ai_saved') || '[]');
    const parsedSaved = saved.map((insight: any) => ({
      ...insight,
      timestamp: new Date(insight.timestamp)
    }));
    setSavedInsights(parsedSaved);

    // Load swing analyses from localStorage AND database
    const localAnalyses = JSON.parse(localStorage.getItem('clbhouz_swing_analyses') || '[]');
    const swingCoachHistory = JSON.parse(localStorage.getItem('clbhouz_swingcoach_history') || '[]');
    
    console.log('🔍 Loading swing analyses data:', {
      localAnalyses: localAnalyses.length,
      swingCoachHistory: swingCoachHistory.length,
      swingCoachMessages: swingCoachHistory.filter((msg: any) => msg.type === 'ai').length
    });
    
    // First, get unique localStorage analyses (exclude SwingCoach history for now)
    const localAnalysesOnly = localAnalyses.map(item => ({
      ...item,
      tags: item.tags || [],
      conversation: item.conversation || []
    }));
    
    const uniqueLocalAnalyses = localAnalysesOnly.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    );

    // Load caddie logs from database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: logs, error } = await supabase
          .from('caddie_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && logs) {
          setCaddieLogs(logs);
        }
      }
    } catch (error) {
      console.error('Error loading caddie logs:', error);
    }

    // Convert Swing Coach conversations to analysis format with full conversation data
    const swingCoachAnalyses = swingCoachHistory
      .filter((msg: any) => {
        const isAI = msg.type === 'ai';
        const hasValidContent = msg.content && msg.content.trim().length > 0;
        const hasAnalysisContent = hasValidContent && (
          msg.content.includes('swing') ||
          msg.content.includes('analysis') ||
          msg.content.includes('position') ||
          msg.content.includes('backswing') ||
          msg.content.includes('downswing') ||
          msg.content.includes('impact') ||
          msg.content.includes('follow')
        );
        
        // Must have valid metadata OR valid swing analysis content
        const hasValidMetadata = msg.metadata && (
          msg.metadata.videoThumbnail || 
          msg.metadata.videoId || 
          msg.metadata.videoUrl ||
          msg.metadata.save_card
        );
        
        console.log('🎯 Filtering swing coach message:', {
          id: msg.id,
          isAI,
          hasValidContent,
          hasAnalysisContent,
          hasValidMetadata,
          included: isAI && hasValidContent && (hasAnalysisContent || hasValidMetadata)
        });
        
        return isAI && hasValidContent && (hasAnalysisContent || hasValidMetadata);
      })
      .map((msg: any, index: number) => {
        // Get the user message that triggered this analysis (should be the previous message)
        const userMessageIndex = swingCoachHistory.findIndex((m: any, i: number) => 
          i < index && m.type === 'user' && Math.abs(new Date(m.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 30000
        );
        const userMessage = userMessageIndex >= 0 ? swingCoachHistory[userMessageIndex] : null;
        
        const conversation = [];
        
        if (userMessage) {
          conversation.push({
            role: 'user' as const, 
            content: userMessage.content, 
            timestamp: userMessage.timestamp
          });
        }
        conversation.push({
          role: 'coach' as const, 
          content: msg.content, 
          timestamp: msg.timestamp
        });
        
        return {
          id: msg.id,
          save_card: msg.metadata?.save_card || 'Swing Analysis',
          title: msg.metadata?.save_card || 'Swing Analysis',
          tags: msg.metadata?.tags || [],
          category: msg.metadata?.category || 'Swing',
          content: msg.content,
          videoThumbnail: msg.metadata?.videoThumbnail,
          videoPoster: msg.metadata?.videoThumbnail,
          // Try to use the video data from user message, but it might be invalid blob URL
          videoSrc: userMessage?.videoPreview && userMessage.videoPreview.startsWith('blob:') 
            ? undefined // Don't use invalid blob URLs
            : userMessage?.videoPreview,
          conversation,
          timestamp: new Date(msg.timestamp)
        };
      });
    
    // Combine and deduplicate everything properly
    const allAnalyses = [...uniqueLocalAnalyses, ...swingCoachAnalyses];
    const finalUniqueAnalyses = allAnalyses.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    );
    
    const parsedAnalyses = finalUniqueAnalyses.map((analysis: any) => ({
      ...analysis,
      timestamp: new Date(analysis.timestamp)
    }));
    
    console.log('📊 Final swing analyses count:', {
      uniqueLocalAnalyses: uniqueLocalAnalyses.length,
      swingCoachAnalyses: swingCoachAnalyses.length,
      finalUnique: finalUniqueAnalyses.length,
      total: parsedAnalyses.length
    });
    
    setSwingAnalyses(parsedAnalyses);

    // Load caddie logs from Supabase
    try {
      const { data, error } = await supabase
        .from('caddie_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCaddieLogs(data || []);
    } catch (error) {
      console.error('Error fetching caddie logs:', error);
    }
  };

  const groupMessagesIntoConversations = (messages: HistoryMessage[]): ChatConversation[] => {
    const conversations: ChatConversation[] = [];
    let currentConversation: HistoryMessage[] = [];
    
    messages.forEach((message, index) => {
      if (message.type === 'user') {
        // Start new conversation on user message
        if (currentConversation.length > 0) {
          // Save previous conversation
          const firstUserMessage = currentConversation.find(m => m.type === 'user');
          if (firstUserMessage) {
            conversations.push({
              id: `conv-${conversations.length}`,
              title: firstUserMessage.content.substring(0, 60) + (firstUserMessage.content.length > 60 ? '...' : ''),
              messages: [...currentConversation],
              timestamp: firstUserMessage.timestamp,
              createdAt: firstUserMessage.timestamp, // Use first message time as created time
              lastActivityAt: currentConversation[currentConversation.length - 1]?.timestamp || firstUserMessage.timestamp,
              messageCount: currentConversation.length
            });
          }
        }
        currentConversation = [message];
      } else {
        currentConversation.push(message);
      }
      
      // Handle last conversation
      if (index === messages.length - 1 && currentConversation.length > 0) {
        const firstUserMessage = currentConversation.find(m => m.type === 'user');
        if (firstUserMessage) {
          conversations.push({
            id: `conv-${conversations.length}`,
            title: firstUserMessage.content.substring(0, 60) + (firstUserMessage.content.length > 60 ? '...' : ''),
            messages: [...currentConversation],
            timestamp: firstUserMessage.timestamp,
            createdAt: firstUserMessage.timestamp, // Use first message time as created time
            lastActivityAt: currentConversation[currentConversation.length - 1]?.timestamp || firstUserMessage.timestamp,
            messageCount: currentConversation.length
          });
        }
      }
    });
    
    return conversations.reverse(); // Most recent first
  };

  const clearHistory = () => {
    localStorage.removeItem('clbhouz_ai_history');
    setHistoryMessages([]);
    setConversations([]);
    toast({
      title: "History cleared",
      description: "All chat history has been deleted",
    });
  };

  const deleteConversation = (conversationId: string) => {
    // Check if this is a session conversation or legacy conversation
    if (conversationId.startsWith('session_')) {
      // Delete from session conversations
      conversationSession.deleteConversation(conversationId);
      // Reload conversations to refresh the UI
      setTimeout(() => loadData(), 100);
    } else {
      // Handle legacy conversations
      const conversationToDelete = conversations.find(conv => conv.id === conversationId);
      if (!conversationToDelete) return;
      
      // Remove messages from this conversation from the stored history
      const remainingMessages = historyMessages.filter(msg => 
        !conversationToDelete.messages.some(convMsg => convMsg.id === msg.id)
      );
      
      localStorage.setItem('clbhouz_ai_history', JSON.stringify(remainingMessages));
      setHistoryMessages(remainingMessages);
      
      // Update conversations
      const updatedConversations = conversations.filter(conv => conv.id !== conversationId);
      setConversations(updatedConversations);
    }
    
    toast({
      title: "Conversation deleted",
      description: "The conversation has been removed from your history",
    });
  };

  const renameConversation = (conversationId: string, newTitle: string) => {
    if (conversationId.startsWith('session_')) {
      // Rename session conversation
      conversationSession.renameConversation(conversationId, newTitle);
      // Reload conversations to refresh the UI
      setTimeout(() => loadData(), 100);
    } else {
      // Handle legacy conversations - not supported for now
      toast({
        title: "Renaming not supported",
        description: "Legacy conversations cannot be renamed",
        variant: "destructive"
      });
    }
  };

  const handleStartEdit = (conversationId: string, currentTitle: string) => {
    setEditingConversationId(conversationId);
    setEditTitle(currentTitle);
  };

  const handleSaveEdit = (conversationId: string) => {
    if (editTitle.trim()) {
      renameConversation(conversationId, editTitle.trim());
    }
    setEditingConversationId(null);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingConversationId(null);
    setEditTitle('');
  };

  const deleteSavedInsight = (id: string) => {
    const updated = savedInsights.filter(insight => insight.id !== id);
    setSavedInsights(updated);
    localStorage.setItem('clbhouz_ai_saved', JSON.stringify(updated));
    toast({
      title: "Insight deleted",
      description: "The saved insight has been removed",
    });
  };

  const clearAllSaved = () => {
    localStorage.removeItem('clbhouz_ai_saved');
    setSavedInsights([]);
    toast({
      title: "Saved insights cleared",
      description: "All saved insights have been deleted",
    });
  };

  const deleteSwingAnalysis = (id: string) => {
    console.log('🗑️ Deleting swing analysis:', id);
    
    // Remove from current state
    const updated = swingAnalyses.filter(analysis => analysis.id !== id);
    setSwingAnalyses(updated);
    
    // Clean up localStorage completely
    const localAnalyses = JSON.parse(localStorage.getItem('clbhouz_swing_analyses') || '[]');
    const cleanedLocalAnalyses = localAnalyses.filter((a: any) => a.id !== id);
    localStorage.setItem('clbhouz_swing_analyses', JSON.stringify(cleanedLocalAnalyses));
    
    // Clean up Swing Coach history - remove both user and AI messages
    const swingCoachHistory = JSON.parse(localStorage.getItem('clbhouz_swingcoach_history') || '[]');
    const cleanedHistory = swingCoachHistory.filter((msg: any) => {
      // Remove the specific AI message and any related user messages
      const isTargetMessage = msg.id === id || msg.id === id.replace('_ai', '') || (msg.id + '_ai') === id;
      const isCorruptedMessage = !msg.content || msg.content.trim() === '' || 
        (msg.type === 'ai' && msg.content.includes("I can't analyze images"));
      
      return !isTargetMessage && !isCorruptedMessage;
    });
    localStorage.setItem('clbhouz_swingcoach_history', JSON.stringify(cleanedHistory));
    
    // Force re-render
    setSwingAnalyses([...updated]);
    
    toast({
      title: "Analysis deleted",
      description: "The swing analysis has been permanently removed",
    });
  };

  const clearAllAnalyses = () => {
    localStorage.removeItem('clbhouz_swing_analyses');
    setSwingAnalyses([]);
    toast({
      title: "Swing analyses cleared",
      description: "All swing analyses have been deleted",
    });
  };

  // Get unique categories and tags
  const categories = ['all', ...new Set(savedInsights.map(insight => insight.category))];
  const allTags = new Set(savedInsights.flatMap(insight => insight.tags));
  const tags = ['all', ...Array.from(allTags)];

  // Filter functions
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredCaddieLogs = caddieLogs.filter(log => {
    const matchesSearch = log.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.course_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.location_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const filteredSwingCoach = swingAnalyses.filter(analysis => 
    analysis.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    analysis.save_card.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const deleteCaddieLog = async (id: string) => {
    try {
      const { error } = await supabase
        .from('caddie_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setCaddieLogs(prev => prev.filter(log => log.id !== id));
      
      toast({
        title: "Caddie log deleted",
        description: "The log has been removed from your history",
      });
    } catch (error) {
      console.error('Error deleting caddie log:', error);
      toast({
        title: "Error",
        description: "Failed to delete the caddie log",
        variant: "destructive"
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
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
              className="h-8 w-8 p-0 hover:bg-white/20 transition-colors duration-100"
              aria-label="Close Echo History modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-3 pb-0 flex-shrink-0">
            <TabsList 
              className="grid w-full grid-cols-3 bg-white/30 backdrop-blur-sm border border-white/20"
              role="tablist"
              aria-label="Echo History sections"
            >
              <TabsTrigger 
                value="chat" 
                className="transition-all duration-160 data-[state=active]:bg-white/60 data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                role="tab"
                aria-selected={activeTab === 'chat'}
                aria-controls="chat-panel"
                id="chat-tab"
              >
                Chat
              </TabsTrigger>
              <TabsTrigger 
                value="logs"
                className="transition-all duration-160 data-[state=active]:bg-white/60 data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                role="tab"
                aria-selected={activeTab === 'logs'}
                aria-controls="logs-panel"
                id="logs-tab"
              >
                Caddie Logs
              </TabsTrigger>
              <TabsTrigger 
                value="swing-coach"
                className="transition-all duration-160 data-[state=active]:bg-white/60 data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                role="tab"
                aria-selected={activeTab === 'swing-coach'}
                aria-controls="swing-coach-panel"
                id="swing-coach-tab"
              >
                Swing Coach
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Single scrollable content area */}
          <div className="flex-1 min-h-0">
            <TabsContent value="chat" className="h-full m-0" role="tabpanel" id="chat-panel" aria-labelledby="chat-tab">
              <ScrollArea 
                ref={chatAutoScroll.scrollAreaRef}
                className="h-full"
                style={{ overscrollBehavior: 'contain' }}
              >
                <div className="px-6 py-5">
                  {filteredConversations.length > 0 ? (
                    <div className="space-y-3">
                      {filteredConversations.map((conversation, index) => (
                         <div
                           key={`conversation-${conversation.id || index}`}
                           className="p-4 rounded-xl bg-white/90 border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-100"
                         >
                           <div className="flex items-center justify-between mb-2">
                             {editingConversationId === conversation.id ? (
                               <div className="flex items-center gap-2 flex-1">
                                 <Input
                                   value={editTitle}
                                   onChange={(e) => setEditTitle(e.target.value)}
                                   className="flex-1"
                                   onKeyDown={(e) => {
                                     if (e.key === 'Enter') {
                                       handleSaveEdit(conversation.id);
                                     } else if (e.key === 'Escape') {
                                       handleCancelEdit();
                                     }
                                   }}
                                   autoFocus
                                 />
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => handleSaveEdit(conversation.id)}
                                   className="h-7 px-2"
                                 >
                                   Save
                                 </Button>
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={handleCancelEdit}
                                   className="h-7 px-2"
                                 >
                                   Cancel
                                 </Button>
                               </div>
                             ) : (
                               <>
                                  <div className="flex items-center gap-2 flex-1">
                                    <h3 className="font-medium truncate text-gray-900" style={{ maxWidth: '75%' }}>
                                      {conversation.customTitle || conversation.title}
                                    </h3>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">
                                      {conversation.timestamp.toLocaleDateString()}
                                    </span>
                                    {conversation.id.startsWith('session_') && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleStartEdit(conversation.id, conversation.customTitle || conversation.title)}
                                        className="h-7 px-2 text-gray-600 hover:text-gray-900"
                                        title="Rename conversation"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                               </>
                             )}
                           </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setExpandedConversation(
                                    expandedConversation === conversation.id ? null : conversation.id
                                  )}
                                  className="bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1.5 text-sm border-none"
                                >
                                  {expandedConversation === conversation.id ? 'Hide' : 'Show'} Conversation
                                </Button>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                               {conversation.messageCount && (
                                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 border-gray-200">
                                    {conversation.messageCount} messages
                                  </Badge>
                               )}
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => deleteConversation(conversation.id)}
                                 className="h-7 px-2 text-destructive hover:text-destructive hover:bg-red-50 transition-colors duration-100"
                                 aria-label={`Delete conversation: ${conversation.title}`}
                               >
                                 <Trash2 className="h-3 w-3" />
                               </Button>
                             </div>
                           </div>
                          
                          {expandedConversation === conversation.id && (
                            <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
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
                                    <Badge variant={message.type === 'user' ? 'secondary' : 'secondary'} className={message.type === 'user' ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-gray-100 text-gray-600 border-gray-200'}>
                                      {message.type === 'user' ? 'You' : 'Echo'}
                                    </Badge>
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

            <TabsContent value="logs" className="h-full m-0" role="tabpanel" id="logs-panel" aria-labelledby="logs-tab">
              <ScrollArea 
                ref={logsAutoScroll.scrollAreaRef}
                className="h-full"
                style={{ overscrollBehavior: 'contain' }}
              >
                <div className="px-6 py-5">
                  {filteredCaddieLogs.length > 0 ? (
                    <div className="space-y-3">
                      {filteredCaddieLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-4 rounded-xl bg-white/90 border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-100"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="text-sm leading-relaxed text-gray-900 mb-2">{log.content}</p>
                              {log.transcription && log.transcription !== log.content && (
                                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg mt-2">
                                  <strong>Transcription:</strong> {log.transcription}
                                </div>
                              )}
                              {log.location_name && (
                                <div className="flex items-center gap-1 mt-2">
                                  <span className="text-xs text-gray-600">{log.location_name}</span>
                                </div>
                              )}
                              {log.course_name && (
                                <div className="text-xs text-gray-600 mt-1">
                                  Course: {log.course_name}
                                </div>
                              )}
                              {log.tags && log.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {log.tags.map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs bg-gray-100 border-gray-200 text-gray-700">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <span className="text-xs text-gray-600">
                                {new Date(log.created_at).toLocaleDateString()}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteCaddieLog(log.id)}
                                className="h-7 px-2 text-destructive hover:text-destructive hover:bg-red-50 transition-colors duration-100"
                                aria-label={`Delete caddie log from ${new Date(log.created_at).toLocaleDateString()}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
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

            <TabsContent value="swing-coach" className="h-full m-0" role="tabpanel" id="swing-coach-panel" aria-labelledby="swing-coach-tab">
              <ScrollArea 
                ref={swingAutoScroll.scrollAreaRef}
                className="h-full"
                style={{ overscrollBehavior: 'contain' }}
              >
                <div className="px-6 py-5">
                  {swingAnalyses.length > 0 ? (
                    <div className="space-y-3">
                      {swingAnalyses.map((analysis) => (
                        <div key={analysis.id} className="hover:scale-[1.01] transition-transform duration-100">
                          <SwingAnalysisCard
                            analysis={{
                              ...analysis,
                              tags: analysis.tags || [], // Ensure tags is always an array
                              conversation: analysis.conversation || [] // Ensure conversation is always an array
                            }}
                            onDelete={() => deleteSwingAnalysis(analysis.id)}
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