import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PageRoot } from '@/components/layout/PageRoot';
import { EchoV2Header } from '@/features/echo-v2/components/EchoV2Header';
import { EchoWelcome } from '@/features/echo-v2/components/EchoWelcome';
import { EchoMessageList } from '@/features/echo-v2/components/EchoMessageList';
import { EchoComposer } from '@/features/echo-v2/components/EchoComposer';
import { useEchoChatMessages } from '@/features/echo-v2/hooks/useEchoChatMessages';
import { useEchoStream } from '@/features/echo-v2/hooks/useEchoStream';

const CANVAS = '#F8FAFC';

const EchoV2Page: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [composerValue, setComposerValue] = useState('');
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const { data: messages = [] } = useEchoChatMessages(chatId ?? null);
  const { state, send } = useEchoStream();

  // Clear per-chat transient state on chat switch.
  useEffect(() => {
    setPendingUserMessage(null);
    setErrorNotice(null);
  }, [chatId]);

  const handleSend = useCallback(
    async (text: string) => {
      setErrorNotice(null);
      setPendingUserMessage(text);
      await send(chatId ?? null, text, {
        onChatId: (newChatId) => {
          if (!chatId) {
            // Update URL without remounting the page (same route component).
            navigate(`/echo-v2/${newChatId}`, { replace: true });
          }
        },
        onDone: async (_finalText, _meta, resolvedChatId) => {
          const target = resolvedChatId ?? chatId ?? null;
          if (target) {
            await qc.invalidateQueries({ queryKey: ['echo-v2', 'messages', target] });
          }
          await qc.invalidateQueries({ queryKey: ['echo-v2', 'chats'] });
          setPendingUserMessage(null);
        },
        onError: (_kind, message) => {
          setErrorNotice(message);
          setPendingUserMessage(null);
          setComposerValue(text);
        },
      });
    },
    [chatId, navigate, qc, send]
  );

  const showWelcome = !chatId && messages.length === 0 && !state.streaming && !pendingUserMessage;

  return (
    <PageRoot className="min-h-screen" style={{ background: CANVAS }} hasBottomNav>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          background: CANVAS,
        }}
      >
        <EchoV2Header streaming={state.streaming} />

        {showWelcome ? (
          <EchoWelcome onPick={(p) => handleSend(p)} disabled={state.streaming} />
        ) : (
          <EchoMessageList
            messages={messages}
            streamingText={state.text}
            streamingMeta={state.meta}
            isStreaming={state.streaming}
            pendingUserMessage={pendingUserMessage}
            errorNotice={errorNotice}
          />
        )}

        <EchoComposer
          disabled={state.streaming}
          value={composerValue}
          onValueChange={setComposerValue}
          onSend={handleSend}
        />
      </div>
    </PageRoot>
  );
};

export default EchoV2Page;
