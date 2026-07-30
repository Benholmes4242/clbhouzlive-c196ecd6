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
    <div style={{ padding: '12px 16px', background: CT.canvas, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
      <MentionsComposerInput
        value={value}
        onChange={onChange}
        placeholder="Write a caption... @mention friends or businesses"
        currentUserId={currentUserId}
        textStyle={{ fontSize: 15, lineHeight: '22px', color: CT.ink, minHeight: 96, maxHeight: 96, padding: '4px 0' }}
      />
    </div>
  );
}
