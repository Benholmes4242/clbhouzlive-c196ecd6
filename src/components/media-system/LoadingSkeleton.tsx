/**
 * LoadingSkeleton — fullscreen dark shimmer while video loads.
 * Fades out (200ms) when video fires canplay.
 */
export function LoadingSkeleton({ visible }: { visible: boolean }) {
  return (
    <div
      className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className="w-full h-full"
        style={{
          background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
        }}
      >
        <div
          className="w-full h-full"
          style={{
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.0) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.0) 75%)',
            backgroundSize: '200% 100%',
            animation: 'media-shimmer 1.5s infinite ease-in-out',
          }}
        />
      </div>
      <style>{`
        @keyframes media-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
