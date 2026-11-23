/**
 * World rankings head + chips + lead line. Owns the brief 16 close-out
 * measure-then-switch for the pair-level title: the names form is measured
 * after layout (useLayoutEffect + ResizeObserver on the head, re-checked on
 * width change and font load); more than two lines switches to the count form
 * via levelHeadForm, moving the names into the line below.
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FONT, INK_MUTE } from '../../_shared/tokens';
import { OverviewSectionHead } from './OverviewSectionHead';
import { rankingsTail, rankingsTitle } from './overviewHeadTitles';
import { levelHeadForm, type LeadSentence } from './worldRankingsRules';
import { measureTitleLines } from './measureTitleLines';

interface Props {
  sentence: LeadSentence | null;
  boardName: string;
  eyebrow: string;
  action: string;
  onAction: () => void;
  /** The board chips, between the head and the lead line. */
  children?: ReactNode;
}

export function RankingsLead({ sentence, boardName, eyebrow, action, onAction, children }: Props) {
  const { t } = useTranslation('tourhub');
  const headRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<'names' | 'count'>('names');
  const [tick, setTick] = useState(0);
  const pair = sentence?.kind === 'level' && sentence.count < 3;
  const namesTitle = rankingsTitle(t, sentence, boardName);

  // Measure only the names form, so switching to the shorter count title cannot flip back.
  useLayoutEffect(() => {
    if (!pair) { if (form !== 'names') setForm('names'); return; }
    if (form !== 'names') return;
    const el = headRef.current?.querySelector<HTMLElement>('[data-overview-title]');
    if (!el) return;
    const next = levelHeadForm(measureTitleLines(el));
    if (next !== form) setForm(next);
  }, [pair, namesTitle, form, tick]);

  // Width change or font load: return to the names form and re-measure before paint.
  useLayoutEffect(() => {
    const head = headRef.current;
    if (!pair || !head) return;
    let width = head.getBoundingClientRect().width;
    const recheck = () => { setForm('names'); setTick((n) => n + 1); };
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => {
      const w = head.getBoundingClientRect().width;
      if (w !== width) { width = w; recheck(); }
    }) : null;
    ro?.observe(head);
    let live = true;
    document.fonts?.ready?.then(() => { if (live) recheck(); });
    return () => { live = false; ro?.disconnect(); };
  }, [pair]);

  const useCount = pair && form === 'count';
  const title = rankingsTitle(t, sentence, boardName, useCount ? 'count' : 'names');
  const tail = rankingsTail(t, sentence, useCount ? 'count' : 'names');
  return (
    <>
      <div ref={headRef} data-rankings-head data-level-form={pair ? form : undefined}>
        <OverviewSectionHead eyebrow={eyebrow} title={title} action={action} onAction={onAction} />
      </div>
      {children}
      {tail ? (
        <div data-lead-sentence style={{ margin: '16px 24px 0', fontFamily: FONT, fontSize: 13.5, lineHeight: 1.4, color: INK_MUTE }}>
          {tail}
        </div>
      ) : null}
    </>
  );
}
