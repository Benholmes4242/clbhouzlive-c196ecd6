/**
 * Brief 15 head titles for the four overview sections. Pure: each section
 * passes data it already loads. Counts follow titleCountWords (2–9 words,
 * 10+ numerals, 1 from the locale's _one key); mid-sentence words are lowered.
 */
import { titleCountWords } from '../../components/overview-v3/overviewTokens';
import { comingHeadCountdown } from './comingUpRules';
import type { LeadSentence } from './worldRankingsRules';

type T = (key: string, opts?: Record<string, unknown>) => string;
const lower = (s: string) => s.toLocaleLowerCase();

export function alsoWeekTitle(t: T, events: { name: string; live: boolean }[], round: number | null): string {
  const live = events.filter((e) => e.live).length;
  if (events.length >= 2) {
    const words = titleCountWords(events.length, t);
    return live > 0
      ? t('overview.alsoThisWeek.headLive', { count: live, words, liveWords: lower(titleCountWords(live, t)) })
      : t('overview.alsoThisWeek.headNone', { words });
  }
  const [only] = events;
  if (!only) return '';
  if (only.live && round != null) return t('overview.alsoThisWeek.headOneLive', { count: round, event: only.name, roundWords: lower(titleCountWords(round, t)) });
  return only.name;
}

export function comingUpTitle(t: T, start: string, now = new Date()): string {
  const c = comingHeadCountdown(start, now);
  if (c.key === 'today' || c.key === 'tomorrow') return t(`overview.comingUp.head.${c.key}`);
  return t(`overview.comingUp.head.${c.key}`, { count: c.count, words: lower(titleCountWords(c.count, t)) });
}

export function rankingsTitle(t: T, sentence: LeadSentence | null, boardName: string): string {
  if (!sentence) return boardName;
  if (sentence.kind === 'level') {
    return sentence.count >= 3
      ? t('overview.rankings.headLevelMany', { count: sentence.count, words: titleCountWords(sentence.count, t) })
      : t('overview.rankings.headLevelPair', sentence.values);
  }
  return t('overview.rankings.headLeads', sentence.values);
}

/** The tail line under the chips, or null when there is none. */
export function rankingsTail(t: T, sentence: LeadSentence | null): string | null {
  if (!sentence) return null;
  if (sentence.kind === 'level') {
    // Brief 16 ruling: the points move under the title; any events clause follows.
    const lead = t(sentence.count >= 3 ? 'overview.rankings.tailLevelAll' : 'overview.rankings.tailLevelBoth', { points: sentence.values.points });
    return sentence.eventsLeft != null ? `${lead} ${t('overview.rankings.tailEvents', { count: sentence.eventsLeft })}` : lead;
  }
  const events = sentence.eventsLeft;
  const clause = sentence.clause === 'twice' ? 'Twice' : sentence.clause === 'nearly' ? 'Nearly' : null;
  if (clause) return events != null ? t(`overview.rankings.tail${clause}Events`, { count: events }) : t(`overview.rankings.tail${clause}`);
  return events != null ? t('overview.rankings.tailEvents', { count: events }) : null;
}

export function newsTitle(t: T, count: number): string {
  return count > 0 ? t('overview.news.head', { count, words: titleCountWords(count, t) }) : t('overview.news.headNone');
}
