/**
 * Subtle hairline divider between Watch sections.
 * Goal: rhythm, not decoration.
 */
export default function WatchSectionDivider() {
  return (
    <div
      role="separator"
      aria-hidden="true"
      style={{
        margin: '24px 16px',
        height: 1,
        background: 'hsl(var(--border) / 0.4)',
      }}
    />
  );
}
