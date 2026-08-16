import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { Check, AlertCircle, Clock, Flag } from 'lucide-react';
import { ReportSheet } from "@/components/moderation/ReportSheet";
import type { ThreadMessage, MessageReaction, MessageAttachment } from '@/types/messaging';
import { MessageImage } from './MessageImage';
import { VoiceNote } from './VoiceNote';
import { MediaPreviewViewer } from '@/components/shared/media/MediaPreviewViewer';
import { getSignedUrl } from '@/hooks/messaging/useSignedUrl';
import { FIGS } from '@/lib/tokens/type';
import type { OrderedMediaItem } from '@/components/shared/media/types';

/**
 * BRIEF_MESSAGES_ECHO_PALETTE §4.4 — YOUR MESSAGES ARE AMBER, because amber is
 * the viewing member everywhere on this palette. Theirs are glass over the dark
 * surface. §3.3 no faded colour: three solid ink values, no alpha on text.
 */
const INK = '#F5F7F8';
const SUB = '#A8AFB4';
const HINT = '#7C8489';
const HAIRLINE = 'rgba(255,255,255,0.10)';

// Incoming: flat fill base (blur is an enhancement, applied via .ec-glass).
const IN_BG = 'rgba(255,255,255,0.10)';
const OUT_BG = '#F7931E';
const OUT_FG = '#151007';


interface Props {
  message: ThreadMessage;
  isOutgoing: boolean;
  isFirstOfRun: boolean;
  isLastOfRun: boolean;
  showTicks: boolean;
  onRetry?: (clientId: string) => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function groupReactions(rs: MessageReaction[]): { emoji: string; count: number }[] {
  const map = new Map<string, number>();
  for (const r of rs) map.set(r.emoji, (map.get(r.emoji) ?? 0) + 1);
  return Array.from(map.entries()).map(([emoji, count]) => ({ emoji, count }));
}

/** Double-check (read ticks) rendered in monochrome grey. */
const DoubleCheck: React.FC<{ color: string }> = ({ color }) => {
  const { t } = useTranslation('messaging');
  return (
    <span
      style={{ position: "relative", 
        display: 'inline-flex',
        alignItems: 'center',
        color,
        lineHeight: 0,
      }}
      aria-label={t('a11y.sent')}
    >
      <Check size={12} strokeWidth={2.5} />
      <Check size={12} strokeWidth={2.5} style={{ position: "relative",  marginLeft: -6 }} />
    </span>
  );
};

export const MessageBubble: React.FC<Props> = ({
  message,
  isOutgoing,
  isFirstOfRun,
  isLastOfRun,
  showTicks,
  onRetry,
}) => {
  const { t } = useTranslation('messaging');
  const isDeleted = message.deleted_at != null;
  const isSending = message.status === 'sending';
  const isFailed = message.status === 'failed';

  const bg = isOutgoing ? OUT_BG : IN_BG;
  const fg = isOutgoing ? OUT_FG : INK;

  const R_LG = 18;
  const R_SM = 6;
  // Flatten inner-adjacent corners for stacked runs.
  const topInner = isFirstOfRun ? R_LG : R_SM;
  const bottomInner = isLastOfRun ? R_LG : R_SM;
  const borderRadius = isOutgoing
    ? `${R_LG}px ${topInner}px ${bottomInner}px ${R_LG}px`
    : `${topInner}px ${R_LG}px ${R_LG}px ${bottomInner}px`;

  const reactions = groupReactions(message.reactions ?? []);

  const atts: MessageAttachment[] = Array.isArray(message.attachments)
    ? (message.attachments as unknown as MessageAttachment[])
    : [];
  const images = atts.filter((a) => a && a.kind === 'image');
  const voices = atts.filter((a) => a && a.kind === 'voice');
  const hasMedia = images.length > 0 || voices.length > 0;
  const hasBody = !!message.body?.trim();
  const hugMedia = hasMedia && !hasBody && !message.reply_preview;

  const reply = message.reply_preview;
  const replyRule = isOutgoing ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)';
  const replyName = isOutgoing ? 'rgba(245,246,247,0.9)' : SUB;
  const replySnippet = isOutgoing ? 'rgba(245,246,247,0.6)' : SUB;

