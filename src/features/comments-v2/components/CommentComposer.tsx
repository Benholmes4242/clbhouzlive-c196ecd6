/**
 * CommentComposer - docked composer with:
 * - actor picker (personal / business) on the self-squircle
 * - pill input (MentionsComposerInput)
 * - image attach (compressed, uploaded to comment-images bucket)
 * - "Replying to <name>" context row
 * - amber send when non-empty
 *
 * Keyboard math is handled by CommentsSheetV2 via the shared visualViewport
 * hook (`useKeyboardHeight`), which pads the sheet bottom.
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Image as ImageIcon, Send, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { MentionsComposerInput } from '@/components/mentions/MentionsComposerInput';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { compressImage, COMPRESSION_PRESETS } from '@/uploads/imageCompression';
import type { ActiveActor } from '@/types/actor';
import { FIELD_REST_BG, FIELD_REST_BORDER, FIELD_FOCUS_BG, FIELD_FOCUS_BORDER } from '@/lib/tokens/field';

/*
  DARK BASELINE (MICRO_BRIEF_COMMENTS_DARK §1). The comments sheet is no
  longer a light-forced surface: the bar sits on the page canvas, the field
  is a 6% well on it, and AMBER keeps its single meaning (the viewing
  member) — it is not used for chrome here.
*/
const INK = '#F8FAFC';
const MUTED = 'rgba(248,250,252,0.42)';
const SECONDARY = 'rgba(248,250,252,0.62)';
const AMBER = '#F7931E';
const HAIRLINE = 'rgba(255,255,255,0.10)';


export interface CommentComposerHandles {
  focus: () => void;
}

