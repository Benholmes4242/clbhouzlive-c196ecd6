import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, X, Paperclip, Image, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { MessageWithSender } from '@/types/messaging';

interface MessageInputProps {
  onSend: (content: string, replyToId?: string, mediaUrl?: string, mediaType?: 'image' | 'video') => void;
  replyingTo?: MessageWithSender | null;
  onCancelReply: () => void;
  onTyping?: () => void;
  disabled?: boolean;
}

interface MediaPreview {
  file: File;
  url: string;
  type: 'image' | 'video';
}

export function MessageInput({
  onSend,
  replyingTo,
  onCancelReply,
  onTyping,
  disabled = false,
}: MessageInputProps) {
  const { user } = useSupabaseSession();
  const [content, setContent] = useState('');
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [content]);

  // Focus when replying
  useEffect(() => {
    if (replyingTo) {
      textareaRef.current?.focus();
    }
  }, [replyingTo]);

  const uploadMedia = async (file: File): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('message-media')
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading media:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('message-media')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleSend = async () => {
    if ((!content.trim() && !mediaPreview) || disabled || uploading) return;

    let mediaUrl: string | undefined;
    let mediaType: 'image' | 'video' | undefined;

    if (mediaPreview) {
      setUploading(true);
      const uploadedUrl = await uploadMedia(mediaPreview.file);
      setUploading(false);

      if (uploadedUrl) {
        mediaUrl = uploadedUrl;
        mediaType = mediaPreview.type;
      } else {
        // Upload failed, don't send
        return;
      }
    }

    onSend(content.trim(), replyingTo?.id, mediaUrl, mediaType);
    setContent('');
    setMediaPreview(null);
    onCancelReply();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onTyping?.();
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      alert('Please select an image or video file');
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setMediaPreview({
      file,
      url: previewUrl,
      type: isImage ? 'image' : 'video',
    });

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearMediaPreview = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview.url);
      setMediaPreview(null);
    }
  };

  const replyToName = replyingTo?.sender?.display_name || replyingTo?.sender?.username || 'Unknown';

  return (
    <div className="border-t border-border bg-background">
      {/* Reply preview */}
      {replyingTo && (
        <div className="flex items-center justify-between gap-2 px-4 py-2 bg-muted/50 border-b border-border">
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-primary">
              Replying to {replyToName}
            </span>
            <p className="text-sm text-muted-foreground truncate">
              {replyingTo.content}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Media preview */}
      {mediaPreview && (
        <div className="px-4 py-2 bg-muted/30 border-b border-border">
          <div className="relative inline-block">
            {mediaPreview.type === 'image' ? (
              <img 
                src={mediaPreview.url} 
                alt="Preview" 
                className="max-h-24 rounded-lg object-cover"
              />
            ) : (
              <video 
                src={mediaPreview.url} 
                className="max-h-24 rounded-lg"
                controls={false}
              />
            )}
            <Button
              variant="secondary"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={clearMediaPreview}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 p-3">
        {/* Media attachment button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled || uploading}
          className={cn(
            "flex-1 min-h-[44px] max-h-[120px] resize-none py-3",
            "rounded-2xl border-muted-foreground/20 focus-visible:ring-primary"
          )}
          rows={1}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={(!content.trim() && !mediaPreview) || disabled || uploading}
          className="h-11 w-11 rounded-full flex-shrink-0"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
