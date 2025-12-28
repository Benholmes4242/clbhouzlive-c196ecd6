// Smart prompts that rotate based on context

export type PromptContext = 'empty' | 'hasMedia' | 'business';

const EMPTY_STATE_PROMPTS = [
  "Capture a golf moment worth sharing.",
  "What's the view from the tee?",
  "Show us your round.",
  "That birdie deserves a post.",
  "Every great shot tells a story.",
  "Share your golf journey.",
];

const HAS_MEDIA_PROMPTS = [
  "Nice — add a caption and tag the course.",
  "Looking good! Tag where you played.",
  "Great shot! Add some context.",
  "Perfect — now tell the story.",
  "Almost there — add the details.",
];

const BUSINESS_PROMPTS = [
  "Add insight or a tip to boost saves.",
  "Share something valuable with golfers.",
  "What would help your audience today?",
  "Showcase what makes you unique.",
  "Build your community with great content.",
];

export function getPromptForContext(context: PromptContext, index?: number): string {
  const prompts = context === 'empty' 
    ? EMPTY_STATE_PROMPTS 
    : context === 'business' 
      ? BUSINESS_PROMPTS 
      : HAS_MEDIA_PROMPTS;
  
  const idx = index !== undefined ? index % prompts.length : Math.floor(Math.random() * prompts.length);
  return prompts[idx];
}

export function getPromptsForContext(context: PromptContext): string[] {
  switch (context) {
    case 'empty':
      return EMPTY_STATE_PROMPTS;
    case 'hasMedia':
      return HAS_MEDIA_PROMPTS;
    case 'business':
      return BUSINESS_PROMPTS;
    default:
      return EMPTY_STATE_PROMPTS;
  }
}

// NOTE: Rotating prompts hook removed - static copy is now used in Hero
// The static copy ("Capture the moment" / "From the tee...") performs better
// than rotating prompts for this use case.
