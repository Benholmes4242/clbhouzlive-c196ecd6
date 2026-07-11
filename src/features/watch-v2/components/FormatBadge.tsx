const FONT_FAMILY =
  'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

interface Props {
  format: 'clip' | 'video';
}

export function FormatBadge({ format }: Props) {
  const isClip = format === 'clip';
  return (
    <div
      style={{
        position: 'absolute',
        top: 6,
        left: 6,
        borderRadius: 5,
        padding: '2px 6px',
        fontWeight: 700,
        fontSize: 8.5,
        letterSpacing: '0.09em',
        fontFamily: FONT_FAMILY,
        background: isClip ? 'rgba(247,147,30,0.94)' : 'rgba(15,23,42,0.82)',
        color: isClip ? '#0b0d12' : '#fff',
      }}
    >
      {isClip ? 'CLIP' : 'VIDEO'}
    </div>
  );
}

export default FormatBadge;
