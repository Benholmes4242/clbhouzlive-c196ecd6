import React, { useEffect, useRef } from 'react';
import type { EchoMessageRow } from '../hooks/useEchoChatMessages';
import { EchoBubble } from './EchoBubble';
import { EchoThinking } from './EchoThinking';

interface Props {
  messages: EchoMessageRow[];
  streamingText: string;
  streamingMeta: import('../hooks/useEchoChatMessages').EchoMessageMeta | null;
  isStreaming: boolean;
  pendingUserMessage?: string | null;
  errorNotice?: string | null;
}

export const EchoMessageList: React.FC<Props> = ({
  messages,
  streamingText,
  streamingMeta,
  isStreaming,
  pendingUserMessage,
  errorNotice,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages.length, streamingText, isStreaming, errorNotice]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '12px 0 4px',
      }}
    >

      {messages.map((m) => (
        <EchoBubble key={m.id} role={m.role} content={m.content} meta={m.meta} />
      ))}

      {isStreaming && pendingUserMessage && (
        <EchoBubble role="user" content={pendingUserMessage} />
      )}

      {isStreaming && !streamingText && <EchoThinking />}

      {isStreaming && streamingText && (
        <EchoBubble role="assistant" content={streamingText} meta={streamingMeta} streaming />
      )}

      {errorNotice && (
        <div style={{ padding: '8px 16px' }}>
          <div
            style={{
              background: '#FFF7ED',
              border: '0.5px solid rgba(247,147,30,0.35)',
              color: '#9A5B10',
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: 12.5,
              lineHeight: 1.4,
            }}
          >
            {errorNotice}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default EchoMessageList;
