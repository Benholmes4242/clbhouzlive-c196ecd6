import React from 'react';
import { useHandicapInsights } from '@/lib/whs/insights/useHandicapInsights';
import { renderBoldMarkdown } from '@/lib/whs/insights/renderBoldMarkdown';
import { EchoCallout } from '../_shared/atoms';

const INK_06 = 'var(--hcp-bg-3)';
interface Props {
  connectionId: string;
}

export const TrendNarrativeSection: React.FC<Props> = ({ connectionId }) => {
  const { data: insights, isLoading } = useHandicapInsights(connectionId);

  if (isLoading && !insights) {
    return (
      <div
        className="animate-pulse"
        style={{
          height: 92,
          background: INK_06,
          borderRadius: 14,
          marginBottom: 14,
        }}
      />
    );
  }

  const narrative = insights?.trend_narrative?.trim();
  if (!narrative) return null;

  return (
    <EchoCallout
      context="YOUR TREND"
      body={<p style={{ margin: 0 }}>{renderBoldMarkdown(narrative)}</p>}
      marginBottom={14}
    />
  );
};

export default TrendNarrativeSection;
