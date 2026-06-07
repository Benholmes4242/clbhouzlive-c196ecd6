import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { Send, X, Paperclip, Loader2, MapPin, Camera, Mic, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { ShareContentModal } from './ShareContentModal';
import { VoiceRecordButton } from './VoiceRecordButton';
import { haptic } from '@/utils/haptics';
import { EmojiPickerPopover } from './EmojiPickerPopover';
import { toast } from 'sonner';
import type { MessageWithSender, MessageType } from '@/types/messaging';
import {
  AMBER, INK, INK_MUTE, INK_FAINT, INK_DEEP, SURFACE, SHELL_BG,
  HAIRLINE_INK_7, HAIRLINE_INK_10, INK_TINT_05,
  AMBER_TINT_10, AMBER_TINT_22,
} from './_shared/tokens';

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
  const [actionsOpen, setActionsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [content]);

  useEffect(() => {
    return () => {
      if (mediaPreview?.url) URL.revokeObjectURL(mediaPreview.url);
    };
  }, [mediaPreview?.url]);

  useEffect(() => {
    if (replyingTo) textareaRef.current?.focus();
  }, [replyingTo]);

  const uploadMedia = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from('message-media').upload(fileName, file);
    if (error) { toast.error('Failed to upload media'); return null; }
    const { data: { publicUrl } } = supabase.storage.from('message-media').getPublicUrl(data.path);
    return publicUrl;
  };

  const handleSend = async () => {
    if ((!content.trim() && !mediaPreview) || disabled || uploading) return;
    haptic('light');
    let mediaUrl: string | undefined;
    let mediaType: 'image' | 'video' | undefined;
    if (mediaPreview) {
      setUploading(true);
      const uploadedUrl = await uploadMedia(mediaPreview.file);
      setUploading(false);
      if (uploadedUrl) { mediaUrl = uploadedUrl; mediaType = mediaPreview.type; } else return;
    }
    onSend(content.trim(), replyingTo?.id, mediaUrl, mediaType);
    setContent('');
    setMediaPreview(null);
    onCancelReply();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onTyping?.();
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + emoji + content.substring(end);
      setContent(newContent);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setContent(prev => prev + emoji);
    }
    onTyping?.();
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) { toast.error('Unsupported file type'); return; }
    setMediaPreview({ file, url: URL.createObjectURL(file), type: isImage ? 'image' : 'video' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearMediaPreview = () => {
    if (mediaPreview) { URL.revokeObjectURL(mediaPreview.url); setMediaPreview(null); }
  };

  const handleShareContent = (shareContent: string, messageType: MessageType, metadata: Record<string, unknown>) => {
    onSend(shareContent, replyingTo?.id, undefined, undefined, messageType, metadata);
    onCancelReply();
  };

  const handleCameraCapture = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaPreview({ file, url: URL.createObjectURL(file), type: 'image' });
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const replyToName = replyingTo?.sender?.display_name || replyingTo?.sender?.username || 'Unknown';
  const hasText = content.trim().length > 0;

  return (
    <div 
      className="flex-none"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
        background: SHELL_BG,
        borderTop: `0.5px solid ${HAIRLINE_INK_7}`,
      }}
    >
      {/* Reply preview strip */}
      {replyingTo && (
        <div
          className="flex items-center"
          style={{
            margin: '0 12px 6px',
            padding: '8px 12px', borderRadius: 12,
            background: SHELL_BG,
            border: `0.5px solid ${HAIRLINE_INK_7}`,
            gap: 10,
          }}
        >
          {/* Accent bar */}
          <div style={{ width: 3, height: 32, borderRadius: 99, background: AMBER, flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <span style={{ fontSize: 11, fontWeight: 700, color: AMBER, display: 'block', marginBottom: 2 }}>
              Replying to {replyToName}
            </span>
            <p className="truncate" style={{ fontSize: 13, color: INK_MUTE, margin: 0, whiteSpace: 'nowrap' as const }}>
              {replyingTo.content}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.07)', border: 'none' }}
          >
            <X size={12} style={{ color: INK_MUTE }} />
          </button>
        </div>
      )}

      {/* Media preview */}
      {mediaPreview && (
        <div style={{ margin: '0 12px 6px', padding: 8, borderRadius: 12, background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="relative inline-block">
            {mediaPreview.type === 'image' ? (
              <img src={mediaPreview.url} alt="Preview" className="max-h-24 rounded-xl object-cover" />
            ) : (
              <video src={mediaPreview.url} className="max-h-24 rounded-xl" controls={false} />
            )}
            <button
              onClick={clearMediaPreview}
              className="absolute flex items-center justify-center"
              style={{ top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none' }}
            >
              <X size={12} style={{ color: '#fff' }} />
            </button>
          </div>
        </div>
      )}

      {/* Expandable actions tray */}
      {actionsOpen && (
        <div
          className="flex"
          style={{
            gap: 18, padding: '12px 18px 14px',
            borderTop: `0.5px solid ${HAIRLINE_INK_7}`,
          }}
        >
          <ActionTile
            icon={Paperclip}
            label="Attach"
            onClick={() => { setActionsOpen(false); fileInputRef.current?.click(); }}
          />
          <ActionTile
            icon={Camera}
            label="Take photo"
            onClick={() => { setActionsOpen(false); cameraInputRef.current?.click(); }}
          />
          <ActionTile
            icon={MapPin}
            label="Share course"
            onClick={() => { setActionsOpen(false); setShowShareModal(true); }}
          />
        </div>
      )}

      {/* Main input row */}
      <div className="flex items-end" style={{ gap: 7, padding: '8px 12px' }}>
        {/* Hidden file inputs */}
        <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCameraCapture} />

        {/* + expand button */}
        <button
          onClick={() => setActionsOpen(v => !v)}
          disabled={disabled || uploading}
          className="flex items-center justify-center flex-shrink-0 active:scale-[0.97] transition-all"
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: INK_TINT_05,
            border: `0.5px solid ${HAIRLINE_INK_10}`,
            transform: actionsOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'transform 180ms ease, background 180ms ease',
          }}
          aria-label={actionsOpen ? 'Close actions' : 'More actions'}
        >
          <Plus size={18} style={{ color: INK_MUTE }} strokeWidth={2.2} />
        </button>

        {/* Text input pill */}
        <div
          className="flex-1 flex items-end"
          style={{
            background: '#fff', borderRadius: 22,
            border: '1px solid rgba(0,0,0,0.08)',
            padding: '8px 12px', gap: 8,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <EmojiPickerPopover onEmojiSelect={handleEmojiSelect} />

          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Message"
            disabled={disabled || uploading}
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none max-h-[120px] py-1"
            style={{ fontSize: 14, color: INK_DEEP }}
          />
        </div>

        {/* Right: camera + mic (no text) OR send (has text) */}
        {hasText || mediaPreview ? (
          <button
            onClick={handleSend}
            disabled={(!hasText && !mediaPreview) || disabled || uploading}
            className="flex items-center justify-center flex-shrink-0 active:scale-[0.97] transition-all disabled:opacity-50"
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: AMBER,
              border: 'none',
              boxShadow: '0 4px 14px rgba(247,147,30,0.32), inset 0 0 0 0.5px rgba(255,255,255,0.20)',
            }}
            aria-label="Send"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#fff' }} />
            ) : (
              <Send size={15} style={{ color: '#fff' }} />
            )}
          </button>
        ) : (
          <>
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={disabled || uploading}
              className="flex items-center justify-center flex-shrink-0 active:scale-[0.97] transition-transform"
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: INK_TINT_05,
                border: `0.5px solid ${HAIRLINE_INK_10}`,
              }}
              aria-label="Camera"
            >
              <Camera size={16} style={{ color: INK_MUTE }} />
            </button>
            {onSendVoiceNote ? (
              <VoiceRecordButton
                onSend={onSendVoiceNote}
                disabled={disabled || uploading}
              />
            ) : (
              <button
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: INK_TINT_05,
                  border: `0.5px solid ${HAIRLINE_INK_10}`,
                }}
                aria-label="Voice note"
              >
                <Mic size={16} style={{ color: INK_MUTE }} />
              </button>
            )}
          </>
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

function ActionTile({ icon: Icon, label, onClick }: { icon: typeof Plus; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center active:scale-[0.95] transition-transform"
      style={{ gap: 6, background: 'none', border: 'none', cursor: 'pointer' }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 52, height: 52, borderRadius: 16,
          background: AMBER_TINT_10,
          border: `0.5px solid ${AMBER_TINT_22}`,
        }}
      >
        <Icon size={22} style={{ color: AMBER }} strokeWidth={2.2} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 500, color: INK_MUTE }}>{label}</span>
    </button>
  );
}
