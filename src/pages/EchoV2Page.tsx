/**
 * BRIEF_ECHO_CHAT — ECHO IS A DARK SCROLLING CHAT ON THE CLUBHOUSE CANVAS, and
 * THE SHAPE OF THE ANSWER FOLLOWS THE KIND OF QUESTION.
 *
 * THIS SUPERSEDES BRIEF_ECHO_CADDIE. What went with it: the swipe panels, the
 * photograph stage and its most-played-course fallback, and the prose→panels
 * builder. Answers SCROLL — three ideas are three blocks down one thread.
 *
 * THE THREE KINDS (§0.2) arrive on the stream's existing `meta` event as
 * `kind: your_golf | course | game`, mapped server-side (see
 * echo-intelligence-v2 → mapIntentsToKind). What sources are named, whether a
 * chart appears and whether a basis line prints are all consequences of it.
 *
 * IF `kind` IS ABSENT the client falls back to the LEAST CLAIMING shape: prose,
 * no chart, no source list, no basis line. A data answer is never guessed from
 * prose — that is exactly what went wrong last time.
 *
 * §5.3 / acceptance E — ONE WAVEFORM, NEVER TWO: the only mark in the thread is
 * the one on the current answer (`Says`), and it animates only while thinking.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useEchoChatMessages } from '@/features/echo-v2/hooks/useEchoChatMessages';
import { useEchoStream } from '@/features/echo-v2/hooks/useEchoStream';
import { useEchoSuggestions, ECHO_FALLBACK_SUGGESTIONS } from '@/features/echo-v2/hooks/useEchoSuggestions';

import '@/features/echo-chat/echo-chat.css';
import { EC, T } from '@/features/echo-chat/tokens';
import { ComposerPill } from '@/features/echo-chat/components/ComposerPill';
import { ThinkingSources } from '@/features/echo-chat/components/ThinkingSources';
import { HolesBar } from '@/features/echo-chat/components/HolesBar';
import { CompareBars } from '@/features/echo-chat/components/CompareBars';
import {
  Asked,
  Basis,
  ChartCard,
  AnswerText,
  Follow,
  Prose,
  Says,
} from '@/features/echo-chat/components/ThreadPrimitives';
import {
  EntryPanel,
  ErrorBlock,
  NoDataBlock,
  OutOfScopeBlock,
  type EntryExample,
} from '@/features/echo-chat/components/StateCards';
import { useEchoAnswerData, type EchoKind } from '@/features/echo-chat/hooks/useEchoAnswerData';

/** §6 minimal chrome: back, and the way into history. No title bar. */
const TopChrome: React.FC<{ onBack: () => void; onHistory: () => void }> = ({ onBack, onHistory }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 12px 8px',
      paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
      flex: '0 0 auto',
    }}
  >
    <button
      type="button"
      onClick={onBack}
      aria-label="Back"
      className="ec-glass ec-glass--quiet active:opacity-70"
      style={{ width: 34, height: 34, borderRadius: 17, display: 'grid', placeItems: 'center' }}
    >
      <ChevronLeft size={19} strokeWidth={2.4} color={EC.INK} />
    </button>
    <button
      type="button"
      onClick={onHistory}
      aria-label="History"
      className="ec-glass ec-glass--quiet active:opacity-70"
      style={{ width: 34, height: 34, borderRadius: 17, display: 'grid', placeItems: 'center' }}
    >
      <Clock size={16} strokeWidth={2.4} color={EC.INK} />
    </button>
  </div>
);

/** Echo's own words when it declines — the prose says so, we only read it. */
const OUT_OF_SCOPE = /\b(i (?:can only|only) (?:help|answer|talk)|golf[- ]related|outside (?:my|what i)|not (?:a )?golf)\b/i;

/**
 * §4.5 THE ADVICE LINE IS ADVICE. §4.6 IF ECHO ONLY HAS ONE THING TO SAY, IT
 * SAYS IT ONCE — so an answer is split on its own paragraph breaks and never
 * padded to three blocks.
 */
