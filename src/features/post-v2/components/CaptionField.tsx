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
  /** Page 2 arrives with a flashing cursor. */
  autoFocus?: boolean;
  /** Host handle on the textarea so focus can be chained off a tap. */
  inputRef?: (el: HTMLTextAreaElement | null) => void;
}

export default function CaptionField({
  value,
  onChange,
  currentUserId,
  variant = 'dark',
  minHeight = 80,
  placeholder = 'Say something about it',
  autoFocus = false,
  inputRef,
}: Props) {
  const light = variant === 'light';
  return (
    <MentionsComposerInput
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      currentUserId={currentUserId}
      autoFocus={autoFocus}
      inputRef={inputRef}
      textStyle={{
        fontSize: light ? 17 : 16,
        lineHeight: light ? '25px' : '24px',
        color: light ? LIGHT_INK : CT_DARK.ink,
        caretColor: light ? LIGHT_INK : CT_DARK.amber,
        // The highlighter has no placeholder layer, so the field must name its
        // own placeholder fill (see MentionsTextStyle.placeholderColor).
        placeholderColor: light ? 'rgba(14,18,22,0.38)' : 'rgba(255,255,255,0.38)',
        minHeight,
        padding: light ? '2px 0' : '12px 0',
      }}
    />
  );
}

