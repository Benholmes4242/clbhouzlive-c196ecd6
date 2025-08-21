import React, { useState, useEffect } from 'react';
import { X, Search, Filter, Trash2, RotateCcw, Play, Maximize2, Calendar, FileText } from 'lucide-react';
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
  messages: HistoryMessage[];
  timestamp: Date;
}

interface AIChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMessage: (message: string) => void;
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
          
          {tags.length > 0 && (
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
            {analysis.tags.length > 0 && (
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
      <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
        <div className="flex items-start gap-3">
          {/* Left Column - Video Thumbnail */}
          <div className="flex-shrink-0">
            <div className="relative w-28 sm:w-36 aspect-video bg-muted rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
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
            
            {analysis.tags.length > 0 && (
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

const AIChatHistory: React.FC<AIChatHistoryProps> = ({ isOpen, onClose, onSelectMessage }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [historyMessages, setHistoryMessages] = useState<HistoryMessage[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null);
  const [savedInsights, setSavedInsights] = useState<SavedInsight[]>([]);
  const [swingAnalyses, setSwingAnalyses] = useState<SwingAnalysis[]>([]);
  const [caddieLogs, setCaddieLogs] = useState<CaddieLog[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    // Load history
    const history = JSON.parse(localStorage.getItem('clbhouz_ai_history') || '[]');
    const parsedHistory = history.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
    setHistoryMessages(parsedHistory);
    
    // Group messages into conversations
    const groupedConversations = groupMessagesIntoConversations(parsedHistory);
    setConversations(groupedConversations);

    // Load saved insights
    const saved = JSON.parse(localStorage.getItem('clbhouz_ai_saved') || '[]');
    const parsedSaved = saved.map((insight: any) => ({
      ...insight,
      timestamp: new Date(insight.timestamp)
    }));
    setSavedInsights(parsedSaved);

    // Load swing analyses from both analyses and Swing Coach history
    const analyses = JSON.parse(localStorage.getItem('clbhouz_swing_analyses') || '[]');
    const swingCoachHistory = JSON.parse(localStorage.getItem('clbhouz_swingcoach_history') || '[]');
    
    // Convert Swing Coach conversations to analysis format with full conversation data
    const swingCoachAnalyses = swingCoachHistory
      .filter((msg: any) => msg.type === 'ai' && msg.metadata)
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
          save_card: msg.metadata.save_card || 'Swing Analysis',
          title: msg.metadata.save_card || 'Swing Analysis',
          tags: msg.metadata.tags || [],
          category: msg.metadata.category || 'Swing',
          content: msg.content,
          videoThumbnail: msg.metadata.videoThumbnail,
          videoPoster: msg.metadata.videoThumbnail,
          // Try to use the video data from user message, but it might be invalid blob URL
          videoSrc: userMessage?.videoPreview && userMessage.videoPreview.startsWith('blob:') 
            ? undefined // Don't use invalid blob URLs
            : userMessage?.videoPreview,
          conversation,
          timestamp: new Date(msg.timestamp)
        };
      });
    
    const allAnalyses = [...analyses, ...swingCoachAnalyses];
    const parsedAnalyses = allAnalyses.map((analysis: any) => ({
      ...analysis,
      timestamp: new Date(analysis.timestamp)
    }));
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
              timestamp: firstUserMessage.timestamp
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
            timestamp: firstUserMessage.timestamp
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
    
    toast({
      title: "Conversation deleted",
      description: "The conversation has been removed from your history",
    });
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
    const updated = swingAnalyses.filter(analysis => analysis.id !== id);
    setSwingAnalyses(updated);
    localStorage.setItem('clbhouz_swing_analyses', JSON.stringify(updated));
    toast({
      title: "Analysis deleted",
      description: "The swing analysis has been removed",
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-background rounded-t-2xl sm:rounded-2xl w-full max-w-2xl h-[80vh] sm:h-[70vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Echo History</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search header */}
        <div className="px-6 py-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your history..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
          <div className="px-6">
            <TabsList className="w-full px-4 justify-between box-border">
              <TabsTrigger value="chat" className="flex-1">Chat</TabsTrigger>
              <TabsTrigger value="caddie-logs" className="flex-1">Caddie Logs</TabsTrigger>
              <TabsTrigger value="swing-coach" className="flex-1">Swing Coach ({swingAnalyses.length})</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chat" className="flex-1 p-4">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Your chat conversations with Echo
              </p>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {filteredConversations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchQuery ? 'No conversations found matching your search' : 'No chat history yet'}
                  </p>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div key={conversation.id} className="border rounded-lg">
                      <div
                        className="p-3 cursor-pointer hover:bg-muted/50 flex justify-between items-start"
                        onClick={() => setExpandedConversation(
                          expandedConversation === conversation.id ? null : conversation.id
                        )}
                      >
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="secondary">Conversation</Badge>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {conversation.timestamp.toLocaleDateString()} {conversation.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteConversation(conversation.id);
                                }}
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm font-medium">{conversation.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {conversation.messages.length} messages
                          </p>
                        </div>
                      </div>
                      
                      {expandedConversation === conversation.id && (
                        <div className="border-t p-3 bg-muted/20">
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {conversation.messages.map((message, index) => (
                              <div
                                key={`${message.id}-${index}`}
                                className={`p-2 rounded text-sm ${
                                  message.type === 'user' 
                                    ? 'bg-primary/10 text-foreground' 
                                    : 'bg-muted text-foreground'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {message.type === 'user' ? 'You' : 'Echo'}
                                  </Badge>
                                  {message.type === 'user' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onSelectMessage(message.content)}
                                      className="h-5 px-2 text-xs"
                                    >
                                      Use
                                    </Button>
                                  )}
                                </div>
                                <p className="text-xs leading-relaxed">{message.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="caddie-logs" className="flex-1 p-4">
            <div className="mb-4">
              <div className="mb-3">
                <Input
                  placeholder="Search your caddie logs..."
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Your saved caddie logs and notes
              </p>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {filteredCaddieLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchQuery ? 'No caddie logs found matching your search' : 'No caddie logs yet. Start recording voice notes to see them here.'}
                  </p>
                ) : (
                  filteredCaddieLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg border hover:bg-muted/50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Caddie Log</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectMessage(log.content)}
                            className="h-7 px-2"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm font-medium mb-2">{log.content}</p>
                      
                      {log.course_name && (
                        <p className="text-xs text-muted-foreground mb-1">
                          📍 {log.course_name}
                        </p>
                      )}
                      
                      {log.location_name && !log.course_name && (
                        <p className="text-xs text-muted-foreground mb-1">
                          📍 {log.location_name}
                        </p>
                      )}
                      
                      {log.tags && log.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {log.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="swing-coach" className="flex-1 p-4">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Your Swing Coach swing analyses
              </p>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {filteredSwingCoach.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchQuery ? 'No analyses found matching your search' : 'No swing analyses yet. Upload a swing in Swing Coach to get started.'}
                  </p>
                ) : (
                  filteredSwingCoach.map((analysis) => (
                    <SwingAnalysisCard 
                      key={analysis.id} 
                      analysis={analysis} 
                      onDelete={() => deleteSwingAnalysis(analysis.id)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="p-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Your history is only visible to you. You can delete items or clear all anytime.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChatHistory;