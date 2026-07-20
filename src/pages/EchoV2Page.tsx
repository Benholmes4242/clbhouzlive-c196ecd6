import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { EchoV2Header } from '@/features/echo-v2/components/EchoV2Header';
import { EchoWelcome } from '@/features/echo-v2/components/EchoWelcome';
import { EchoMessageList } from '@/features/echo-v2/components/EchoMessageList';
import { EchoComposer } from '@/features/echo-v2/components/EchoComposer';
import { useKeyboardHeight } from '@/hooks/messaging/useKeyboardHeight';
import { useEchoChatMessages } from '@/features/echo-v2/hooks/useEchoChatMessages';
import { useEchoStream } from '@/features/echo-v2/hooks/useEchoStream';

const CANVAS = '#F8FAFC';

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

  const { data: messages = [], isError, refetch } = useEchoChatMessages(chatId ?? null);
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
          if (!chatId) navigate(`/echo/${newChatId}`, { replace: true });
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

  // Composer is a flex child pinned to the viewport bottom on BOTH welcome
  // and chat routes. The global bottom nav is hidden on /echo, so no extra
  // reserve is needed here — safe-area is handled by the composer itself.

  return (
    <div className="echo-root" style={{ background: CANVAS }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          background: CANVAS,
        }}
      >
        <EchoV2Header
          streaming={state.streaming}
          showBack
          onBack={() => {
            if (inChat) {
              const from = (location.state as { from?: string } | null)?.from;
              if (from === 'history' && location.key !== 'default') {
                navigate(-1);
              } else {
                navigate('/echo', { replace: true });
              }
              return;
            }
            // Welcome back: exit Echo to previous history entry or home.
            if (location.key !== 'default') navigate(-1);
            else navigate('/');
          }}
          onHistoryClick={() => navigate('/echo/history')}
        />


        <div
          ref={scrollerRef}
          className="flex-1 overflow-y-auto"
          style={{
            WebkitOverflowScrolling: 'touch',
            paddingBottom: showWelcome ? 0 : scrollPadBottom,
            display: showWelcome ? 'flex' : undefined,
            flexDirection: showWelcome ? 'column' : undefined,
          }}
        >
          {showWelcome ? (
            <EchoWelcome onPick={(p) => handleSend(p)} disabled={state.streaming} />
          ) : inChat && isError && messages.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 24px',
                gap: 12,
                textAlign: 'center',
                minHeight: '100%',
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 600, color: '#1F2428' }}>
                Couldn't load this conversation
              </span>
              <button
                type="button"
                onClick={() => { void refetch(); }}
                className="active:opacity-70"
                style={{
                  padding: '10px 18px',
                  borderRadius: 12,
                  background: '#15171F',
                  color: '#F5F6F7',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Retry
              </button>
            </div>
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
    </div>
  );

};

export default EchoV2Page;
