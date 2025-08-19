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

interface HistoryMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface AIChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMessage: (message: string) => void;
  activeTab?: string;
}

const AIChatHistory: React.FC<AIChatHistoryProps> = ({ isOpen, onClose, onSelectMessage, activeTab = 'chat' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [historyMessages, setHistoryMessages] = useState<HistoryMessage[]>([]);
  const [savedInsights, setSavedInsights] = useState<SavedInsight[]>([]);
  const [swingAnalyses, setSwingAnalyses] = useState<SwingAnalysis[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [caddieLogsList, setCaddieLogsList] = useState<any[]>([]);
  const [proAnalyses, setProAnalyses] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load based on active tab - tab-scoped reads only
      if (activeTab === 'chat') {
        // Load conversations from database
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .order('created_at', { ascending: false });

        if (convError) throw convError;
        setConversations(convData || []);
      } else if (activeTab === 'logs') {
        // Load caddie logs from database
        const { data: logsData, error: logsError } = await supabase
          .from('caddie_logs')
          .select('*')
          .order('created_at', { ascending: false });

        if (logsError) throw logsError;
        setCaddieLogsList(logsData || []);
      } else if (activeTab === 'pro') {
        // Load pro AI analyses from database
        const { data: proData, error: proError } = await supabase
          .from('pro_ai_analyses')
          .select('*')
          .order('created_at', { ascending: false });

        if (proError) throw proError;
        setProAnalyses(proData || []);
      }

      // Legacy localStorage fallback (will be phased out)
      const history = JSON.parse(localStorage.getItem('clbhouz_ai_history') || '[]');
      const parsedHistory = history.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      setHistoryMessages(parsedHistory);

      const saved = JSON.parse(localStorage.getItem('clbhouz_ai_saved') || '[]');
      const parsedSaved = saved.map((insight: any) => ({
        ...insight,
        timestamp: new Date(insight.timestamp)
      }));
      setSavedInsights(parsedSaved);

      const analyses = JSON.parse(localStorage.getItem('clbhouz_swing_analyses') || '[]');
      const parsedAnalyses = analyses.map((analysis: any) => ({
        ...analysis,
        timestamp: new Date(analysis.timestamp)
      }));
      setSwingAnalyses(parsedAnalyses);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem('clbhouz_ai_history');
    setHistoryMessages([]);
    toast({
      title: "History cleared",
      description: "All chat history has been deleted",
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
  const filteredHistory = historyMessages.filter(msg =>
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSaved = savedInsights.filter(insight => {
    const matchesSearch = insight.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         insight.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || insight.category === selectedCategory;
    const matchesTag = selectedTag === 'all' || insight.tags.includes(selectedTag);
    return matchesSearch && matchesCategory && matchesTag;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-background rounded-t-2xl sm:rounded-2xl w-full max-w-2xl h-[80vh] sm:h-[70vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Chat History & Saved</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search and filters */}
        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your history..."
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                {tags.map(tag => (
                  <SelectItem key={tag} value={tag}>
                    {tag === 'all' ? 'All Tags' : tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={activeTab === 'chat' ? 'history' : activeTab === 'logs' ? 'logs' : 'analyses'} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-2">
            <TabsTrigger value="history">Chats ({conversations.length})</TabsTrigger>
            <TabsTrigger value="logs">Caddie Logs ({caddieLogsList.length})</TabsTrigger>
            <TabsTrigger value="analyses">Pro AI ({proAnalyses.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="flex-1 p-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                Ask anything about your golf
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Chats
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your chat conversations. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={clearHistory}>Clear Chats</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {conversations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchQuery ? 'No conversations found matching your search' : 'No chat conversations yet'}
                  </p>
                ) : (
                  conversations
                    .filter(conv =>
                      conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      JSON.stringify(conv.messages).toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((conversation) => (
                      <div
                        key={conversation.id}
                        className="p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                        onClick={() => onSelectMessage(conversation.title || conversation.messages[0]?.content || '')}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="default">Chat</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(conversation.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium line-clamp-2">{conversation.title || 'Untitled conversation'}</p>
                      </div>
                    ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="logs" className="flex-1 p-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                Your personal yardage book
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Logs
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear caddie logs?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your caddie logs. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={clearCaddieLogs}>Clear Logs</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {caddieLogsList.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchQuery ? 'No logs found matching your search' : 'No caddie logs yet'}
                  </p>
                ) : (
                  caddieLogsList
                    .filter(log =>
                      log.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      log.course_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      log.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-lg border hover:bg-muted/50"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline">Caddie Log</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm line-clamp-2">{log.content}</p>
                        {log.tags && log.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {log.tags.map((tag: string, index: number) => (
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

          <TabsContent value="analyses" className="flex-1 p-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                Swing analysis
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Analyses
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear swing analyses?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your swing analyses. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={clearProAnalyses}>Clear Analyses</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {proAnalyses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchQuery ? 'No analyses found matching your search' : 'No swing analyses yet. Upload a swing in Pro AI to get started.'}
                  </p>
                ) : (
                  proAnalyses
                    .filter(analysis =>
                      analysis.swing_context?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      JSON.stringify(analysis.analysis_results).toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((analysis) => (
                      <div
                        key={analysis.id}
                        className="p-3 rounded-lg border hover:bg-muted/50"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline">Pro AI</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(analysis.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium mb-2">
                          {analysis.swing_context || 'Swing Analysis'}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {analysis.analysis_results?.aiResponse || 'Analysis complete'}
                        </p>
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

  const clearCaddieLogs = async () => {
    try {
      const { error } = await supabase
        .from('caddie_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      setCaddieLogsList([]);
      toast({
        title: "Logs cleared",
        description: "All caddie logs have been deleted",
      });
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  const clearProAnalyses = async () => {
    try {
      const { error } = await supabase
        .from('pro_ai_analyses')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      setProAnalyses([]);
      toast({
        title: "Analyses cleared",
        description: "All swing analyses have been deleted",
      });
    } catch (error) {
      console.error('Error clearing analyses:', error);
    }
  };
};
};

export default AIChatHistory;