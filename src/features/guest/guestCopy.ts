/**
 * GUEST COPY TABLE (brief §7). One pure source for every join-card string.
 * The headline is a list of parts; parts marked amber render in #F7931E.
 * The same English ships in every locale's common.json under `guest.*` for
 * the translators; components read this module so the figures stay live.
 */
import type { GuestAction, GuestSurfaceKey } from './guestGateStore';
import { getGuestCourseContext, getGuestTourContext } from './guestGateStore';

export interface GuestCopyPart {
  text: string;
  amber?: boolean;
}

export interface GuestCardCopy {
  kicker: string;
  headline: GuestCopyPart[];
  body: string;
}

export const GUEST_ISLAND_COPY = {
  login: 'Log in',
  join: 'Join free',
} as const;

export const GUEST_CARD_CHROME_COPY = {
  apple: 'Continue with Apple',
  google: 'Continue with Google',
  email: 'Continue with email',
  login: 'ALREADY A MEMBER? LOG IN',
  close: 'Close',
} as const;

// ---------------------------------------------------------------------------
// Per-surface copy (scroll lock and Join free)
// ---------------------------------------------------------------------------
export function guestSurfaceCopy(surface: GuestSurfaceKey): GuestCardCopy {
  if (surface === 'clubhouse') {
    return {
      kicker: 'Join the community',
      headline: [
        { text: '23,000 courses', amber: true },
        { text: ' and the golfers who play them.' },
      ],
      body: 'Join free to keep scrolling, review the courses you’ve played and see how your game stacks up.',
    };
  }
  if (surface === 'explore') {
    return {
      kicker: 'Explore',
      headline: [
        { text: 'Real rounds', amber: true },
        { text: ', records and leaderboards from members.' },
      ],
      body: 'Join free to see the boards and where your own rounds would rank.',
    };
  }
  if (surface === 'courses') {
    return {
      kicker: 'Courses',
      headline: [
        { text: '23,000 courses', amber: true },
        { text: ', measured from real rounds.' },
      ],
      body: 'Join free to see how each one plays and review the ones you know.',
    };
  }
  if (surface === 'tour') {
    const liveEvent = getGuestTourContext()?.liveEventName ?? null;
    return {
      kicker: 'Tour',
      headline: liveEvent
        ? [
            { text: 'Follow ' },
            { text: 'every shot', amber: true },
            { text: ' of ' },
            { text: liveEvent, amber: true },
            { text: '.' },
          ]
        : [
            { text: 'Every tour', amber: true },
            { text: ', every leaderboard, in one place.' },
          ],
      body: 'Join free to follow the leaderboards, our picks and the news as it happens.',
    };
  }
  // course:<id>
  const courseId = surface.slice('course:'.length);
  const ctx = getGuestCourseContext(courseId);
  const short = ctx?.shortName ?? 'This course';
  const rounds = ctx?.roundsTracked ?? null;
  return {
    kicker: short,
    headline:
      rounds != null && rounds >= 1
        ? [
            { text: `${rounds.toLocaleString('en-GB')} rounds`, amber: true },
            { text: ' measured here, hole by hole.' },
          ]
        : [{ text: `See what golfers make of ${short}.` }],
    body: 'Join free to see how every hole really plays and how your game would stack up against it.',
  };
}

// ---------------------------------------------------------------------------
// Action card copy
// ---------------------------------------------------------------------------
const JOIN_IN_KICKER = 'Join to join in';
const SOCIAL_BODY = 'It’s free. Your likes, comments and follows start the moment you’re in.';
const QUICK_BODY = 'It’s free and takes a minute.';

export function guestActionCopy(
  action: GuestAction,
  ctx: { firstName?: string; postKind?: 'post' | 'round' | 'review' } = {},
): GuestCardCopy {
  const name = ctx.firstName?.trim() || 'them';
  switch (action) {
    case 'like':
    case 'comment':
      return {
        kicker: JOIN_IN_KICKER,
        headline: [
          { text: 'Celebrate ' },
          { text: name, amber: true },
          { text: `’s ${ctx.postKind ?? 'post'} and leave a comment.` },
        ],
        body: SOCIAL_BODY,
      };
    case 'follow':
      return {
        kicker: JOIN_IN_KICKER,
        headline: [
          { text: 'Follow ' },
          { text: name, amber: true },
          { text: ' and see every round they post.' },
        ],
        body: SOCIAL_BODY,
      };
    case 'post':
    case 'rate':
      return {
        kicker: JOIN_IN_KICKER,
        headline: [{ text: 'Post your rounds and review the courses you’ve played.' }],
        body: QUICK_BODY,
      };
    case 'message':
      return {
        kicker: JOIN_IN_KICKER,
        headline: [{ text: 'Message ' }, { text: name, amber: true }, { text: ' directly.' }],
        body: QUICK_BODY,
      };
    case 'own_profile':
      return {
        kicker: JOIN_IN_KICKER,
        headline: [{ text: 'Build your profile: your rounds, your courses, your handicap.' }],
        body: QUICK_BODY,
      };
    default:
      return {
        kicker: JOIN_IN_KICKER,
        headline: [{ text: 'Join clbhouz to do that.' }],
        body: QUICK_BODY,
      };
  }
}
