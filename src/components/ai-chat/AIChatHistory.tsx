import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, MessageSquare, Mic, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HistoryItem {
  id: string;
  type: 'chat' | 'caddie' | 'swing_coach';
  title: string;
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface AIChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatHistory: React.FC<AIChatHistoryProps> = ({ isOpen, onClose }) => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'chat' | 'caddie' | 'swing_coach'>('all');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadAllHistory();
    }
  }, [isOpen]);

  const loadAllHistory = async () => {
    setLoading(true);
    console.log('🔍 Loading all history from Supabase...');
    
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) {
        console.log('❌ No authenticated user found');
        setLoading(false);
        return;
      }

      console.log('👤 Loading data for user:', user.data.user.id);

      const allItems: HistoryItem[] = [];

      // Load conversations from Supabase
      console.log('💬 Loading conversations from Supabase...');
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.data.user.id)
        .order('updated_at', { ascending: false });

      if (conversationsError) {
        console.error('❌ Error loading conversations:', conversationsError);
      } else {
        console.log('✅ Loaded conversations:', conversations?.length || 0);
        conversations?.forEach(conv => {
          const messages = (conv.messages as any[]) || [];
          if (messages.length > 0) {
            allItems.push({
              id: conv.id,
              type: 'chat',
              title: conv.title || 'Chat Session',
              content: `${messages.length} messages`,
              timestamp: new Date(conv.updated_at),
              metadata: { messageCount: messages.length, messages }
            });
          }
        });
      }

      // Load caddie logs from Supabase
      console.log('🎙️ Loading caddie logs from Supabase...');
      const { data: caddieLogs, error: caddieError } = await supabase
        .from('caddie_logs')
        .select('*')
        .eq('user_id', user.data.user.id)
        .order('created_at', { ascending: false });

      if (caddieError) {
        console.error('❌ Error loading caddie logs:', caddieError);
      } else {
        console.log('✅ Loaded caddie logs:', caddieLogs?.length || 0);
        caddieLogs?.forEach(log => {
          allItems.push({
            id: log.id,
            type: 'caddie',
            title: log.course_name || 'Caddie Note',
            content: log.content || log.transcription || 'Voice note',
            timestamp: new Date(log.created_at),
            metadata: log
          });
        });
      }

      // Load pro AI analyses from Supabase
      console.log('📊 Loading pro AI analyses from Supabase...');
      const { data: swingCoachData, error: swingError } = await supabase
        .from('pro_ai_analyses')
        .select('*')
        .eq('user_id', user.data.user.id)
        .order('created_at', { ascending: false });

      if (swingError) {
        console.error('❌ Error loading swing coach data:', swingError);
      } else {
        console.log('✅ Loaded swing coach analyses:', swingCoachData?.length || 0);
        swingCoachData?.forEach(analysis => {
          allItems.push({
            id: analysis.id,
            type: 'swing_coach',
            title: analysis.swing_context || 'Swing Analysis',
            content: analysis.analysis_results ? 'Analysis completed' : 'Swing data',
            timestamp: new Date(analysis.created_at),
            metadata: analysis
          });
        });
      }

      // Sort all items by timestamp (most recent first)
      allItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setHistoryItems(allItems);
      console.log('✅ Total history items loaded:', allItems.length);
      
    } catch (error) {
      console.error('❌ Unexpected error loading history:', error);
      toast({
        title: "Error",
        description: "Failed to load history",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const deleteItem = async (item: HistoryItem) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) return;

      let error = null;

      switch (item.type) {
        case 'chat':
          const { error: chatError } = await supabase
            .from('conversations')
            .delete()
            .eq('id', item.id)
            .eq('user_id', user.data.user.id);
          error = chatError;
          break;
        case 'caddie':
          const { error: caddieError } = await supabase
            .from('caddie_logs')
            .delete()
            .eq('id', item.id)
            .eq('user_id', user.data.user.id);
          error = caddieError;
          break;
        case 'swing_coach':
          const { error: swingError } = await supabase
            .from('pro_ai_analyses')
            .delete()
            .eq('id', item.id)
            .eq('user_id', user.data.user.id);
          error = swingError;
          break;
      }

      if (error) {
        console.error('❌ Error deleting item:', error);
        toast({
          title: "Error",
          description: "Failed to delete item",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setHistoryItems(prev => prev.filter(historyItem => historyItem.id !== item.id));
      
      toast({
        title: "Item deleted",
        description: "The item has been removed from your history",
      });
      
    } catch (error) {
      console.error('❌ Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const filteredItems = historyItems.filter(item => {
    if (activeTab === 'all') return true;
    return item.type === activeTab;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <MessageSquare className="h-4 w-4" />;
      case 'caddie':
        return <Mic className="h-4 w-4" />;
      case 'swing_coach':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'chat':
        return 'Chat';
      case 'caddie':
        return 'Caddie';
      case 'swing_coach':
        return 'Swing Coach';
      default:
        return 'Unknown';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Echo History</DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'chat', label: 'Chat' },
            { key: 'caddie', label: 'Caddie' },
            { key: 'swing_coach', label: 'Swing Coach' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 max-h-[60vh]">
          {loading ? (
            <div className="space-y-4 p-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-full mb-1"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-muted-foreground mb-4">
                {getIcon(activeTab === 'all' ? 'chat' : activeTab)}
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">
                No {activeTab === 'all' ? '' : getTypeLabel(activeTab)} history found
              </h3>
              <p className="text-xs text-muted-foreground">
                Start a conversation to see your history here
              </p>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-muted-foreground mt-1">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">{item.title}</h4>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          {getTypeLabel(item.type)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {item.content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(item.timestamp, 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteItem(item)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};