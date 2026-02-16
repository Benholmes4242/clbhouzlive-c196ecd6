/**
 * CanonicalAmberBg — Standard warm amber background with gradient overlay
 * Used across wizards, Hub, Echo, Messages, and Chat pages.
 * Solid #FFFBEB base + linear-gradient(to bottom, rgba(254,243,199,0.3), white, white) overlay.
 */

interface CanonicalAmberBgProps {
  className?: string;
}

export function CanonicalAmberBg({ className = '' }: CanonicalAmberBgProps) {
  return (
    <div
      className={`fixed inset-0 ${className}`}
      aria-hidden="true"
      style={{
        backgroundColor: '#FEFDFB',
        backgroundImage: 'linear-gradient(to bottom, rgba(254,243,199,0.15) 0%, rgba(254,243,199,0.08) 30%, white 50%, white 100%)',
      }}
    />
  );
}
