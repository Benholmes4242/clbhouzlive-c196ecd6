import { CHIP_GLASS_BG, CHIP_GLASS_BORDER } from '@/styles/photoScrim';
const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

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
        background: CHIP_GLASS_BG,
        border: CHIP_GLASS_BORDER,
        color: isClip ? '#F7931E' : '#fff',
      }}
    >
      {isClip ? 'CLIP' : 'VIDEO'}
    </div>
  );
}

export default FormatBadge;
