import { MockChannel } from '@/mocks/channel-profile.mock';

export default function ChannelHeader({
  channel, onBack,
}: { channel: MockChannel; onBack?: () => void }) {
  return (
    <header className="px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4">
      <div className="flex items-start justify-between gap-3">
        {/* Left: Avatar + meta */}
        <div className="flex items-start gap-3 md:gap-4">
          <img
            src={channel.avatar}
            alt={`${channel.name} avatar`}
            className="h-14 w-14 md:h-16 md:w-16 rounded-full object-cover"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-semibold">{channel.name}</h1>
              {channel.verified && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs border border-emerald-200">
                  Verified
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {new Intl.NumberFormat().format(channel.subscribers)} subscribers · {channel.videos.length} videos
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">
              {channel.location} · {channel.createdAt}
            </div>
          </div>
        </div>

        {/* Right: Subscribe */}
        <button
          className="rounded-full px-4 py-2 text-sm font-medium bg-black text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-300/50 shrink-0"
          aria-label="Subscribe"
        >
          Subscribe
        </button>
      </div>

      {/* Bio/description */}
      {channel.description && (
        <p className="mt-3 text-sm md:text-base text-foreground/80 leading-relaxed max-w-3xl">
          {channel.description}
        </p>
      )}

      {/* Divider */}
      <div className="h-px bg-border/80 mt-3 md:mt-4" />
    </header>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4">
      <div className="flex items-start gap-3 md:gap-4">
        <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-muted/40" />
        <div className="flex-1">
          <div className="h-6 w-64 bg-muted/40 rounded" />
          <div className="mt-2 h-4 w-40 bg-muted/30 rounded" />
          <div className="mt-1 h-4 w-32 bg-muted/30 rounded" />
        </div>
      </div>
      <div className="mt-3 h-4 w-full max-w-3xl bg-muted/30 rounded" />
      <div className="h-px bg-border/80 mt-3 md:mt-4" />
    </div>
  );
}
ChannelHeader.Skeleton = Skeleton;
