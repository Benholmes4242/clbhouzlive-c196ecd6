// CaptionField - bare textarea on the dark composer canvas.

import { MentionsComposerInput } from '@/components/mentions/MentionsComposerInput';
import { CT_DARK } from '@/features/_shared/composerTokens';

interface Props {
  value: string;
  onChange: (v: string) => void;
  currentUserId: string | null;
}

export default function CaptionField({ value, onChange, currentUserId }: Props) {
  return (
    <MentionsComposerInput
      value={value}
      onChange={onChange}
      placeholder="Say something about it"
      currentUserId={currentUserId}
      textStyle={{
        fontSize: 16,
        lineHeight: '24px',
        color: CT_DARK.ink,
        caretColor: CT_DARK.amber,
        minHeight: 80,
        padding: '12px 0',
      }}
    />
  );
}
