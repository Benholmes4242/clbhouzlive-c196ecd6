/**
 * getReasonIcon — keyword-based icon mapping for pick reason bullets.
 * Parses reason text and returns the appropriate Lucide icon name + color.
 * UI-only utility — no data logic.
 */

export type ReasonIconResult = {
  icon: 'BarChart3' | 'TrendingUp' | 'MapPin' | 'Flag' | 'Flame' | 'Zap' | 'Trophy' | 'Target' | 'Sparkles';
  color: string;
};

const STAT_KEYWORDS = ['sg', 'strokes gained', 'stats', 'average', 'gir', 'driving', 'ball-striking', 'putting'];
const COURSE_KEYWORDS = ['course history', 't10', 't18', 't25', 'here in', 'at this venue', 'at this course', 'track record'];
const FORM_KEYWORDS = ['form', 'runner-up', 'wins', 'hot', 'streak', 'momentum', 'recent', 'win'];
const RANK_KEYWORDS = ['world rank', 'ranked #', 'owgr', 'world no'];
const PRECISION_KEYWORDS = ['elite', 'leads field', 'precision', 'accuracy'];

export function getReasonIcon(reasonText: string): ReasonIconResult {
  const lower = reasonText.toLowerCase();

  if (RANK_KEYWORDS.some(k => lower.includes(k))) {
    return { icon: 'Trophy', color: '#D4A017' };
  }
  if (PRECISION_KEYWORDS.some(k => lower.includes(k))) {
    return { icon: 'Target', color: '#8B5CF6' };
  }
  if (STAT_KEYWORDS.some(k => lower.includes(k))) {
    return { icon: 'TrendingUp', color: '#3B82F6' };
  }
  if (COURSE_KEYWORDS.some(k => lower.includes(k))) {
    return { icon: 'MapPin', color: '#16A34A' };
  }
  if (FORM_KEYWORDS.some(k => lower.includes(k))) {
    return { icon: 'Flame', color: '#D97706' };
  }

  return { icon: 'Sparkles', color: '#6B7280' };
}
