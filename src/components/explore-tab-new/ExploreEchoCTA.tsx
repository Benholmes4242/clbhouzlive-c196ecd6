import { memo } from 'react';
import { EchoContextualButton } from '@/components/echo/EchoContextualButton';
import type { ExploreMoodId } from './hooks/useExploreMood';

interface ExploreEchoCTAProps {
  mood: ExploreMoodId;
}

const MOOD_PROMPTS: Record<ExploreMoodId, { prompt: string; label: string; sublabel: string }> = {
  foryou: {
    prompt:
      'Help me find my next golf course to play that matches my taste. Ask me a few questions about course type, region, and budget, then suggest a few options grounded in my play history.',
    label: 'Ask Echo to refine your picks',
    sublabel: 'A few questions, then tailored suggestions',
  },
  weekend: {
    prompt:
      'Suggest a golf course for a weekend trip. Ask me where I am, how far I am willing to drive, and what kind of course I want, then recommend a few options.',
    label: 'Plan a weekend round with Echo',
    sublabel: 'Distance, course type, tee times',
  },
  friends: {
    prompt:
      'Show me where my friends have been playing recently and help me pick a course to follow them onto. Ask me which friend group or region matters most.',
    label: 'Follow your friends with Echo',
    sublabel: 'Where the people you follow have been playing',
  },
  hidden: {
    prompt:
      'Surface a few hidden-gem golf courses I would not have heard of. Ask me about region and the kind of experience I want, then suggest under-the-radar options.',
    label: 'Find a hidden gem with Echo',
    sublabel: 'Quietly brilliant courses worth the detour',
  },
  bucket: {
    prompt:
      'Help me build a golf bucket list. Ask me about regions, course types, and dream destinations, then suggest courses to add to my wishlist.',
    label: 'Plan your bucket list with Echo',
    sublabel: 'Dream rounds, sequenced sensibly',
  },
};

function ExploreEchoCTAInner({ mood }: ExploreEchoCTAProps) {
  const config = MOOD_PROMPTS[mood];
  return (
    <section style={{ padding: '24px 16px 0' }}>
      <EchoContextualButton
        prompt={config.prompt}
        label={config.label}
        sublabel={config.sublabel}
        dark={false}
        compact
        source={`discover_explore_v2_${mood}`}
      />
    </section>
  );
}

export const ExploreEchoCTA = memo(ExploreEchoCTAInner);
