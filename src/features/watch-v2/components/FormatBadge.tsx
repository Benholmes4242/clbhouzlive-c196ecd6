const FONT_FAMILY =
  'SF Pro, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

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
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        color: isClip ? '#F7931E' : '#fff',
      }}
    >
      {isClip ? 'CLIP' : 'VIDEO'}
    </div>
  );
}

export default FormatBadge;