  const [showReport, setShowReport] = useState(false);
  const [viewer, setViewer] = useState<{ items: OrderedMediaItem[]; index: number } | null>(null);

  const openViewer = async (tappedIndex: number, fallbackUrl: string) => {
    // Resolve signed URLs (or reuse localUrl) for every image in this message.
    const resolved = await Promise.all(
      images.map(async (att, i): Promise<OrderedMediaItem | null> => {
        let url: string | null = att.localUrl ?? null;
        if (!url && att.path) url = await getSignedUrl(att.path);
        if (!url && i === tappedIndex) url = fallbackUrl;
        if (!url) return null;
        return {
          id: att.path ?? att.localUrl ?? `img-${i}`,
          type: 'image',
          previewUrl: url,
          order: i,
        };
      }),
    );
    const items = resolved.filter((x): x is OrderedMediaItem => x !== null);
    if (items.length === 0) return;
    const adjustedIndex = Math.max(
      0,
      items.findIndex((it) => it.order === tappedIndex),
    );
    setViewer({ items, index: adjustedIndex === -1 ? 0 : adjustedIndex });
  };

  return (
    <div
      className="w-full flex flex-col"
      style={{ position: "relative", 
        alignItems: isOutgoing ? 'flex-end' : 'flex-start',
        marginTop: isFirstOfRun ? 10 : 3,
      }}
    >
      {!isOutgoing && !isDeleted && (
        <button
          type="button"
          onClick={() => setShowReport(true)}
          aria-label={t('a11y.reportMessage')}
          style={{ position: "absolute", left: -28, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", padding: 4, color: HINT, cursor: "pointer" }}
        >
          <Flag size={14} />
        </button>
      )}
      <div
        style={{
          position: "relative",
          maxWidth: '78%',
          background: isDeleted || hugMedia ? 'transparent' : bg,
          color: fg,
          borderRadius,
          padding: isDeleted ? '0' : hugMedia ? '0' : '8px 12px',
          border: isDeleted
            ? `0.5px dashed ${HAIRLINE}`
            : !isOutgoing && !hugMedia
              ? `0.5px solid ${HAIRLINE}`
              : 'none',
          opacity: isSending ? 0.7 : 1,
          display: 'flex',
          flexDirection: 'column',
          gap: hugMedia ? 0 : 4,
          wordBreak: 'break-word',
        }}
      >
        {isDeleted ? (
          <span
            style={{ position: "relative", 
              padding: '8px 12px',
              fontSize: 14,
              lineHeight: 1.4,
              fontStyle: 'italic',
              color: SUB,
            }}
          >
            {t('bubble.deleted')}
          </span>
        ) : (
          <>
            {reply ? (
              <div
                style={{ position: "relative", 
                  borderLeft: `2px solid ${replyRule}`,
                  paddingLeft: 8,
                  marginBottom: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  minWidth: 0,
                }}
              >
                <span
                  style={{ position: "relative", 
                    fontSize: 12,
                    fontWeight: 500,
                    color: replyName,
                    lineHeight: 1.3,
                  }}
                >
                  {reply.sender_name ?? t('bubble.unknownSender')}
                </span>
                <span
                  className="truncate"
                  style={{ position: "relative", 
                    fontSize: 12,
                    color: replySnippet,
                    lineHeight: 1.3,
                    maxWidth: '100%',
                  }}
                >
                  {reply.deleted
                    ? t('bubble.deleted')
                    : reply.body?.trim() || `[${reply.type}]`}
                </span>
              </div>
            ) : null}

            {images.length > 0 ? (
              <div
                style={{ position: "relative", 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  borderRadius: hugMedia ? 12 : 0,
                  overflow: 'hidden',
                }}
              >
                {images.map((att, i) => (
                  <MessageImage
                    key={att.path ?? att.localUrl ?? i}
                    attachment={att}
                    isOutgoing={isOutgoing}
                    onOpen={(url) => openViewer(i, url)}
                  />
                ))}
              </div>
            ) : null}

            {voices.length > 0 ? (
              <div
                style={{ position: "relative", 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  padding: hugMedia ? '6px 8px' : 0,
                }}
              >
                {voices.map((att, i) => (
                  <VoiceNote
                    key={att.path ?? att.localUrl ?? i}
                    attachment={att}
                    isOutgoing={isOutgoing}
                  />
                ))}
              </div>
            ) : null}

            {hasBody ||
            message.type === 'text' ||
            message.type === 'system' ? (
              <span
                style={{ position: "relative", 
                  fontSize: 14,
                  lineHeight: 1.4,
                  whiteSpace: 'pre-wrap',
                  color: fg,
                  padding: hugMedia ? '4px 8px 6px' : 0,
                }}
              >
                {message.type === 'text' || message.type === 'system'
                  ? message.body ?? ''
                  : message.body ?? ''}
                {message.edited_at ? (
                  <span
                    style={{ position: "relative", 
                      color: isOutgoing ? 'rgba(245,246,247,0.55)' : HINT,
                      fontSize: 11,
                      marginLeft: 6,
                    }}
                  >
                    {t('bubble.edited')}
                  </span>
                ) : null}
              </span>
            ) : null}
          </>
        )}
      </div>


      {reactions.length > 0 && !isDeleted ? (
        <div
          className="flex flex-wrap gap-1"
          style={{ position: "relative", 
            marginTop: 4,
            justifyContent: isOutgoing ? 'flex-end' : 'flex-start',
          }}
        >
          {reactions.map((r) => (
            <span
              key={r.emoji}
              className="inline-flex items-center"
              style={{ position: "relative", 
                background: '#FFFFFF',
                border: '0.5px solid rgba(0,0,0,0.08)',
                borderRadius: 11,
                padding: '1px 7px',
                fontSize: 12,
                lineHeight: '18px',
                color: INK,
                gap: 3,
              }}
            >
              <span>{r.emoji}</span>
              {r.count > 1 ? <span style={{ position: "relative",  ...FIGS, color: SUB }}>{r.count}</span> : null}
            </span>
          ))}
        </div>
      ) : null}

      {isLastOfRun ? (
        <div
          className="flex items-center gap-1.5"
          style={{ position: "relative", 
            marginTop: 4,
            paddingLeft: isOutgoing ? 0 : 4,
            paddingRight: isOutgoing ? 4 : 0,
          }}
        >
          {isFailed ? (
            <button
              type="button"
              onClick={() => {
                if (onRetry && message.client_id) onRetry(message.client_id);
              }}
              className="inline-flex items-center gap-1 active:opacity-60"
              style={{ position: "relative", 
                color: '#DC2626',
                fontSize: 10.5,
                fontWeight: 500,
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
              aria-label={t('action.retrySend')}
            >
              <AlertCircle size={11} />
              {t('bubble.failedTapRetry')}
            </button>
          ) : isSending ? (
            <Clock size={11} style={{ position: "relative",  color: HINT }} />
          ) : null}
          <span style={{ position: "relative",  ...FIGS, color: HINT, fontSize: 10.5, lineHeight: 1 }}>
            {formatTime(message.created_at)}
          </span>
          {showTicks && !isFailed && !isSending ? (
            <DoubleCheck color={HINT} />
          ) : null}
        </div>
      ) : null}

      {!isOutgoing && !isDeleted && (
        <ReportSheet
          open={showReport}
          onOpenChange={setShowReport}
          reportType="message"
          reportedUserId={message.sender_user_id ?? undefined}
          reportedConversationId={message.conversation_id}
          reportedMessageId={message.id}
        />
      )}
      {viewer
        ? createPortal(
            <MediaPreviewViewer
              items={viewer.items}
              initialIndex={viewer.index}
              onClose={() => setViewer(null)}
            />,
            document.body,
          )
        : null}
    </div>
  );
};

export default MessageBubble;
