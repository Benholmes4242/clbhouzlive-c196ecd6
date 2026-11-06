/** Ask {First} payloads arrive as Json from the RPCs, so every field is
 * parsed defensively here and never trusted at the call site. Asker identity
 * is server-owned: the client only ever renders the label it is given. */

export interface ProAnswer {
  id: string;
  question: string;
  answer: string;
  answered_at: string | null;
  asker_label: string;
  useful: number;
  mine: boolean;
}

export interface ProWaiting {
  id: string;
  question: string;
  created_at: string | null;
}

export interface ProAnswersPayload {
  enabled: boolean;
  total: number;
  /** Only present for the pro himself; null for everyone else. */
  waiting: number | null;
  answers: ProAnswer[];
  my_waiting: ProWaiting[];
}

export interface ProInboxRow {
  id: string;
  question: string;
  answer: string | null;
  status: string;
  created_at: string | null;
  answered_at: string | null;
  asker_id: string | null;
  asker_name: string;
  asker_username: string | null;
  asker_avatar: string | null;
  asker_club: string | null;
  useful: number;
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const strOrNull = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

export function parseProAnswer(v: unknown): ProAnswer | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const id = str(o.id);
  if (!id) return null;
  return {
    id,
    question: str(o.question),
    answer: str(o.answer),
    answered_at: strOrNull(o.answered_at),
    asker_label: str(o.asker_label) || 'a member',
    useful: num(o.useful),
    mine: o.mine === true,
  };
}

export function parseProAnswers(data: unknown): ProAnswersPayload | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const o = data as Record<string, unknown>;
  const answers = Array.isArray(o.answers) ? o.answers.map(parseProAnswer).filter((a): a is ProAnswer => !!a) : [];
  const myWaiting = Array.isArray(o.my_waiting)
    ? o.my_waiting
        .map((w) => {
          if (!w || typeof w !== 'object') return null;
          const row = w as Record<string, unknown>;
          const id = str(row.id);
          return id ? { id, question: str(row.question), created_at: strOrNull(row.created_at) } : null;
        })
        .filter((w): w is ProWaiting => !!w)
    : [];
  return {
    enabled: o.enabled === true,
    total: num(o.total),
    waiting: typeof o.waiting === 'number' ? o.waiting : null,
    answers,
    my_waiting: myWaiting,
  };
}

export function parseProInbox(data: unknown): ProInboxRow[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((v) => {
      if (!v || typeof v !== 'object') return null;
      const o = v as Record<string, unknown>;
      const id = str(o.id);
      if (!id) return null;
      return {
        id,
        question: str(o.question),
        answer: strOrNull(o.answer),
        status: str(o.status),
        created_at: strOrNull(o.created_at),
        answered_at: strOrNull(o.answered_at),
        asker_id: strOrNull(o.asker_id),
        asker_name: str(o.asker_name) || 'A member',
        asker_username: strOrNull(o.asker_username),
        asker_avatar: strOrNull(o.asker_avatar),
        asker_club: strOrNull(o.asker_club),
        useful: num(o.useful),
      } as ProInboxRow;
    })
    .filter((r): r is ProInboxRow => !!r);
}

/** "Asked by {label}" with the useful clause omitted entirely at zero. */
export function answerFooter(label: string, useful: number): string {
  const base = `Asked by ${label}`;
  return useful > 0 ? `${base} · ${useful} found this useful` : base;
}

/** The asker's public label, worked out the way the function does: the home
 * club only when it is public, otherwise just "a member". */
export function askerLabel(homeClub: string | null | undefined, clubPublic: boolean): string {
  return clubPublic && homeClub ? `a member at ${homeClub}` : 'a member';
}

/** Inbox timestamp: "2h ago", "Yesterday", "3 days ago", then a date. */
export function inboxTime(iso: string | null, now = Date.now()): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const hours = Math.floor((now - then) / 3_600_000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(then).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
