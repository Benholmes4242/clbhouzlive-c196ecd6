import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Search, Edit, Trash2, MapPin, Calendar, Mic, MicOff, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { channelManager } from '@/utils/supabaseChannelManager';

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

interface CaddieLogsProps {
  onClose: () => void;
  isRecording: boolean;
  isProcessing: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  userLocation: string;
  requestLocation: () => void;
}

const CaddieLogs: React.FC<CaddieLogsProps> = ({ 
  onClose, 
  isRecording, 
  isProcessing, 
  startRecording, 
  stopRecording, 
  userLocation, 
  requestLocation 
}) => {
  const [logs, setLogs] = useState<CaddieLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingLog, setEditingLog] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  

  // Auto-scroll is now managed by parent AIChatOverlay
  // Remove local auto-scroll since parent provides the ScrollArea and ref

  useEffect(() => {
    fetchLogs();
  }, []);

  // Set up real-time subscription for caddie logs
  useEffect(() => {
    const setupSubscription = async () => {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) return;

      console.log('Setting up caddie logs subscription for user:', currentUser.id);
      const channelName = `caddie_logs_${currentUser.id}`;
      
      const channel = channelManager.createChannel(channelName);
      
      channel
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'caddie_logs',
          filter: `user_id=eq.${currentUser.id}`
        }, (payload) => {
          console.log('New caddie log received:', payload);
          const newLog = payload.new as CaddieLog;
          setLogs(currentLogs => {
            // Check if log already exists to prevent duplicates
            if (currentLogs.some(log => log.id === newLog.id)) {
              return currentLogs;
            }
            return [newLog, ...currentLogs];
          });
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'caddie_logs',
          filter: `user_id=eq.${currentUser.id}`
        }, (payload) => {
          console.log('Caddie log updated:', payload);
          const updatedLog = payload.new as CaddieLog;
          setLogs(currentLogs => 
            currentLogs.map(log => log.id === updatedLog.id ? updatedLog : log)
          );
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'caddie_logs',
          filter: `user_id=eq.${currentUser.id}`
        }, (payload) => {
          console.log('Caddie log deleted:', payload);
          const deletedLog = payload.old as CaddieLog;
          setLogs(currentLogs => 
            currentLogs.filter(log => log.id !== deletedLog.id)
          );
        })
        .subscribe((status) => {
          console.log('Caddie logs subscription status:', status);
        });
    };

    setupSubscription();

    return () => {
      console.log('Cleaning up caddie logs subscription');
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          channelManager.removeChannel(`caddie_logs_${user.id}`);
        }
      });
    };
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('caddie_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching caddie logs:', error);
      toast.error("Couldn't load logs");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLog = async (logId: string) => {
    try {
      const { error } = await supabase
        .from('caddie_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;

      setLogs(logs.filter(log => log.id !== logId));
      toast.success("Log deleted");
    } catch (error) {
      console.error('Error deleting log:', error);
      toast.error("Couldn't delete log");
    }
  };

  const saveEdit = async (logId: string) => {
    try {
      const { error } = await supabase
        .from('caddie_logs')
        .update({ content: editContent })
        .eq('id', logId);

      if (error) throw error;

      setLogs(logs.map(log => 
        log.id === logId ? { ...log, content: editContent } : log
      ));
      
      setEditingLog(null);
      setEditContent('');
      
      toast.success("Log updated");
    } catch (error) {
      console.error('Error updating log:', error);
      toast.error("Couldn't update log");
    }
  };

  const startEdit = (log: CaddieLog) => {
    setEditingLog(log.id);
    setEditContent(log.content);
  };

  const cancelEdit = () => {
    setEditingLog(null);
    setEditContent('');
  };

  const filteredLogs = logs.filter(log => 
    log.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.course_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.location_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const autoTagGolfTerms = (content: string): string[] => {
    const golfTerms = [
      'tree', 'bunker', 'green', 'slope', 'yardage', 'carry', 'pin', 'flag',
      'fairway', 'rough', 'water', 'hazard', 'dogleg', 'elevation', 'wind',
      'left', 'right', 'center', 'front', 'back', 'avoid', 'target'
    ];
    
    const foundTerms = golfTerms.filter(term => 
      content.toLowerCase().includes(term)
    );
    
    return [...new Set(foundTerms)]; // Remove duplicates
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-gray-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0">
        <div className="px-6 py-5 space-y-4">
        <p className="text-center text-muted-foreground">
          Your personal yardage book starts here.<br />
          Tap the mic, record notes as you walk the course, and I'll store them for you.
        </p>

        {logs.length === 0 ? (
          <div className="text-center text-muted-foreground pt-4">
            <p className="mb-6">
              No caddie logs yet.<br />
              Start recording your course notes below.
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-8">
            <p className="text-center text-muted-foreground">No logs match your search.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <div key={log.id} className="bg-muted rounded-lg p-4">
                {editingLog === log.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => saveEdit(log.id)}
                        size="sm"
                        className="h-7 bg-gray-100 text-gray-800 hover:bg-gray-200 border-0"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={cancelEdit}
                        variant="outline"
                        size="sm"
                        className="h-7"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">{log.content}</p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          onClick={() => startEdit(log)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => deleteLog(log.id)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-2">
                      {log.course_name && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{log.course_name}</span>
                        </div>
                      )}
                      
                      {log.location_name && !log.course_name && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{log.location_name}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(log.created_at).toLocaleDateString()}</span>
                      </div>

                      {/* Auto-generated tags */}
                      {log.tags && log.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {log.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Search input */}
        <div className="pt-4">
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your caddie logs..."
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              className="px-3"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        </div>
    </div>
  );
};

export default CaddieLogs;