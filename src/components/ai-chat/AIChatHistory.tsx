import React, { useState, useEffect } from 'react';
import { X, Search, Filter, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
  timestamp: Date;
  voiceNote?: string;
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
    
    // Convert Swing Coach conversations to analysis format
    const swingCoachAnalyses = swingCoachHistory
      .filter((msg: any) => msg.type === 'ai' && msg.metadata)
      .map((msg: any) => ({
        id: msg.id,
        save_card: msg.metadata.save_card || 'Swing Analysis',
        tags: msg.metadata.tags || [],
        category: msg.metadata.category || 'Swing',
        content: msg.content,
        videoThumbnail: msg.metadata.videoThumbnail,
        timestamp: new Date(msg.timestamp)
      }));
    
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
                    <div
                      key={analysis.id}
                      className="p-3 rounded-lg border hover:bg-muted/50"
                    >
                      <div className="flex items-start gap-3">
                        {analysis.videoThumbnail && (
                          <img 
                            src={analysis.videoThumbnail} 
                            alt="Swing thumbnail"
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{analysis.category}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(analysis.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteSwingAnalysis(analysis.id)}
                                className="h-7 px-2 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-sm font-medium mb-2">{analysis.save_card}</p>
                          
                          {analysis.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {analysis.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {analysis.voiceNote && (
                            <Badge variant="outline" className="mb-2 text-xs">
                              Voice note attached
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
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