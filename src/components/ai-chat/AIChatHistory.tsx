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
}

const AIChatHistory: React.FC<AIChatHistoryProps> = ({ isOpen, onClose, onSelectMessage }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [historyMessages, setHistoryMessages] = useState<HistoryMessage[]>([]);
  const [savedInsights, setSavedInsights] = useState<SavedInsight[]>([]);
  const [swingAnalyses, setSwingAnalyses] = useState<SwingAnalysis[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    // Load history
    const history = JSON.parse(localStorage.getItem('clbhouz_ai_history') || '[]');
    const parsedHistory = history.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
    setHistoryMessages(parsedHistory);

    // Load saved insights
    const saved = JSON.parse(localStorage.getItem('clbhouz_ai_saved') || '[]');
    const parsedSaved = saved.map((insight: any) => ({
      ...insight,
      timestamp: new Date(insight.timestamp)
    }));
    setSavedInsights(parsedSaved);

    // Load swing analyses
    const analyses = JSON.parse(localStorage.getItem('clbhouz_swing_analyses') || '[]');
    const parsedAnalyses = analyses.map((analysis: any) => ({
      ...analysis,
      timestamp: new Date(analysis.timestamp)
    }));
    setSwingAnalyses(parsedAnalyses);
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

  const filteredCaddieLogs = savedInsights.filter(insight => {
    // For caddie logs tab, only show items that are actual caddie logs
    const isCaddieLog = insight.category === 'caddie' || insight.tags.includes('caddie');
    const matchesSearch = insight.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         insight.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return isCaddieLog && matchesSearch;
  });

  const filteredProAI = swingAnalyses.filter(analysis => 
    analysis.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    analysis.save_card.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <TabsTrigger value="proai" className="flex-1">Pro AI ({swingAnalyses.length})</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chat" className="flex-1 p-4">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Your chat conversations with AI
              </p>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {filteredHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchQuery ? 'No history found matching your search' : 'No chat history yet'}
                  </p>
                ) : (
                  filteredHistory.map((message, index) => (
                    <div
                      key={`${message.id}-${index}`}
                      className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 ${
                        message.type === 'user' ? 'bg-primary/5' : 'bg-muted/20'
                      }`}
                      onClick={() => {
                        if (message.type === 'user') {
                          onSelectMessage(message.content);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant={message.type === 'user' ? 'default' : 'secondary'}>
                          {message.type === 'user' ? 'You' : 'AI'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleDateString()} {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-3">{message.content}</p>
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
                  filteredCaddieLogs.map((insight) => (
                    <div
                      key={insight.id}
                      className="p-3 rounded-lg border hover:bg-muted/50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{insight.category}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {insight.timestamp.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectMessage(insight.summary)}
                            className="h-7 px-2"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSavedInsight(insight.id)}
                            className="h-7 px-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm font-medium mb-2">{insight.summary}</p>
                      
                      {insight.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {insight.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {insight.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="proai" className="flex-1 p-4">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Your Pro AI swing analyses
              </p>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {filteredProAI.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchQuery ? 'No analyses found matching your search' : 'No swing analyses yet. Upload a swing in Pro AI to get started.'}
                  </p>
                ) : (
                  filteredProAI.map((analysis) => (
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
                                {analysis.timestamp.toLocaleDateString()}
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