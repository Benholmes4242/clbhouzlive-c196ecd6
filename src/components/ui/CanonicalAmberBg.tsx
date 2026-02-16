/**
 * CanonicalAmberBg — Standard warm amber background with gradient overlay
 * Used across wizards, Hub, Echo, Messages, and Chat pages.
 * Solid #FFFBEB base + 3-stop even gradient: amber at 0%, white at 50%, white at 100%.
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
        backgroundColor: '#FFFBEB',
        backgroundImage: 'linear-gradient(to bottom, rgba(254,243,199,0.3), white, white)',
      }}
    />
  );
}
