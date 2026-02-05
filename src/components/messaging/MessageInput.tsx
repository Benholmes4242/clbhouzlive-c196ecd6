import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { Send, X, Paperclip, Loader2, MapPin, Smile, Camera, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { ShareContentModal } from './ShareContentModal';
import { VoiceRecordButton } from './VoiceRecordButton';
import { haptic } from '@/utils/haptics';
import type { MessageWithSender, MessageType } from '@/types/messaging';

interface MessageInputProps {
  onSend: (
    content: string, 
    replyToId?: string, 
    mediaUrl?: string, 
    mediaType?: 'image' | 'video',
    messageType?: MessageType,
    metadata?: Record<string, unknown>
  ) => void;
  onSendVoiceNote?: (audioBlob: Blob, duration: number) => void;
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
  onSendVoiceNote,
  replyingTo,
  onCancelReply,
  onTyping,
  disabled = false,
}: MessageInputProps) {
  const { user } = useSupabaseSession();
  const [content, setContent] = useState('');
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
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

    // Haptic feedback on send
    haptic('light');

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
        return;
      }
    }

    onSend(content.trim(), replyingTo?.id, mediaUrl, mediaType);
    setContent('');
    setMediaPreview(null);
    onCancelReply();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
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

    const previewUrl = URL.createObjectURL(file);
    setMediaPreview({
      file,
      url: previewUrl,
      type: isImage ? 'image' : 'video',
    });

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

  const handleShareContent = (
    shareContent: string,
    messageType: MessageType,
    metadata: Record<string, unknown>
  ) => {
    onSend(shareContent, replyingTo?.id, undefined, undefined, messageType, metadata);
    onCancelReply();
  };

  const replyToName = replyingTo?.sender?.display_name || replyingTo?.sender?.username || 'Unknown';
  const hasText = content.trim().length > 0;

  return (
    <div className="flex-none px-4 pb-8 pt-2 bg-[#F0F2F5]">
      {/* Reply preview */}
      {replyingTo && (
        <div className="flex items-center justify-between gap-2 px-4 py-2 mb-2 bg-white rounded-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
          <div className="flex-1 min-w-0 pl-2 border-l-2 border-[#2A9D5C]">
            <span className="text-[12px] font-semibold text-[#2A9D5C]">
              Replying to {replyToName}
            </span>
            <p className="text-[13px] text-[#8E8E93] truncate">
              {replyingTo.content}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F5F5F5]"
          >
            <X className="w-4 h-4 text-[#8E8E93]" />
          </button>
        </div>
      )}

      {/* Media preview */}
      {mediaPreview && (
        <div className="mb-2 p-2 bg-white rounded-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
          <div className="relative inline-block">
            {mediaPreview.type === 'image' ? (
              <img 
                src={mediaPreview.url} 
                alt="Preview" 
                className="max-h-24 rounded-xl object-cover"
              />
            ) : (
              <video 
                src={mediaPreview.url} 
                className="max-h-24 rounded-xl"
                controls={false}
              />
            )}
            <button
              onClick={clearMediaPreview}
              className="absolute -top-2 -right-2 w-6 h-6 bg-[#8E8E93] rounded-full flex items-center justify-center"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Input area - WhatsApp style */}
      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="w-10 h-10 rounded-full flex items-center justify-center active:bg-[#E5E5EA] transition-colors flex-shrink-0"
        >
          <Paperclip className="w-5 h-5 text-[#8E8E93]" />
        </button>

        {/* Golf content share button */}
        <button
          onClick={() => setShowShareModal(true)}
          disabled={disabled || uploading}
          title="Share golf content"
          className="w-10 h-10 rounded-full flex items-center justify-center active:bg-[#E5E5EA] transition-colors flex-shrink-0"
        >
          <MapPin className="w-5 h-5 text-[#2A9D5C]" />
        </button>

        {/* Input container - WhatsApp pill style */}
        <div className="flex-1 flex items-end gap-2 bg-white rounded-[24px] px-4 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          {/* Emoji button */}
          <button className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
            <Smile className="w-5 h-5 text-[#8E8E93]" />
          </button>
          
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Message"
            disabled={disabled || uploading}
            rows={1}
            className="flex-1 bg-transparent outline-none text-[15px] text-[#1D1D1F] placeholder:text-[#8E8E93] resize-none max-h-[120px] py-1"
          />
          
          {/* Camera button (when no text) */}
          {!hasText && !mediaPreview && (
            <button className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
              <Camera className="w-5 h-5 text-[#8E8E93]" />
            </button>
          )}
        </div>

        {/* Send or Voice button */}
        {hasText || mediaPreview ? (
          <button 
            onClick={handleSend}
            disabled={(!hasText && !mediaPreview) || disabled || uploading}
            className="w-10 h-10 rounded-full bg-[#2A9D5C] flex items-center justify-center transition-all flex-shrink-0 active:scale-95 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        ) : onSendVoiceNote ? (
          <VoiceRecordButton 
            onSend={onSendVoiceNote}
            disabled={disabled || uploading}
          />
        ) : (
          <button className="w-10 h-10 rounded-full flex items-center justify-center active:bg-[#E5E5EA] transition-colors flex-shrink-0">
            <Mic className="w-5 h-5 text-[#8E8E93]" />
          </button>
        )}
      </div>

      {/* Share Content Modal */}
      <ShareContentModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        onShare={handleShareContent}
      />
    </div>
  );
}