interface Props {
  replyingTo: { id: string; displayName: string } | null;
  onClearReply: () => void;
  onSubmit: (input: {
    content?: string;
    mediaUrl?: string;
    mediaType?: string;
    actor: ActiveActor;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function CommentComposer({ replyingTo, onClearReply, onSubmit, isSubmitting }: Props) {
  const { user } = useSupabaseSession();
  const { t } = useTranslation('common');
  const { activeActor, availableActors, setActiveActor } = useActiveActor();
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const selfActor = activeActor ?? null;
  const canPick = availableActors.length > 1;
  const hasImage = !!pendingImage;
  const hasText = text.trim().length > 0;
  const canSend = (hasText || hasImage) && !isSubmitting && !uploading;

  useEffect(() => {
    if (replyingTo) requestAnimationFrame(() => inputRef.current?.focus());
  }, [replyingTo]);

  const handleFile = async (file: File) => {
    if (!user?.id) return;
    setUploading(true);
    try {
      const result = await compressImage(file, COMPRESSION_PRESETS.feed);
      const ext = (result.file.type.split('/')[1] || 'jpg').split('+')[0];
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('comment-images').upload(path, result.file, {
        contentType: result.file.type, upsert: false,
      });
      if (error) throw error;
      setPendingImage(path);
    } catch (e) {
      console.warn('[CommentComposer] upload failed', e);
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if (!canSend || !selfActor) return;
    const content = text.trim() || undefined;
    const mediaUrl = pendingImage || undefined;
    const mediaType = pendingImage ? 'image' : undefined;
    setText('');
    setPendingImage(null);
    try {
      await onSubmit({ content, mediaUrl, mediaType, actor: selfActor });
    } catch (e) {
      // restore text on failure
      if (content) setText(content);
      if (mediaUrl) setPendingImage(mediaUrl);
      throw e;
    }
  };

  return (
    <div
      className="shrink-0"
      style={{
        background: A.CANVAS,
        borderTop: `1px solid ${A.BORDER}`,
        padding: '12px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {replyingTo && (
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontSize: 13, color: SECONDARY }}>
            {t('comments.replyingTo')} <span style={{ color: INK, fontWeight: 600 }}>{replyingTo.displayName}</span>
          </span>
          <button
            type="button"
            onClick={onClearReply}
            className="bg-transparent border-0 p-1 cursor-pointer"
            aria-label="Cancel reply"
            style={{ color: MUTED }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {pendingImage && (
        <div className="mb-2 flex items-center gap-2">
          <div className="w-14 h-14 rounded-[10px] bg-white/[0.06] flex items-center justify-center overflow-hidden">
            <ImageIcon size={18} style={{ color: SECONDARY }} />
          </div>
          <span style={{ fontSize: 13, color: SECONDARY }}>Photo attached</span>
          <button
            type="button"
            onClick={() => setPendingImage(null)}
            className="ml-auto bg-transparent border-0 p-1 cursor-pointer"
            style={{ color: MUTED }}
            aria-label="Remove attachment"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 relative">
        {/* Self actor picker */}
        <button
          type="button"
          onClick={() => canPick && setPickerOpen((v) => !v)}
          className="shrink-0 bg-transparent border-0 p-0"
          style={{ cursor: canPick ? 'pointer' : 'default' }}
          aria-label="Change actor"
        >
          <SquircleAvatar
            size={32}
            src={selfActor?.avatarUrl}
            alt={selfActor?.name || 'You'}
            fallback={selfActor?.name?.charAt(0) || '?'}
            hairlineRing ringColor={DARK_HAIRLINE}
          />
        </button>

        {pickerOpen && (
          <div
            style={{
              position: 'absolute', bottom: 44, left: 0, zIndex: 20,
              background: A.PANEL, border: `1px solid ${A.BORDER}`,
              borderRadius: 12, minWidth: 200, padding: 4,
              boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
            }}
          >
            {availableActors.map((a) => (
              <button
                key={`${a.type}:${a.id}`}
                type="button"
                onClick={() => { setActiveActor(a); setPickerOpen(false); }}
                className="w-full flex items-center gap-2 px-2 py-2 bg-transparent border-0 rounded-[8px] cursor-pointer hover:bg-white/[0.06] text-left"
              >
                <SquircleAvatar
                  size={22}
                  src={a.avatarUrl}
                  alt={a.name}
                  fallback={a.name?.charAt(0) || '?'}
                  hairlineRing ringColor={DARK_HAIRLINE}
                />
                <span style={{ fontSize: 15, fontWeight: 600, color: INK }}>{a.name}</span>
                {a.type === 'business' && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: AMBER, letterSpacing: '0.14em' }}>BUSINESS</span>
                )}
                {/*
                  Selected identity. Briefed as amber; note that ActorCards.tsx
                  answers the same question with the canonical 28% white border
                  instead, on the grounds that BOTH identities are the viewing
                  member so amber cannot separate them. Flagged, not resolved.
                */}
                {selfActor?.type === a.type && selfActor?.id === a.id && (
                  <Check size={14} style={{ color: AMBER, marginLeft: 'auto' }} />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Pill input */}
        <div
          className="flex-1 min-w-0"
          onFocusCapture={() => setFocused(true)}
          onBlurCapture={() => setFocused(false)}
          style={{
            background: focused ? FIELD_FOCUS_BG : FIELD_REST_BG,
            border: `1px solid ${focused ? FIELD_FOCUS_BORDER : FIELD_REST_BORDER}`,
            transition: 'background-color 140ms ease-out, border-color 140ms ease-out',
            borderRadius: 22,
            padding: '4px 6px 4px 14px',
            minHeight: 42,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 4,
          }}
        >
          <MentionsComposerInput
            value={text}
            onChange={setText}
            onSubmit={handleSend}
            placeholder={replyingTo
              ? t('comments.replyPlaceholder', { name: replyingTo.displayName })
              : t('comments.placeholder')}
            inputRef={(el) => { inputRef.current = el; }}
            currentUserId={user?.id ?? null}
            textStyle={{
              color: INK,
              caretColor: INK,
              placeholderColor: 'rgba(255,255,255,0.38)',
            }}
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || hasImage}
            className="shrink-0 bg-transparent border-0 p-2 cursor-pointer"
            aria-label="Attach image"
            style={{ color: MUTED }}
          >
            <ImageIcon size={18} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="shrink-0"
          aria-label="Send"
          style={{
            width: 38, height: 38, borderRadius: '50%',
            background: canSend ? AMBER : 'rgba(255,255,255,0.08)',
            color: canSend ? '#FFFFFF' : MUTED,
            border: 0, cursor: canSend ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: canSend ? '0 2px 6px rgba(247,147,30,0.35)' : 'none',
            transition: 'background 150ms',
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

export default CommentComposer;
