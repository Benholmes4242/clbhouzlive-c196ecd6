/**
 * BRIEF_ECHO_CADDIE — FULL REPLACEMENT of the Echo surface.
 *
 * THE SCREEN IS THE COURSE. Echo speaks over the venue's own photograph, and
 * answers arrive as SWIPEABLE PANELS carrying ONE IDEA EACH.
 *
 * WHAT WENT: the header, the bubbles, the message thread, the light canvas, the
 * typing indicator and every avatar (§6.2). Nothing in echo-v2/components is
 * imported here any more — only the STREAM and the HISTORY STORE survive,
 * because the brief keeps the model, the route and the store unchanged.
 *
 * ELEVEN STATES, all in scope — see `Phase` below. States 5, 6 and 7 are three
 * different things and are deliberately not one "something went wrong".
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useEchoChatMessages } from '@/features/echo-v2/hooks/useEchoChatMessages';
import { useEchoStream } from '@/features/echo-v2/hooks/useEchoStream';
import { useEchoSuggestions, ECHO_FALLBACK_SUGGESTIONS } from '@/features/echo-v2/hooks/useEchoSuggestions';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMyHolePerformance } from '@/hooks/gam/useMyHolePerformance';

import '@/features/echo-caddie/echo-caddie.css';
import { EC, T } from '@/features/echo-caddie/tokens';
import { CourseStage } from '@/features/echo-caddie/components/CourseStage';
import { ComposerPill } from '@/features/echo-caddie/components/ComposerPill';
import { EchoWaveform } from '@/features/echo-caddie/components/EchoWaveform';
import { ThinkingSources } from '@/features/echo-caddie/components/ThinkingSources';
import { AnswerPanels } from '@/features/echo-caddie/components/AnswerPanels';
import { AskCard, ErrorCard, NoDataCard, OutOfScopeCard } from '@/features/echo-caddie/components/StateCards';
import { useEchoStage } from '@/features/echo-caddie/hooks/useEchoStage';
import { buildPanels } from '@/features/echo-caddie/lib/panels';

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

/** §6.1 the mark, static outside thinking/speaking, over the photograph. */
const Mark: React.FC<{ active: boolean; label: string }> = ({ active, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 20px 14px' }}>
    <EchoWaveform size={26} active={active} />
    <span style={T.EYEBROW}>{label}</span>
  </div>
);

/** Non-golf detection is Echo's, not ours — it says so in the prose. */
const OUT_OF_SCOPE = /\b(i (?:can only|only) (?:help|answer|talk)|golf[- ]related|outside (?:my|what i)|not (?:a )?golf)\b/i;

type Phase =
  | 'ask'          // 1
  | 'thinking'     // 2
  | 'answer'       // 3 / 4
  | 'no-data'      // 5
  | 'out-of-scope' // 6
  | 'error'        // 7
  | 'no-course'    // 8
  | 'no-rounds';   // 9

const EchoV2Page: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const { t } = useTranslation('echo');
  const { user } = useSupabaseSession();

  const contextCourseId = params.get('course') ?? params.get('courseId') ?? null;

  const [composerValue, setComposerValue] = useState('');
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const [errored, setErrored] = useState(false);
  const sentRef = useRef<string | null>(null);

  const { data: messages = [] } = useEchoChatMessages(chatId ?? null);
  const { state, send } = useEchoStream();

  const stage = useEchoStage(contextCourseId);
  const { data: holeRows = [] } = useMyHolePerformance(user?.id, stage.courseId ?? undefined, {
    enabled: !!stage.courseId && stage.roundsHere > 0,
  });

  const { suggestions } = useEchoSuggestions();
  const prompts = suggestions.length > 0 ? suggestions : [...ECHO_FALLBACK_SUGGESTIONS];

  useEffect(() => {
    setErrored(false);
    setLastQuestion(null);
  }, [chatId]);

  /** The latest assistant answer: live stream first, else the stored thread. */
  const answerText = useMemo(() => {
    if (state.streaming && state.text) return state.text;
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === 'assistant') return messages[i].content;
    }
    return null;
  }, [state.streaming, state.text, messages]);

  const phase: Phase = useMemo(() => {
    if (errored) return 'error';
    if (state.streaming && !state.text) return 'thinking';
    if (answerText) {
      if (OUT_OF_SCOPE.test(answerText.slice(0, 260))) return 'out-of-scope';
      return 'answer';
    }
    if (!stage.hasAnyRounds && !stage.loading) return 'no-rounds';
    if (stage.courseId && stage.roundsHere === 0 && lastQuestion) return 'no-data';
    if (stage.isHomeFallback) return 'no-course';
    return 'ask';
  }, [errored, state.streaming, state.text, answerText, stage.hasAnyRounds, stage.loading, stage.courseId, stage.roundsHere, stage.isHomeFallback, lastQuestion]);

  const panels = useMemo(
    () =>
      phase === 'answer'
        ? buildPanels({
            answerText,
            row: stage.roundsHere > 0 ? stage.row : null,
            holes: holeRows,
            courseName: stage.courseName,
          })
        : [],
    [phase, answerText, stage.row, stage.roundsHere, stage.courseName, holeRows],
  );

  /**
   * §5.1 THE SOURCES NAMED MUST BE THE SOURCES ACTUALLY READ. Echo has no field
   * aggregate, so "the field's rounds" is never listed.
   */
  const thinkingSources = useMemo(() => {
    const out: string[] = [];
    if (stage.roundsHere > 0) out.push(t('caddie.sources.rounds', 'Your rounds here'));
    if (holeRows.length > 0) out.push(t('caddie.sources.holes', 'The hole data'));
    if (stage.courseId) out.push(t('caddie.sources.course', 'Course records'));
    const q = (lastQuestion ?? '').toLowerCase();
    if (/tour|tournament|player|open|major|week/.test(q)) out.push(t('caddie.sources.tour', 'This week on tour'));
    if (out.length === 0) out.push(t('caddie.sources.course', 'Course records'));
    return out;
  }, [stage.roundsHere, stage.courseId, holeRows.length, lastQuestion, t]);

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
          // §5.4 losing what someone typed is what makes a failure feel like one.
          setComposerValue(text);
        },
      });
    },
    [chatId, navigate, qc, send, location.search],
  );

  const onBack = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate('/');
  };

  const speaking = state.streaming;
  const tone = phase === 'answer' ? 'answer' : 'ask';
  // §2c a member with no rounds gets the black treatment — no image at all.
  const imageUrl = phase === 'no-rounds' ? null : stage.imageUrl;

  const homeLabel = t('caddie.label.home', 'Your home course');
  const courseLabel = t('caddie.label.course', 'In context');

  return (
    <CourseStage imageUrl={imageUrl} tone={tone}>
      <TopChrome onBack={onBack} onHistory={() => navigate('/echo/history')} />

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
        {phase !== 'answer' && (
          <Mark active={speaking} label={t('caddie.mark', 'Echo')} />
        )}

        {phase === 'thinking' && <ThinkingSources sources={thinkingSources} />}

        {phase === 'answer' && panels.length > 0 && <AnswerPanels panels={panels} />}

        {phase === 'error' && (
          <ErrorCard
            onRetry={() => {
              const q = sentRef.current;
              if (q) void handleSend(q);
            }}
            copy={{
              eyebrow: t('caddie.error.eyebrow', 'That did not go through'),
              lead: t('caddie.error.lead', 'Echo could not reach the course data. Your question is still there.'),
              retry: t('caddie.error.retry', 'Try again'),
            }}
          />
        )}

        {phase === 'out-of-scope' && (
          <OutOfScopeCard
            prompts={prompts}
            onPick={handleSend}
            copy={{
              eyebrow: t('caddie.scope.eyebrow', 'What Echo reads'),
              lead: t('caddie.scope.lead', 'Echo reads your rounds, the courses you play and this week on tour.'),
            }}
          />
        )}

        {phase === 'no-data' && (
          <NoDataCard
            courseName={stage.courseName}
            fieldPrompt={t('caddie.nodata.field', 'How does this course play for everyone else?')}
            onPick={handleSend}
            copy={{
              eyebrow: t('caddie.nodata.eyebrow', 'No rounds of yours here'),
              lead: (c) => t('caddie.nodata.lead', 'You have not played {{course}} yet.', { course: c }),
              advice: t('caddie.nodata.advice', 'Echo can still read how the course plays for the field.'),
            }}
          />
        )}

        {(phase === 'ask' || phase === 'no-course' || phase === 'no-rounds') && (
          <AskCard
            label={
              phase === 'no-course'
                ? homeLabel
                : phase === 'no-rounds'
                  ? t('caddie.norounds.eyebrow', 'Nothing to read yet')
                  : courseLabel
            }
            courseName={phase === 'no-rounds' ? null : stage.courseName}
            lead={
              phase === 'no-rounds'
                ? t('caddie.norounds.lead', 'Connect your handicap and Echo can read your own rounds. Until then, ask about any course or this week on tour.')
                : t('caddie.ask.lead', 'Ask about a hole, a number or how to play it.')
            }
            prompts={prompts}
            onPick={handleSend}
          />
        )}
      </div>

      <ComposerPill
        value={composerValue}
        onChange={setComposerValue}
        onSend={handleSend}
        disabled={state.streaming}
        active={speaking}
        placeholder={t('caddie.composer', 'Ask Echo')}
      />
    </CourseStage>
  );
};

export default EchoV2Page;
