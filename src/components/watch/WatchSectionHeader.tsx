interface WatchSectionHeaderProps {
  eyebrow: string;
  title: string;
  onSeeAll?: () => void;
  paddingTop?: number;
}

/**
 * Canonical eyebrow + title + see-all header for Watch surface sections.
 * 16px edge padding aligns with rail content padding for visual flush.
 */
export default function WatchSectionHeader({
  eyebrow,
  title,
  onSeeAll,
  paddingTop = 12,
}: WatchSectionHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        padding: `${paddingTop}px 16px 16px`,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#F7931E',
          }}
        >
          {eyebrow}
        </span>
        <span
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'hsl(var(--foreground))',
            lineHeight: 1.15,
          }}
        >
          {title}
        </span>
      </div>
      {onSeeAll && (
        <button
          onClick={onSeeAll}
          className="active:scale-[0.97] transition-transform"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#F7931E',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            padding: 0,
            marginBottom: 2,
          }}
        >
          See all →
        </button>
      )}
    </div>
  );
}
