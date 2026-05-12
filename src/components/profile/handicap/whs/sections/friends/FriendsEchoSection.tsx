import React from 'react';
import { useHandicapInsights } from '@/lib/whs/insights/useHandicapInsights';
import { renderBoldMarkdown } from '@/lib/whs/insights/renderBoldMarkdown';
import { EchoCallout } from '../_shared/atoms';

const INK_06 = 'rgba(15,23,42,0.06)';

interface Props {
  connectionId: string;
}

export const FriendsEchoSection: React.FC<Props> = ({ connectionId }) => {
  const { data: insights, isLoading } = useHandicapInsights(connectionId);

  if (isLoading && !insights) {
    return (
      <div
        className="animate-pulse"
        style={{
          height: 92,
          background: INK_06,
          borderRadius: 14,
          margin: '0 20px 14px',
        }}
      />
    );
  }

  const narrative = insights?.friend_narrative?.trim();
  if (!narrative) return null;

  return (
    <div style={{ padding: '0 20px', marginBottom: 14 }}>
      <EchoCallout
        context="YOUR CIRCLE"
        body={<p style={{ margin: 0 }}>{renderBoldMarkdown(narrative)}</p>}
      />
    </div>
  );
};

export default FriendsEchoSection;
