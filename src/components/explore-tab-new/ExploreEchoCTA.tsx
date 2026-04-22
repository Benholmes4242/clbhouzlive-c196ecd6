import { memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { ExploreMoodId } from './hooks/useExploreMood';

/** Single source of truth for the Echo concierge amber ink colour. */
const ECHO_AMBER_INK = '#B26910';

interface ExploreEchoCTAProps {
  mood: ExploreMoodId;
}

interface MoodConfig {
  /** Headline quote in the amber "TRY ASKING" card */
  sampleQuote: string;
  /** Prompt sent to Echo when tapping the main card (the headline quote) */
  samplePrompt: string;
  /** 2–3 short suggestion chips */
  chips: { label: string; prompt: string }[];
}

const MOOD_PROMPTS: Record<ExploreMoodId, MoodConfig> = {
  foryou: {
    sampleQuote: '"A heathland course like Sunningdale"',
    samplePrompt:
      'Find me a heathland course with a similar feel to Sunningdale. Ask about region, budget, and how far I am willing to travel, then suggest a few options.',
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
    ],
  },
  weekend: {
    sampleQuote: '"A great course within a 45-minute drive for Saturday"',
    samplePrompt:
      'Find me a great course within roughly a 45-minute drive for Saturday. Ask where I am, how early I want to tee off, and what kind of course I want.',
    chips: [
      { label: 'Saturday morning tee', prompt: 'Help me book a Saturday morning tee time at a good course nearby. Ask my location and how far I will drive.' },
      { label: 'Mid-week quieter round', prompt: 'Find a quieter mid-week round at a course I have not played. Ask my location and the day that works best.' },
      { label: '45-minute drive max', prompt: 'Suggest courses within a 45-minute drive of my home that are worth playing. Ask my location and course type preference.' },
    ],
  },
  friends: {
    sampleQuote: '"Where have my friends been playing this month?"',
    samplePrompt:
      'Show me where my friends have been playing this month and help me pick somewhere to follow them onto. Ask which friend group or region matters most.',
    chips: [
      { label: 'Recently logged by friends', prompt: 'Show me courses my friends have logged recently with strong reviews. Ask which friends to prioritise.' },
      { label: 'Where multiple friends played', prompt: 'Find courses where three or more of my friends have played and rated highly. Ask which friends or region to focus on.' },
      { label: 'Good for a group trip', prompt: 'Suggest courses that work well for a group trip with friends. Ask the region, how many of us, and how serious the round should be.' },
    ],
  },
  hidden: {
    sampleQuote: '"A quietly brilliant course no-one talks about"',
    samplePrompt:
      'Surface a few quietly brilliant golf courses I would not have heard of. Ask me about region and the kind of experience I want, then suggest under-the-radar options.',
    chips: [
      { label: 'Highly rated, lightly played', prompt: 'Find courses with very high ratings but few reviews — the hidden gems. Ask my region and how far I will travel.' },
      { label: 'Worth the detour', prompt: 'Suggest a course worth a detour on a road trip. Ask my route or region and the kind of course I enjoy.' },
      { label: 'Quietly underrated', prompt: 'Show me courses the community quietly rates very highly but the wider golf world ignores. Ask region and course type.' },
    ],
  },
  bucket: {
    sampleQuote: '"Build me a bucket list across Britain & Ireland"',
    samplePrompt:
      'Help me build a golf bucket list across Britain & Ireland. Ask me about region, course types, and dream destinations, then suggest courses to add to my wishlist.',
    chips: [
      { label: 'Widely #1 in their region', prompt: 'List the courses widely considered #1 in their region that I should add to my bucket list. Ask which regions matter most.' },
      { label: 'Community pick', prompt: 'Surface courses the community keeps recommending as bucket-list rounds. Ask region and what kind of trip I am planning.' },
      { label: 'Once-in-a-lifetime trip', prompt: 'Plan a once-in-a-lifetime golf trip. Ask budget, region, time of year, and how many days I have.' },
    ],
  },
};

function ExploreEchoCTAInner({ mood }: ExploreEchoCTAProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const config = MOOD_PROMPTS[mood];

  const goToEcho = (prompt: string, source: string) => {
    analyticsEvents.track('echo_contextual_tap', { source, prompt_preview: prompt.slice(0, 80) });
    const returnTo = location.pathname + location.search;
    navigate(`/echo?prompt=${encodeURIComponent(prompt)}&returnTo=${encodeURIComponent(returnTo)}`);
  };

  return (
    <section style={{ padding: '24px 16px 0' }}>
      {/* Section heading */}
      <div style={{ padding: '0 0 12px' }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#F7931E',
            margin: 0,
            lineHeight: 1,
          }}
        >
          Ask
        </p>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: '-0.02em',
            color: '#0F172A',
            margin: '4px 0 0',
            lineHeight: 1.15,
          }}
        >
          Echo, your course concierge
        </h2>
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'rgba(15,23,42,0.55)',
            margin: '2px 0 0',
          }}
        >
          Describe what you want. She'll find it.
        </p>
      </div>

      {/* Main amber card with sample quote */}
      <button
        type="button"
        onClick={() => goToEcho(config.samplePrompt, `discover_explore_v2_${mood}_card`)}
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
            borderRadius: '50%',
            background: '#F7931E',
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            letterSpacing: '-0.01em',
          }}
        >
          E
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
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
            {config.sampleQuote}
          </p>
        </div>
      </button>

      {/* Suggestion chips */}
      <div className="flex flex-wrap" style={{ gap: 6, marginTop: 10 }}>
        {config.chips.map((chip) => (
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
    </section>
  );
}

export const ExploreEchoCTA = memo(ExploreEchoCTAInner);
