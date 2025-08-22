import React, { useState, useEffect } from 'react';
import { X, Search, Filter, Trash2, RotateCcw, Play, Maximize2, Calendar, FileText, Plus, Edit2, MessageSquare, Minimize2 } from 'lucide-react';
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

// Chat Conversation Card Component
const ChatConversationCard: React.FC<{
  conversation: ChatConversation;
  onDelete: () => void;
  onEdit: (id: string, title: string) => void;
  isEditing: boolean;
  editTitle: string;
  onEditTitleChange: (title: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelectMessage: (message: string) => void;
}> = ({ conversation, onDelete, onEdit, isEditing, editTitle, onEditTitleChange, onSaveEdit, onCancelEdit, isExpanded, onToggleExpand, onSelectMessage }) => {
  const firstUserMessage = conversation.messages.find(m => m.type === 'user');
  const firstAiMessage = conversation.messages.find(m => m.type === 'ai');

  return (
    <div 
      className={`bg-card rounded-xl shadow-sm transition-all duration-200 overflow-hidden ${
        isExpanded ? 'shadow-md' : 'hover:shadow-md'
      }`}
      style={{
        minHeight: isExpanded ? 'auto' : 'min(112px, 120px)',
        maxHeight: isExpanded ? 'none' : '160px'
      }}
    >
      <div className="p-4 md:p-5">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-2">
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editTitle}
                onChange={(e) => onEditTitleChange(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSaveEdit();
                  else if (e.key === 'Escape') onCancelEdit();
                }}
                autoFocus
              />
              <Button variant="ghost" size="sm" onClick={onSaveEdit} className="h-7 px-2 border-0">
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={onCancelEdit} className="h-7 px-2 border-0">
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <h3 className="font-semibold text-sm line-clamp-1 flex-1 pr-2">
                {firstUserMessage?.content || conversation.customTitle || conversation.title}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {conversation.timestamp.toLocaleDateString()}
                </span>
                {conversation.id.startsWith('session_') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(conversation.id, conversation.customTitle || conversation.title)}
                    className="h-7 px-2 border-0"
                    title="Edit title"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Body Preview */}
        {!isExpanded && !isEditing && firstAiMessage && (
          <div className="mb-3">
            <p className="text-sm text-muted-foreground line-clamp-2 md:line-clamp-3">
              {firstAiMessage.content}
            </p>
          </div>
        )}

        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-3 animate-accordion-down">
            {conversation.messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg ${
                  message.type === 'user' 
                    ? 'bg-primary/10 border-l-4 border-primary' 
                    : 'bg-muted border-l-4 border-muted-foreground'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <Badge variant={message.type === 'user' ? 'default' : 'secondary'} className="border-0">
                    {message.type === 'user' ? 'You' : 'Echo'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{message.content}</p>
                {message.type === 'ai' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectMessage(message.content)}
                    className="p-0 h-auto mt-2 text-xs border-0"
                  >
                    Use this response
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action Row */}
        <div className="flex items-center justify-between mt-3 pt-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="h-7 px-3 text-xs bg-muted hover:bg-muted/80 border-0 rounded-full"
            >
              {isExpanded ? 'Hide' : 'Show'} Conversation
            </Button>
            {conversation.messageCount && (
              <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground border-0">
                {conversation.messageCount}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="h-7 px-2 text-xs hover:bg-muted border-0"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-0"
            title="Delete"
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
  const hasMoreContent = log.content.length > 120 || (log.transcription && log.transcription !== log.content);
  
  return (
    <div 
      className={`bg-card rounded-xl shadow-sm transition-all duration-200 overflow-hidden ${
        isExpanded ? 'shadow-md' : 'hover:shadow-md'
      }`}
      style={{
        minHeight: isExpanded ? 'auto' : 'min(112px, 120px)'
      }}
    >
      <div className="p-4 md:p-5">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-sm line-clamp-1 flex-1">
            {new Date(log.created_at).toLocaleDateString()}
          </h3>
          {log.location_name && (
            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
              {log.location_name}
            </span>
          )}
        </div>

        {/* Body Preview */}
        {!isExpanded && (
          <div className="mb-3">
            <p className="text-sm text-foreground line-clamp-4 md:line-clamp-5">
              {log.content}
            </p>
          </div>
        )}

        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-4 animate-accordion-down">
            <div>
              <h5 className="text-sm font-medium mb-2">Content</h5>
              <p className="text-sm leading-relaxed text-foreground bg-muted p-3 rounded-lg">
                {log.content}
              </p>
            </div>
            
            {log.transcription && log.transcription !== log.content && (
              <div>
                <h5 className="text-sm font-medium mb-2">Transcription</h5>
                <p className="text-sm leading-relaxed text-muted-foreground bg-muted p-3 rounded-lg">
                  {log.transcription}
                </p>
              </div>
            )}
            
            {log.course_name && (
              <div>
                <h5 className="text-sm font-medium mb-2">Course</h5>
                <p className="text-sm text-muted-foreground">{log.course_name}</p>
              </div>
            )}
            
            {log.tags && log.tags.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Tags</h5>
                <div className="flex flex-wrap gap-2">
                  {log.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-muted text-muted-foreground border-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Row */}
        <div className="flex items-center justify-between mt-3 pt-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground border-0">
              Caddie Log
            </Badge>
            {hasMoreContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpand}
                className="h-7 px-2 text-xs hover:bg-muted border-0"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-0"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Swing Analysis Card Component
const SwingAnalysisCard: React.FC<{
  analysis: SwingAnalysis;
  onDelete: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ analysis, onDelete, isExpanded, onToggleExpand }) => {
  const [thumbnailError, setThumbnailError] = useState(false);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  const handleThumbnailError = () => {
    setThumbnailError(true);
    setThumbnailLoading(false);
  };

  const handleThumbnailLoad = () => {
    setThumbnailLoading(false);
  };

  return (
    <div 
      className={`bg-card rounded-xl shadow-sm transition-all duration-200 overflow-hidden ${
        isExpanded ? 'shadow-md' : 'hover:shadow-md'
      }`}
      style={{
        minHeight: isExpanded ? 'auto' : 'min(112px, 120px)'
      }}
    >
      <div className="p-4 md:p-5">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-sm line-clamp-1 flex-1 pr-2">
            {analysis.title || analysis.save_card || 'Swing Analysis'}
          </h3>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {analysis.timestamp.toLocaleDateString()}
          </span>
        </div>

        {/* Body Preview */}
        {!isExpanded && (
          <div className="flex gap-3 mb-3">
            {/* Video Thumbnail */}
            <div className="flex-shrink-0">
              <div className="relative w-20 h-11 md:w-24 md:h-[54px] bg-muted rounded-lg overflow-hidden">
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
                        <Play className="h-3 w-3 text-black" fill="currentColor" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Analysis Title */}
            <div className="flex-1 min-w-0">
              <p className="text-sm line-clamp-1 text-foreground">
                Swing Analysis
              </p>
              {analysis.content && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                  {analysis.content.substring(0, 60)}...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-4 animate-accordion-down">
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
            
            {/* Analysis Content */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Analysis</h4>
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
                        <Badge variant={message.role === 'user' ? 'default' : 'secondary'} className="border-0">
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
        )}

        {/* Action Row */}
        <div className="flex items-center justify-between mt-3 pt-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground border-0">
              Analysis
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="h-7 px-2 text-xs hover:bg-muted border-0"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-0"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
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
  const [expandedAnalysisId, setExpandedAnalysisId] = useState<string | null>(null);
  const [expandedCaddieLogId, setExpandedCaddieLogId] = useState<string | null>(null);
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

    // Load caddie logs from database and swing analyses from database
    let databaseAnalyses: any[] = [];
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Load caddie logs
        const { data: logs, error: logsError } = await supabase
          .from('caddie_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!logsError && logs) {
          setCaddieLogs(logs);
        }

        // Load swing analyses from database
        const { data: dbAnalyses, error: analysesError } = await supabase
          .from('pro_ai_analyses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!analysesError && dbAnalyses) {
          databaseAnalyses = dbAnalyses.map((analysis: any) => {
            const metadata = analysis.analysis_results?.metadata || {};
            const swingContext = analysis.swing_context ? JSON.parse(analysis.swing_context) : null;
            
            return {
              id: analysis.id,
              save_card: metadata.save_card || 'Swing Analysis',
              title: metadata.save_card || 'Swing Analysis',
              tags: metadata.tags || [],
              category: metadata.category || 'Swing',
              content: analysis.analysis_results?.aiResponse || '',
              videoThumbnail: swingContext?.videoThumbnail,
              videoPoster: swingContext?.videoThumbnail,
              videoSrc: analysis.video_url,
              videoUrl: analysis.video_url,
              videoId: swingContext?.videoId,
              conversation: swingContext?.conversation || [],
              timestamp: new Date(analysis.created_at),
              source: 'database'
            };
          });
          
          console.log('📊 Loaded database analyses:', databaseAnalyses.length);
        }
      }
    } catch (error) {
      console.error('Error loading database data:', error);
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
    
    // Combine and deduplicate everything properly - prioritize database analyses over local ones
    const allAnalyses = [...databaseAnalyses, ...uniqueLocalAnalyses, ...swingCoachAnalyses];
    const finalUniqueAnalyses = allAnalyses.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    );
    
    const parsedAnalyses = finalUniqueAnalyses.map((analysis: any) => ({
      ...analysis,
      timestamp: new Date(analysis.timestamp)
    }));
    
    console.log('📊 Final swing analyses count:', {
      databaseAnalyses: databaseAnalyses.length,
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
      console.error('Error loading caddie logs:', error);
    }
  };

  // Helper function to group individual messages into conversations
  const groupMessagesIntoConversations = (messages: HistoryMessage[]): ChatConversation[] => {
    const conversations: ChatConversation[] = [];
    let currentConversation: HistoryMessage[] = [];
    
    // Sort messages by timestamp
    const sortedMessages = [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    for (let i = 0; i < sortedMessages.length; i++) {
      const message = sortedMessages[i];
      
      // If this is a user message and we have a current conversation, close it
      if (message.type === 'user' && currentConversation.length > 0) {
        // Create conversation from current messages
        const firstUserMessage = currentConversation.find(m => m.type === 'user');
        const lastMessage = currentConversation[currentConversation.length - 1];
        
        conversations.push({
          id: `legacy-${Date.now()}-${Math.random()}`,
          title: firstUserMessage?.content.substring(0, 50) + '...' || 'Conversation',
          messages: [...currentConversation],
          timestamp: lastMessage.timestamp,
          createdAt: currentConversation[0].timestamp,
          lastActivityAt: lastMessage.timestamp,
          messageCount: currentConversation.length
        });
        
        currentConversation = [];
      }
      
      currentConversation.push(message);
    }
    
    // Handle any remaining conversation
    if (currentConversation.length > 0) {
      const firstUserMessage = currentConversation.find(m => m.type === 'user');
      const lastMessage = currentConversation[currentConversation.length - 1];
      
      conversations.push({
        id: `legacy-${Date.now()}-${Math.random()}`,
        title: firstUserMessage?.content.substring(0, 50) + '...' || 'Conversation',
        messages: [...currentConversation],
        timestamp: lastMessage.timestamp,
        createdAt: currentConversation[0].timestamp,
        lastActivityAt: lastMessage.timestamp,
        messageCount: currentConversation.length
      });
    }
    
    return conversations.reverse(); // Latest first
  };

  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      conversation.title.toLowerCase().includes(query) ||
      conversation.messages.some(message => 
        message.content.toLowerCase().includes(query)
      )
    );
  }).sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());

  const filteredCaddieLogs = caddieLogs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.content.toLowerCase().includes(query) ||
      (log.transcription && log.transcription.toLowerCase().includes(query)) ||
      (log.location_name && log.location_name.toLowerCase().includes(query)) ||
      (log.course_name && log.course_name.toLowerCase().includes(query))
    );
  });

  const deleteConversation = async (conversationId: string) => {
    try {
      if (conversationId.startsWith('session_')) {
        // Delete from session storage
        conversationSession.deleteConversation(conversationId);
        
        // Update local state
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        
        toast({
          title: "Conversation deleted",
          description: "The conversation has been removed from your history.",
        });
      } else {
        // For legacy conversations, we can't delete individual messages easily
        // since they're stored as a flat array
        toast({
          title: "Cannot delete",
          description: "Legacy conversations cannot be deleted individually.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation.",
        variant: "destructive"
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

      setCaddieLogs(prev => prev.filter(log => log.id !== logId));
      toast({
        title: "Caddie log deleted",
        description: "The log has been removed from your history.",
      });
    } catch (error) {
      console.error('Error deleting caddie log:', error);
      toast({
        title: "Error",
        description: "Failed to delete caddie log.",
        variant: "destructive"
      });
    }
  };

  const deleteSwingAnalysis = async (analysisId: string) => {
    try {
      // Try to delete from database first
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('pro_ai_analyses')
          .delete()
          .eq('id', analysisId)
          .eq('user_id', user.id);

        if (!error) {
          // Successfully deleted from database
          setSwingAnalyses(prev => prev.filter(analysis => analysis.id !== analysisId));
          toast({
            title: "Analysis deleted",
            description: "The swing analysis has been removed from your history.",
          });
          return;
        }
      }

      // Fall back to local storage deletion
      const localAnalyses = JSON.parse(localStorage.getItem('clbhouz_swing_analyses') || '[]');
      const updatedAnalyses = localAnalyses.filter((analysis: any) => analysis.id !== analysisId);
      localStorage.setItem('clbhouz_swing_analyses', JSON.stringify(updatedAnalyses));

      const swingCoachHistory = JSON.parse(localStorage.getItem('clbhouz_swingcoach_history') || '[]');
      const updatedHistory = swingCoachHistory.filter((msg: any) => msg.id !== analysisId);
      localStorage.setItem('clbhouz_swingcoach_history', JSON.stringify(updatedHistory));

      setSwingAnalyses(prev => prev.filter(analysis => analysis.id !== analysisId));
      toast({
        title: "Analysis deleted",
        description: "The swing analysis has been removed from your history.",
      });
    } catch (error) {
      console.error('Error deleting swing analysis:', error);
      toast({
        title: "Error",
        description: "Failed to delete swing analysis.",
        variant: "destructive"
      });
    }
  };

  const handleStartEdit = (conversationId: string, currentTitle: string) => {
    setEditingConversationId(conversationId);
    setEditTitle(currentTitle);
  };

  const handleSaveEdit = (conversationId: string) => {
    // Update local state
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, customTitle: editTitle, title: editTitle }
        : conv
    ));
    
    setEditingConversationId(null);
    setEditTitle('');
    
    toast({
      title: "Title updated",
      description: "Conversation title has been updated.",
    });
  };

  const handleCancelEdit = () => {
    setEditingConversationId(null);
    setEditTitle('');
  };

  const clearAllHistory = () => {
    localStorage.removeItem('clbhouz_ai_history');
    localStorage.removeItem('clbhouz_ai_saved');
    setHistoryMessages([]);
    setSavedInsights([]);
    setConversations([]);
    
    toast({
      title: "History cleared",
      description: "All chat history has been removed.",
    });
  };

  const handleToggleExpansion = (conversationId: string) => {
    setExpandedConversation(prev => prev === conversationId ? null : conversationId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">Echo History</h2>
            {onNewConversation && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onNewConversation();
                  onClose();
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations, logs, or analyses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All History</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your chat history, saved insights, and conversations. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearAllHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
            <TabsTrigger value="chat" id="chat-tab" aria-controls="chat-panel">Chat</TabsTrigger>
            <TabsTrigger value="logs" id="logs-tab" aria-controls="logs-panel">Caddie Logs</TabsTrigger>
            <TabsTrigger value="swing-coach" id="swing-coach-tab" aria-controls="swing-coach-panel">Swing Coach</TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="flex-1 m-0" role="tabpanel" id="chat-panel" aria-labelledby="chat-tab">
            <ScrollArea 
              ref={chatAutoScroll.scrollAreaRef}
              className="flex-1"
              style={{ overscrollBehavior: 'contain' }}
            >
              <div className="p-6">
                {filteredConversations.length > 0 ? (
                  <div className="space-y-4 md:space-y-5">
                    {filteredConversations.map((conversation) => (
                      <ChatConversationCard
                        key={conversation.id}
                        conversation={conversation}
                        onDelete={() => deleteConversation(conversation.id)}
                        onEdit={handleStartEdit}
                        isEditing={editingConversationId === conversation.id}
                        editTitle={editTitle}
                        onEditTitleChange={setEditTitle}
                        onSaveEdit={() => handleSaveEdit(conversation.id)}
                        onCancelEdit={handleCancelEdit}
                        isExpanded={expandedConversation === conversation.id}
                        onToggleExpand={() => handleToggleExpansion(conversation.id)}
                        onSelectMessage={onSelectMessage}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">No history yet</p>
                    <p className="text-sm text-muted-foreground">Your conversations and logs will appear here.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Caddie Logs Tab */}
          <TabsContent value="logs" className="flex-1 m-0" role="tabpanel" id="logs-panel" aria-labelledby="logs-tab">
            <ScrollArea 
              ref={logsAutoScroll.scrollAreaRef}
              className="flex-1"
              style={{ overscrollBehavior: 'contain' }}
            >
              <div className="p-6">
                {filteredCaddieLogs.length > 0 ? (
                  <div className="space-y-4 md:space-y-5">
                    {filteredCaddieLogs.map((log) => (
                      <CaddieLogCard
                        key={log.id}
                        log={log}
                        onDelete={() => deleteCaddieLog(log.id)}
                        isExpanded={expandedCaddieLogId === log.id}
                        onToggleExpand={() => setExpandedCaddieLogId(expandedCaddieLogId === log.id ? null : log.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">No history yet</p>
                    <p className="text-sm text-muted-foreground">Your conversations and logs will appear here.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Swing Coach Tab */}
          <TabsContent value="swing-coach" className="flex-1 m-0" role="tabpanel" id="swing-coach-panel" aria-labelledby="swing-coach-tab">
            <ScrollArea 
              ref={swingAutoScroll.scrollAreaRef}
              className="flex-1"
              style={{ overscrollBehavior: 'contain' }}
            >
              <div className="p-6">
                {swingAnalyses.length > 0 ? (
                  <div className="space-y-4 md:space-y-5">
                    {swingAnalyses.map((analysis) => (
                      <SwingAnalysisCard
                        key={analysis.id}
                        analysis={{
                          ...analysis,
                          tags: analysis.tags || [],
                          conversation: analysis.conversation || []
                        }}
                        onDelete={() => deleteSwingAnalysis(analysis.id)}
                        isExpanded={expandedAnalysisId === analysis.id}
                        onToggleExpand={() => setExpandedAnalysisId(expandedAnalysisId === analysis.id ? null : analysis.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">No history yet</p>
                    <p className="text-sm text-muted-foreground">Your conversations and logs will appear here.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIChatHistory;