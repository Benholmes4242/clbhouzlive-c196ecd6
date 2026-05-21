import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Medal, type LucideIcon } from 'lucide-react';
import SheetHeader from '@/components/ui/SheetHeader';
import { useUserLegendStatus } from '@/hooks/gam/useUserLegendStatus';
import { useUserTopLegends, type TopLegendRow } from '@/hooks/gam/useUserTopLegends';
import { Skeleton, RetryStub, EmptyStub } from '../_shared/GamAtoms';
import { GamSheet } from '../_shared/GamSheet';
import {
  legendCategoryLabel,
  legendCategoryIcon,
  formatLegendValue,
  relativeTime,
} from '@/lib/gam/visuals';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface LegendStatusSheetProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  readOnly?: boolean;
  friendName?: string;
}

interface LegendRowProps {
  row: TopLegendRow;
  onTap: () => void;
}

const LegendRow: React.FC<LegendRowProps> = ({ row, onTap }) => {
  const [pressed, setPressed] = React.useState(false);

  const valueLabel = formatLegendValue(row.category, row.value);
  const categoryLabel = legendCategoryLabel[row.category];
  const Icon = legendCategoryIcon[row.category];
  const time = relativeTime(row.attained_at);

  const meta =
    row.rank === 1
      ? `${categoryLabel} · ${valueLabel} · ${time}`
      : `#${row.rank} ${categoryLabel} · ${valueLabel}`;

  return (
    <div
      onClick={onTap}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      style={{
        background: 'var(--hcp-bg-1)',
        border: '1px solid var(--hcp-line)',
        borderRadius: 12,
        padding: 14,
        cursor: 'pointer',
        transform: pressed ? 'scale(0.995)' : 'scale(1)',
        transition: 'transform 120ms ease',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '34%',
          background: 'linear-gradient(135deg, var(--hcp-bg-3), var(--hcp-bg-2))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: 'var(--hcp-t-60)',
        }}
      >
        <Icon size={20} strokeWidth={2} color="var(--hcp-t-80)" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--hcp-t-100)',
            lineHeight: 1.3,
            marginBottom: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {row.course_name}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--hcp-t-60)',
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {meta}
        </div>
      </div>
    </div>
  );
};

const GroupHeader: React.FC<{
  Icon: LucideIcon | null;
  iconColor?: string;
  label: string;
  count: number;
}> = ({ Icon, iconColor, label, count }) => (
  <div
    style={{
      fontFamily: FONT,
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--hcp-t-60)',
      letterSpacing: '0.10em',
      textTransform: 'uppercase',
      marginTop: 24,
      marginBottom: 10,
      display: 'flex',
      alignItems: 'center',
    }}
  >
    {Icon && (
      <Icon
        size={14}
        strokeWidth={2.4}
        color={iconColor ?? 'var(--hcp-t-80)'}
        style={{ marginRight: 6, flexShrink: 0 }}
      />
    )}
    {label} ({count})
  </div>
);

function pluralTitles(n: number): string {
  return n === 1 ? '1 title' : `${n} titles`;
}

function computeSummary(
  legendTitles: number,
  podiumPositions: number,
  top10Positions: number,
  isOwnView: boolean,
  friendName?: string,
): { title: string; sub?: string } {
  const subject = isOwnView ? 'You' : friendName ?? 'They';
  const verbHold = isOwnView ? 'hold' : 'holds';
  const verbHaveNot = isOwnView ? "haven't" : "hasn't";

  if (legendTitles > 0) {
    const top3OnlyCount = Math.max(0, podiumPositions - legendTitles);
    const top10OnlyCount = Math.max(0, top10Positions - podiumPositions);
    const subParts: string[] = [];
    if (top3OnlyCount > 0) subParts.push(`top 3 in ${top3OnlyCount} more`);
    if (top10OnlyCount > 0) subParts.push(`top 10 in ${top10OnlyCount}`);
    return {
      title: `${subject} ${verbHold} ${pluralTitles(legendTitles)}`,
      sub: subParts.length > 0 ? subParts.join(' · ') : undefined,
    };
  }

  if (top10Positions > 0) {
    return {
      title: `${subject} ${verbHaveNot} claimed a title yet`,
      sub: `Top 10 at ${top10Positions} ${top10Positions === 1 ? 'course' : 'courses'}`,
    };
  }

  return { title: 'No titles yet' };
}

export const LegendStatusSheet: React.FC<LegendStatusSheetProps> = ({
  open,
  onClose,
  userId,
  readOnly = false,
  friendName,
}) => {
  const navigate = useNavigate();
  const statusQuery = useUserLegendStatus(open ? userId : undefined);
  const topLegendsQuery = useUserTopLegends(open ? userId : undefined, {
    limit: 50,
    maxRank: 10,
  });

  const isLoading = statusQuery.isLoading || topLegendsQuery.isLoading;
  const isError = statusQuery.isError || topLegendsQuery.isError;

  const status = statusQuery.data?.[0];
  const topLegends = topLegendsQuery.data ?? [];

  const isOwnView = !readOnly;

  const legends = topLegends.filter((r) => r.rank === 1);
  const podium = topLegends.filter((r) => r.rank === 2 || r.rank === 3);
  const top10 = topLegends.filter((r) => r.rank >= 4 && r.rank <= 10);

  const handleRowTap = (courseId: string) => {
    onClose();
    setTimeout(() => navigate(`/courses/${courseId}`), 100);
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <div
          style={{
            padding: '16px 16px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={72} radius={12} />
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div style={{ padding: 16 }}>
          <RetryStub
            message="Couldn't load Legend Status"
            onRetry={() => {
              statusQuery.refetch();
              topLegendsQuery.refetch();
            }}
          />
        </div>
      );
    }

    const noData = !status || Number(status.top_10_positions ?? 0) === 0;
    if (noData) {
      return (
        <div style={{ padding: 16 }}>
          <EmptyStub
            icon={<Crown size={48} color="#F7931E" style={{ opacity: 0.5 }} />}
            title="No titles yet"
            body="Play more rounds at the same course to climb the legend tables. Course Legends update every time someone posts a new round."
          />
        </div>
      );
    }

    return (
      <div style={{ padding: '0 16px 32px' }}>
        {legends.length > 0 && (
          <>
            <GroupHeader Icon={Crown} iconColor="#FBBC2E" label="Legend" count={legends.length} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {legends.map((row) => (
                <LegendRow
                  key={`${row.course_id}-${row.category}`}
                  row={row}
                  onTap={() => handleRowTap(row.course_id)}
                />
              ))}
            </div>
          </>
        )}

        {podium.length > 0 && (
          <>
            <GroupHeader Icon={Medal} iconColor="#C0C0C0" label="Top 3" count={podium.length} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {podium.map((row) => (
                <LegendRow
                  key={`${row.course_id}-${row.category}`}
                  row={row}
                  onTap={() => handleRowTap(row.course_id)}
                />
              ))}
            </div>
          </>
        )}

        {top10.length > 0 && (
          <>
            <GroupHeader Icon={null} label="Top 10" count={top10.length} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {top10.map((row) => (
                <LegendRow
                  key={`${row.course_id}-${row.category}`}
                  row={row}
                  onTap={() => handleRowTap(row.course_id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const summary = status
    ? computeSummary(
        Number(status.legend_titles ?? 0),
        Number(status.podium_positions ?? 0),
        Number(status.top_10_positions ?? 0),
        isOwnView,
        friendName,
      )
    : { title: 'Legend Status' };

  const eyebrow = isOwnView
    ? 'YOUR LEGEND STATUS'
    : `${(friendName ?? 'THEIR').toUpperCase()} LEGEND STATUS`;

  const headerTitle = isError ? "Couldn't load Legend Status" : summary.title;
  const headerSub = isError ? undefined : summary.sub;

  return (
    <GamSheet open={open} onClose={onClose}>
      <SheetHeader
        eyebrow={eyebrow}
        title={headerTitle}
        sub={headerSub}
        onClose={onClose}
        dark
      />
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{renderBody()}</div>
    </GamSheet>
  );
};

export default LegendStatusSheet;
