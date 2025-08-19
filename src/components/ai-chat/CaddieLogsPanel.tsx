import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Search, Edit, Trash2, MapPin, Calendar, Mic, MicOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface CaddieLogsPanelProps {
  isRecording: boolean;
  isProcessing: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  userLocation: string;
  requestLocation: () => void;
}

const CaddieLogsPanel: React.FC<CaddieLogsPanelProps> = ({
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
  const [newLogContent, setNewLogContent] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  const createCaddieLog = async (content: string) => {
    if (!content.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const autoTagGolfTerms = (text: string): string[] => {
        const golfTerms = [
          'tree', 'bunker', 'green', 'slope', 'yardage', 'carry', 'pin', 'flag',
          'fairway', 'rough', 'water', 'hazard', 'dogleg', 'elevation', 'wind',
          'left', 'right', 'center', 'front', 'back', 'avoid', 'target'
        ];
        
        return golfTerms.filter(term => 
          text.toLowerCase().includes(term)
        );
      };

      const { data, error } = await supabase
        .from('caddie_logs')
        .insert({
          user_id: user.id,
          content: content.trim(),
          transcription: content.trim(),
          location_name: userLocation || null,
          course_name: null,
          tags: autoTagGolfTerms(content)
        })
        .select()
        .single();

      if (error) throw error;

      setLogs(prev => [data, ...prev]);
      setNewLogContent('');
      
      toast({
        title: "Log Created",
        description: "Your caddie note has been saved",
      });
    } catch (error) {
      console.error('Error creating caddie log:', error);
      toast({
        title: "Error", 
        description: "Failed to create log",
        variant: "destructive"
      });
    }
  };

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
      toast({
        title: "Error",
        description: "Failed to load caddie logs",
        variant: "destructive"
      });
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
      toast({
        title: "Log deleted",
        description: "Caddie log has been removed",
      });
    } catch (error) {
      console.error('Error deleting log:', error);
      toast({
        title: "Error",
        description: "Failed to delete log",
        variant: "destructive"
      });
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
      
      toast({
        title: "Log updated",
        description: "Your caddie log has been saved",
      });
    } catch (error) {
      console.error('Error updating log:', error);
      toast({
        title: "Error",
        description: "Failed to update log",
        variant: "destructive"
      });
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

  if (isLoading) {
    return (
      <div className="h-full min-h-0 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0">
      <div className="px-6 py-5 space-y-4">
        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Add New Log Input */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Add a new caddie note..."
              value={newLogContent}
              onChange={(e) => setNewLogContent(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  createCaddieLog(newLogContent);
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={() => createCaddieLog(newLogContent)}
              disabled={!newLogContent.trim()}
              size="sm"
            >
              Add
            </Button>
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              disabled={isProcessing}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </div>
          {(isRecording || isProcessing) && (
            <div className="text-center text-sm text-muted-foreground">
              {isProcessing ? 'Processing recording...' : 'Recording...'}
            </div>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="text-center text-muted-foreground pt-4">
            <p className="mb-6">
              Your personal yardage book starts here.<br />
              Tap the mic, record notes as you walk the course, and I'll store them for you.
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
                        className="h-7"
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
      </div>
    </div>
  );
};

export default CaddieLogsPanel;