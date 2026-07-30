// CaptionField - MentionsComposerInput host.

import { MentionsComposerInput } from '@/components/mentions/MentionsComposerInput';
import { CT } from '@/features/_shared/composerTokens';

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
      placeholder="Write a caption, or @mention friends and businesses"
      currentUserId={currentUserId}
      textStyle={{ fontSize: 15, lineHeight: '22px', color: CT.ink, minHeight: 96, maxHeight: 96, padding: '4px 0' }}
    />
  );
}