function splitBlocks(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function readKind(meta: { kind?: string } | null | undefined): EchoKind | null {
  const k = meta?.kind;
  return k === 'your_golf' || k === 'course' || k === 'game' ? k : null;
}

const EchoV2Page: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const { t } = useTranslation('echo');

  const contextCourseId = params.get('course') ?? params.get('courseId') ?? null;

  const [composerValue, setComposerValue] = useState('');
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const [errored, setErrored] = useState(false);
  const sentRef = useRef<string | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);

  const { data: messages = [] } = useEchoChatMessages(chatId ?? null);
  const { state, send } = useEchoStream();

  useEffect(() => {
    setErrored(false);
    setLastQuestion(null);
  }, [chatId]);

  /** The latest assistant answer and its meta: live stream first, else stored. */
  const latest = useMemo(() => {
    if (state.streaming || state.text) {
      return { text: state.text, kind: readKind(state.meta as { kind?: string } | null) };
    }
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === 'assistant') {
        return {
          text: messages[i].content,
          kind: readKind(messages[i].meta as { kind?: string }),
        };
      }
    }
    return { text: '', kind: null as EchoKind | null };
  }, [state.streaming, state.text, state.meta, messages]);

  const data = useEchoAnswerData(contextCourseId, latest.kind, lastQuestion);
  const { suggestions } = useEchoSuggestions();
  const prompts = suggestions.length > 0 ? suggestions : [...ECHO_FALLBACK_SUGGESTIONS];

  /** §5.1 only the reads that actually fired, in resolve order. */
  const thinkingSources = useMemo(() => {
    const out: string[] = [];
    if (data.sources('rounds')) out.push(t('chat.sources.rounds', 'Your rounds here'));
    if (data.sources('holes')) out.push(t('chat.sources.holes', 'The hole data'));
    if (data.sources('course')) out.push(t('chat.sources.course', 'Course records'));
    if (data.sources('tour')) out.push(t('chat.sources.tour', 'This week on tour'));
    return out;
  }, [data, t]);

  const handleSend = useCallback(
    async (text: string) => {
      setErrored(false);
      setLastQuestion(text);
      sentRef.current = text;
      setComposerValue('');
      await send(chatId ?? null, text, {
        onChatId: (newChatId) => {
          if (!chatId) navigate(`/echo/${newChatId}${location.search}`, { replace: true });
        },
        onDone: async (_final, _meta, resolvedChatId) => {
          const target = resolvedChatId ?? chatId ?? null;
          if (target) await qc.invalidateQueries({ queryKey: ['echo-v2', 'messages', target] });
          await qc.invalidateQueries({ queryKey: ['echo-v2', 'chats'] });
        },
        onError: () => {
          setErrored(true);
          // Losing what someone typed is what makes a failure feel like one.
          setComposerValue(text);
        },
      });
    },
    [chatId, navigate, qc, send, location.search],
  );

  /** §3.4 THE THREAD STAYS SCROLLED TO THE LATEST. */
  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, state.text, state.streaming, errored]);

  const onBack = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate('/');
  };

  const thinking = state.streaming && !state.text;
  const outOfScope = !!latest.text && OUT_OF_SCOPE.test(latest.text.slice(0, 260));

  /**
   * §8.1 ENTRY teaches the three kinds by SHOWING one example of each, drawn
   * from this member where it can be. With no rounds, the "Your golf" example
   * is REPLACED rather than shown with nothing behind it.
   */
  const entryExamples = useMemo<EntryExample[]>(() => {
    const mostPlayed = data.courseBars[0]?.label ?? null;
    const yourGolf =
      data.hasAnyRounds && mostPlayed
        ? t('chat.entry.example.yourGolfWithCourse', 'Which holes cost me most at {{course}}?', {
            course: mostPlayed,
          })
        : t('chat.entry.example.yourGolfNoRounds', 'How do I start bringing my handicap down?');
    const course = data.courseName
      ? t('chat.entry.example.course', 'How does {{course}} play?', { course: data.courseName })
      : mostPlayed
        ? t('chat.entry.example.course', 'How does {{course}} play?', { course: mostPlayed })
        : t('chat.entry.example.courseGeneric', "What should I know before playing Royal St George's?");
    return [
      { kind: t('chat.entry.kind.your_golf', 'Your golf'), question: yourGolf },
      { kind: t('chat.entry.kind.course', 'A course'), question: course },
      { kind: t('chat.entry.kind.game', 'The game'), question: t('chat.entry.example.game', 'What makes a great links course?') },
    ];
  }, [data.courseBars, data.hasAnyRounds, data.courseName, t]);

  const showEntry = messages.length === 0 && !state.streaming && !latest.text && !errored;

  /** §4.2 / correction 4b — the chart is the MEMBER'S OWN hole performance. */
  const courseChart = latest.kind === 'course' && data.holes.length > 0;
  /** §4.3 — the member's bars against their own benchmark tick. */
  const golfChart = latest.kind === 'your_golf' && data.courseBars.length > 1;
  const benchmark = useMemo(() => {
    if (data.courseBars.length === 0) return 0;
    return data.courseBars.reduce((n, b) => n + b.value, 0) / data.courseBars.length;
  }, [data.courseBars]);

  const blocks = splitBlocks(latest.text);
  /** No chart for a "game" answer, and never a chart before its first prose. */
  const lead = blocks[0] ?? '';
  const rest = blocks.slice(1);

  return (
    <div className="ec-root">
      <TopChrome onBack={onBack} onHistory={() => navigate('/echo/history')} />

      {showEntry ? (
        <EntryPanel
          headline={t('chat.entry.headline', 'Ask Echo about your golf, a course, or the game.')}
          examples={entryExamples}
          onPick={handleSend}
        />
      ) : (
        <div className="ec-thread" ref={threadRef} style={{ padding: '4px 18px 8px' }}>
          {messages.map((m) =>
            m.role === 'user' ? (
              <Asked key={m.id} q={m.content} />
            ) : (
              <Says key={m.id}>
                {splitBlocks(m.content).map((b, i) => (
                  <AnswerText key={i} text={b} first={i === 0} />
                ))}
              </Says>
            ),
          )}

          {/* The live turn. The stored thread renders it once persisted. */}
          {state.streaming && lastQuestion && <Asked q={lastQuestion} />}

          {thinking && (
            <Says live>
              <ThinkingSources
                sources={thinkingSources}
                thinkingLabel={t('chat.thinking', 'Thinking')}
              />
            </Says>
          )}

          {!thinking && state.streaming && latest.text && (
            <Says>
              <AnswerText text={lead} first />

              {courseChart && (
                <>
                  <ChartCard>
                    <div style={T.LABEL}>{t('chat.chart.holesTitle', 'Where the strokes go')}</div>
                    <div style={{ marginTop: 12 }}>
                      <HolesBar holes={data.holes} highlightHole={data.worstHole} />
                    </div>
                    <Basis>
                      {t('chat.basis.roundsHere', {
                        count: data.roundsHere,
                        defaultValue: 'Your {{count}} rounds here',
                      })}
                    </Basis>
                  </ChartCard>
                </>
              )}

              {golfChart && (
                <ChartCard>
                  <div style={T.LABEL}>{t('chat.chart.coursesTitle', 'Course by course')}</div>
                  <div style={{ marginTop: 12 }}>
                    <CompareBars
                      bars={data.courseBars}
                      benchmark={benchmark}
                      benchmarkLabel={t('chat.basis.benchmark', 'Your average')}
                    />
                  </div>
                  <Basis>
                    {t('chat.basis.acrossCourses', {
                      rounds: data.totalRounds,
                      courses: data.courseCount,
                      defaultValue: 'Your {{rounds}} rounds across {{courses}} courses',
                    })}
                  </Basis>
                </ChartCard>
              )}

              {rest.map((b, i) => (
                <AnswerText key={i} text={b} />
              ))}
            </Says>
          )}

          {outOfScope && !state.streaming && (
            <Says>
              <OutOfScopeBlock
                lead={t(
                  'chat.scope.lead',
                  'Echo answers golf — your rounds, the courses you play, and the game itself.',
                )}
                prompts={prompts}
                onPick={handleSend}
              />
            </Says>
          )}

          {/* Echo understood, but there are no rounds of the member's to read. */}
          {!state.streaming && !latest.text && !errored && lastQuestion && contextCourseId && data.roundsHere === 0 && (
            <Says>
              <NoDataBlock
                lead={
                  data.courseName
                    ? t('chat.nodata.lead', 'You have not played {{course}}, so Echo has no rounds of yours to read there.', { course: data.courseName })
                    : t('chat.nodata.leadGeneric', 'Echo has no rounds of yours to read there yet.')
                }
                prompts={prompts}
                onPick={handleSend}
              />
            </Says>
          )}

          {errored && (
            <Says>
              <ErrorBlock
                lead={t('chat.error.lead', 'That did not go through.')}
                reassure={t('chat.error.reassure', 'Your question is still in the composer.')}
                retry={t('chat.error.retry', 'Try again')}
                onRetry={() => {
                  const q = sentRef.current;
                  if (q) void handleSend(q);
                }}
              />
            </Says>
          )}

          {!data.hasAnyRounds && !data.loading && messages.length === 0 && !state.streaming && (
            <Says>
              <Prose first>
                {t('chat.norounds.lead', 'Connect your handicap and Echo can read your own rounds. Until then, ask about any course or the game.')}
              </Prose>
            </Says>
          )}
        </div>
      )}

      <ComposerPill
        value={composerValue}
        onChange={setComposerValue}
        onSend={handleSend}
        disabled={state.streaming}
        placeholder={t('chat.composer', 'Ask Echo')}
      />
    </div>
  );
};

export default EchoV2Page;
