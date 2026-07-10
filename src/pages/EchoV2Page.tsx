import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PageRoot } from '@/components/layout/PageRoot';
import { EchoV2Header } from '@/features/echo-v2/components/EchoV2Header';
import { EchoWelcome } from '@/features/echo-v2/components/EchoWelcome';
import { EchoMessageList } from '@/features/echo-v2/components/EchoMessageList';
import { EchoComposer } from '@/features/echo-v2/components/EchoComposer';
import { useKeyboardHeight } from '@/hooks/messaging/useKeyboardHeight';
import { useEchoChatMessages } from '@/features/echo-v2/hooks/useEchoChatMessages';
import { useEchoStream } from '@/features/echo-v2/hooks/useEchoStream';

const CANVAS = '#F8FAFC';
const BOTTOM_NAV_CLEAR = 94;

const EchoV2Page: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();


  const [composerValue, setComposerValue] = useState('');
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [composerHeight, setComposerHeight] = useState(56);
  const keyboardHeight = useKeyboardHeight();
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const { data: messages = [] } = useEchoChatMessages(chatId ?? null);
  const { state, send } = useEchoStream();

  useEffect(() => {
    setPendingUserMessage(null);
    setErrorNotice(null);
  }, [chatId]);

  const scrollToBottom = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      setErrorNotice(null);
      setPendingUserMessage(text);
      requestAnimationFrame(scrollToBottom);
      await send(chatId ?? null, text, {
        onChatId: (newChatId) => {
          if (!chatId) navigate(`/echo-v2/${newChatId}`, { replace: true });
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
    [chatId, navigate, qc, send, scrollToBottom]
  );

  const showWelcome = !chatId && messages.length === 0 && !state.streaming && !pendingUserMessage;
  const inChat = !!chatId;

  // Message list needs bottom padding equal to composer + keyboard + a hair
  // so the last bubble is never hidden behind the docked composer.
  const scrollPadBottom = `calc(${composerHeight + keyboardHeight + 12}px + env(safe-area-inset-bottom, 0px))`;

  // Welcome route keeps the global bottom nav visible: reserve room below
  // the composer so it never sits under the nav bar.
  const outerPadBottom = !inChat ? BOTTOM_NAV_CLEAR : 0;

  return (
    <PageRoot fixedHeight hasBottomNav={false} style={{ background: CANVAS }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          background: CANVAS,
          paddingBottom: outerPadBottom,
        }}
      >
        <EchoV2Header
          streaming={state.streaming}
          showBack={inChat}
          onBack={() => {
            const from = (location.state as { from?: string } | null)?.from;
            navigate(from === 'history' ? '/echo-v2/history' : '/echo-v2');
          }}
          onHistoryClick={() => navigate('/echo-v2/history')}
        />


        <div
          ref={scrollerRef}
          className="flex-1 overflow-y-auto"
          style={{
            WebkitOverflowScrolling: 'touch',
            paddingBottom: showWelcome ? 0 : scrollPadBottom,
          }}
        >
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
        </div>

        <EchoComposer
          disabled={state.streaming}
          value={composerValue}
          onValueChange={setComposerValue}
          onSend={handleSend}
          onHeightChange={setComposerHeight}
        />
      </div>
    </PageRoot>
  );
};

export default EchoV2Page;
