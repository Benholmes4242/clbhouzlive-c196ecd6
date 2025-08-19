import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Search, Edit, Trash2, MapPin, Calendar, Mic, MicOff, Send } from 'lucide-react';
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
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
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
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logs List */}
      <div className="flex-1 min-h-0 flex flex-col">
        <ScrollArea className="flex-1 h-full">
          <div className="p-4 space-y-4">
            {logs.length === 0 ? (
              <div className="text-center text-muted-foreground pt-2">
                <p className="mb-4">
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
        </ScrollArea>
      </div>

      {/* Input area at bottom */}
      <div className="p-4 border-t flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={requestLocation}
            className="text-xs"
          >
            <MapPin className="h-3 w-3 mr-1" />
            Use My Location
          </Button>
          {userLocation && (
            <Badge variant="secondary" className="text-xs">
              {userLocation}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Record course notes and tips..."
              disabled={isRecording || isProcessing}
            />
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              className="px-3"
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : isProcessing ? (
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Button
            onClick={() => {
              // This will trigger voice recording for caddie notes
              if (!isRecording && !isProcessing) {
                startRecording();
              }
            }}
            disabled={isRecording || isProcessing}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CaddieLogs;