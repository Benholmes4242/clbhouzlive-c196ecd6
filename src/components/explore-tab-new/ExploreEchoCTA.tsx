import { memo, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { analyticsEvents } from '@/utils/analyticsEvents';
import { ExploreSectionHeader } from './ExploreSectionHeader';
import { WaveformMark } from './DiscoverMarks';
import type { ExploreMoodId } from './hooks/useExploreMood';

/** Single source of truth for the Echo concierge amber ink colour. */
const ECHO_AMBER_INK = '#B26910';

interface ExploreEchoCTAProps {
  mood: ExploreMoodId;
}

interface HeadlinePair {
  /** Headline quote shown in the amber "TRY ASKING" card */
  quote: string;
  /** Prompt sent to Echo when the main card is tapped */
  prompt: string;
}

interface MoodConfig {
  /** Bank of headline pairs; one is picked at random per visit */
  headlines: HeadlinePair[];
  /** Pool of suggestion chips; 3 are picked at random per visit */
  chips: { label: string; prompt: string }[];
}

const MOOD_PROMPTS: Record<ExploreMoodId, MoodConfig> = {
  foryou: {
    headlines: [
      {
        quote: '"A heathland course like Sunningdale"',
        prompt: 'Find me a heathland course with a similar feel to Sunningdale. Ask about region, budget, and how far I am willing to travel, then suggest a few options.',
      },
      {
        quote: '"Somewhere new that suits my game"',
        prompt: 'Recommend a course I have not played that would suit my game and the courses I rate highly. Ask my region, handicap, and the kind of test I enjoy.',
      },
      {
        quote: '"A classic British course for a special round"',
        prompt: 'Suggest a classic British course worth saving for a special round. Ask my region, budget, and whether I prefer links, heathland, or parkland.',
      },
      {
        quote: '"Top-rated courses I keep missing"',
        prompt: 'Show me very highly rated courses near me that I keep overlooking. Ask my home region and how far I will travel.',
      },
      {
        quote: '"A links test for the summer"',
        prompt: 'Find me a proper links test to play this summer. Ask my region, budget, and how challenging I want it to be, then suggest options.',
      },
    ],
    chips: [
      {
        label: 'Plays like Sunningdale',
        prompt: 'Suggest courses with a similar feel to Sunningdale — heathland, strategic, classic British. Ask me where I am based and recommend a few options.',
      },
      {
        label: 'Under £100 in summer',
        prompt: 'Find me a great course in Britain & Ireland I can play in summer for under £100. Ask about region and course type, then suggest options.',
      },
      {
        label: 'Where my friends haven\'t played',
        prompt: 'Show me well-rated courses my friends have not played yet, so I can be the first in my circle. Ask about region and course type.',
      },
      {
        label: 'Best for my handicap',
        prompt: 'Recommend courses that would be a fair but rewarding test for my handicap. Ask my handicap and region, then suggest a few.',
      },
      {
        label: 'A course with history',
        prompt: 'Find me a course with real history and character worth experiencing. Ask my region and how far I will travel.',
      },
      {
        label: 'Great value this month',
        prompt: 'Find strong-value rounds I can play this month near me. Ask my region and budget, then suggest options.',
      },
    ],
  },
  weekend: {
    headlines: [
      {
        quote: '"A great course within a 45-minute drive for Saturday"',
        prompt: 'Find me a great course within roughly a 45-minute drive for Saturday. Ask where I am, how early I want to tee off, and what kind of course I want.',
      },
      {
        quote: '"Somewhere good to play this Sunday"',
        prompt: 'Help me find a good course to play this Sunday near home. Ask my location, how far I will drive, and my preferred tee time.',
      },
      {
        quote: '"A quieter round away from the crowds"',
        prompt: 'Find a quieter weekend round away from the crowds. Ask my location, the day that suits, and how far I will travel.',
      },
      {
        quote: '"A new course for the weekend"',
        prompt: 'Suggest a course near me I have not played yet for this weekend. Ask my location and the kind of course I enjoy.',
      },
      {
        quote: '"An early tee somewhere worth the drive"',
        prompt: 'Find an early weekend tee time somewhere worth the drive. Ask my location, how early I want to play, and how far I will go.',
      },
    ],
    chips: [
      { label: 'Saturday morning tee', prompt: 'Help me book a Saturday morning tee time at a good course nearby. Ask my location and how far I will drive.' },
      { label: 'Mid-week quieter round', prompt: 'Find a quieter mid-week round at a course I have not played. Ask my location and the day that works best.' },
      { label: '45-minute drive max', prompt: 'Suggest courses within a 45-minute drive of my home that are worth playing. Ask my location and course type preference.' },
      { label: 'Sunday afternoon nine', prompt: 'Find somewhere good for a relaxed Sunday afternoon nine near me. Ask my location and how far I will travel.' },
      { label: 'Twilight rate worth it', prompt: 'Find courses near me with a twilight rate worth taking this weekend. Ask my location and budget.' },
      { label: 'Bring a beginner', prompt: 'Suggest a welcoming weekend course where I can bring a beginner. Ask my location and how far we will travel.' },
    ],
  },
  friends: {
    headlines: [
      {
        quote: '"Where have my friends been playing this month?"',
        prompt: 'Show me where my friends have been playing this month and help me pick somewhere to follow them onto. Ask which friend group or region matters most.',
      },
      {
        quote: '"A course several of my friends rate"',
        prompt: 'Find a course that several of my friends have played and rated highly. Ask which friends or region to focus on.',
      },
      {
        quote: '"Somewhere to organise a group round"',
        prompt: 'Help me organise a group round my friends would enjoy. Ask the region, how many of us, and how serious the round should be.',
      },
      {
        quote: '"Catch up with where my circle plays"',
        prompt: 'Show me the courses my circle plays most so I can catch up on the ones I have missed. Ask which friends or region to prioritise.',
      },
      {
        quote: '"Be the first of my friends to play it"',
        prompt: 'Find a well-rated course none of my friends have played yet so I can be the first. Ask my region and the kind of course I want.',
      },
    ],
    chips: [
      { label: 'Recently logged by friends', prompt: 'Show me courses my friends have logged recently with strong reviews. Ask which friends to prioritise.' },
      { label: 'Where multiple friends played', prompt: 'Find courses where three or more of my friends have played and rated highly. Ask which friends or region to focus on.' },
      { label: 'Good for a group trip', prompt: 'Suggest courses that work well for a group trip with friends. Ask the region, how many of us, and how serious the round should be.' },
      {
        label: 'A friend\'s top-rated round',
        prompt: 'Show me the highest-rated course any of my friends has played recently. Ask which friends to include.',
      },
      { label: 'Somewhere to settle a rivalry', prompt: 'Suggest a fair, characterful course to settle a friendly match. Ask my region and how testing it should be.' },
      { label: 'Group of four this month', prompt: 'Help me find a course for a four-ball this month. Ask the region and the weekend that works.' },
    ],
  },
  hidden: {
    headlines: [
      {
        quote: '"A quietly brilliant course no-one talks about"',
        prompt: 'Surface a few quietly brilliant golf courses I would not have heard of. Ask me about region and the kind of experience I want, then suggest under-the-radar options.',
      },
      {
        quote: '"Highly rated but barely reviewed"',
        prompt: 'Find courses with very high ratings but very few reviews — the real hidden gems. Ask my region and how far I will travel.',
      },
      {
        quote: '"An under-the-radar round worth the drive"',
        prompt: 'Suggest an under-the-radar course worth a detour. Ask my region or route and the kind of course I enjoy.',
      },
      {
        quote: '"A local secret near me"',
        prompt: 'Find a local secret near me that the wider golf world overlooks. Ask my home region and how far I will travel.',
      },
      {
        quote: '"Brilliant golf without the big name"',
        prompt: 'Show me brilliant courses that fly under the radar because they lack a famous name. Ask my region and course type.',
      },
    ],
    chips: [
      { label: 'Highly rated, lightly played', prompt: 'Find courses with very high ratings but few reviews — the hidden gems. Ask my region and how far I will travel.' },
      { label: 'Worth the detour', prompt: 'Suggest a course worth a detour on a road trip. Ask my route or region and the kind of course I enjoy.' },
      { label: 'Quietly underrated', prompt: 'Show me courses the community quietly rates very highly but the wider golf world ignores. Ask region and course type.' },
      { label: 'No famous name', prompt: 'Find excellent courses without a famous name that punch above their reputation. Ask my region and how far I will travel.' },
      { label: 'Off the tourist trail', prompt: 'Suggest courses off the usual tourist trail that locals quietly love. Ask my region and travel distance.' },
      { label: 'A surprising nine', prompt: 'Find a surprising, lesser-known short course or nine worth seeking out. Ask my region.' },
    ],
  },
  bucket: {
    headlines: [
      {
        quote: '"Build me a bucket list across Britain & Ireland"',
        prompt: 'Help me build a golf bucket list across Britain & Ireland. Ask me about region, course types, and dream destinations, then suggest courses to add to my wishlist.',
      },
      {
        quote: '"The rounds I have to play once"',
        prompt: 'Suggest the courses I should play at least once in my life. Ask my region, budget, and how far I will travel for a special trip.',
      },
      {
        quote: '"A once-in-a-lifetime golf trip"',
        prompt: 'Plan a once-in-a-lifetime golf trip for me. Ask budget, region, time of year, and how many days I have.',
      },
      {
        quote: '"The #1 course in each region"',
        prompt: 'List the course widely considered #1 in each region so I can build a bucket list. Ask which regions matter most to me.',
      },
      {
        quote: '"A dream links pilgrimage"',
        prompt: 'Help me plan a dream links pilgrimage. Ask the region, how many days I have, and my budget, then suggest a route.',
      },
    ],
    chips: [
      { label: 'Widely #1 in their region', prompt: 'List the courses widely considered #1 in their region that I should add to my bucket list. Ask which regions matter most.' },
      { label: 'Community pick', prompt: 'Surface courses the community keeps recommending as bucket-list rounds. Ask region and what kind of trip I am planning.' },
      { label: 'Once-in-a-lifetime trip', prompt: 'Plan a once-in-a-lifetime golf trip. Ask budget, region, time of year, and how many days I have.' },
      { label: 'Open Championship venues', prompt: 'Help me plan to play some Open Championship links. Ask my budget, region, and how many days I have.' },
      { label: 'A multi-day road trip', prompt: 'Plan a multi-day golf road trip linking several bucket-list courses. Ask my region, days available, and budget.' },
      { label: 'Save up for one great round', prompt: 'Suggest one great course worth saving up for as a special round. Ask my region and budget.' },
    ],
  },
};

function ExploreEchoCTAInner({ mood }: ExploreEchoCTAProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const config = MOOD_PROMPTS[mood];

  // One seed per mount -> headline + chips stay stable during this visit, but a
  // fresh visit (remount) re-picks. Re-seeds when the mood changes too.
  const seedRef = useRef(Math.random());
  const { headline, chips } = useMemo(() => {
    const seedBase = seedRef.current + mood.length * 0.123; // vary slightly per mood
    let s = Math.floor((seedBase % 1) * 2 ** 32) || 1;
    const rand = () => {
      s |= 0;
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const pickHeadline = config.headlines[Math.floor(rand() * config.headlines.length)] ?? config.headlines[0];
    const shuffled = config.chips.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return { headline: pickHeadline, chips: shuffled.slice(0, 3) };
  }, [config, mood]);

  const goToEcho = (prompt: string, source: string) => {
    analyticsEvents.track('echo_contextual_tap', { source, prompt_preview: prompt.slice(0, 80) });
    const returnTo = location.pathname + location.search;
    navigate(`/echo?prompt=${encodeURIComponent(prompt)}&returnTo=${encodeURIComponent(returnTo)}`);
  };

  return (
    <section>
      <ExploreSectionHeader
        mark={<WaveformMark />}
        title="Echo, your course concierge"
        sub="Describe what you want. She'll find it."
        paddingTop={32}
      />

      <div style={{ padding: '0 16px' }}>
      {/* Main amber card with sample quote */}
      <button
        type="button"
        onClick={() => goToEcho(headline.prompt, `discover_explore_v2_${mood}_card`)}
        className="block w-full text-left active:scale-[0.99] transition-transform"
        style={{
          background: 'rgba(247,147,30,0.08)',
          border: '1px solid rgba(247,147,30,0.22)',
          borderRadius: 14,
          padding: 14,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div
          aria-hidden
          style={{
            flexShrink: 0,
            width: 34,
            height: 34,
            borderRadius: 9,
            background: 'linear-gradient(135deg, #F7931E, #E8920A)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <rect x="3" y="8" width="2" height="8" rx="1" fill="white" opacity="0.7" />
            <rect x="7" y="5" width="2" height="14" rx="1" fill="white" opacity="0.85" />
            <rect x="11" y="3" width="2" height="18" rx="1" fill="white" />
            <rect x="15" y="6" width="2" height="12" rx="1" fill="white" opacity="0.85" />
            <rect x="19" y="9" width="2" height="6" rx="1" fill="white" opacity="0.7" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: ECHO_AMBER_INK,
              margin: 0,
              lineHeight: 1,
            }}
          >
            Try asking
          </p>
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: '#0F172A',
              margin: '6px 0 0',
              lineHeight: 1.35,
            }}
          >
            {headline.quote}
          </p>
        </div>
      </button>

      {/* Suggestion chips */}
      <div className="flex flex-wrap" style={{ gap: 6, marginTop: 10 }}>
        {chips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => goToEcho(chip.prompt, `discover_explore_v2_${mood}_chip`)}
            className="active:scale-[0.97] transition-transform"
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: '6px 10px',
              background: '#FFFFFF',
              border: '1px solid rgba(247,147,30,0.3)',
              borderRadius: 12,
              color: ECHO_AMBER_INK,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>
      </div>
    </section>
  );
}

export const ExploreEchoCTA = memo(ExploreEchoCTAInner);
