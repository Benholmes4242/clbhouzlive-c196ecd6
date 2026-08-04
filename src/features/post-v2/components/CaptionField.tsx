// CaptionField - the mention-aware caption input.
// Carried across both composer pages: `variant` restyles the container and
// text for the dark media page or the light words page. The mention logic
// (typeahead for friends AND businesses, markup, entities) is untouched —
// MentionsComposerInput owns it.

import { MentionsComposerInput } from '@/components/mentions/MentionsComposerInput';
import { CT_DARK } from '@/features/_shared/composerTokens';

const LIGHT_INK = '#0E1216';

interface Props {
  value: string;
  onChange: (v: string) => void;
  currentUserId: string | null;
  variant?: 'dark' | 'light';
  minHeight?: number;
  placeholder?: string;
}

export default function CaptionField({
  value,
  onChange,
  currentUserId,
  variant = 'dark',
  minHeight = 80,
  placeholder = 'Say something about it',
}: Props) {
  const light = variant === 'light';
  return (
    <MentionsComposerInput
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      currentUserId={currentUserId}
      textStyle={{
        fontSize: 16,
        lineHeight: '24px',
        color: light ? LIGHT_INK : CT_DARK.ink,
        caretColor: light ? LIGHT_INK : CT_DARK.amber,
        minHeight,
        padding: light ? '2px 0' : '12px 0',
      }}
    />
  );
}
