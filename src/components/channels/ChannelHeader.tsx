import { MockChannel } from '@/mocks/channel-profile.mock';

export default function ChannelHeader({
  channel, onBack,
}: { channel: MockChannel; onBack?: () => void }) {
  return (
    <header className="relative">
      {/* Banner */}
      <div className="relative h-40 sm:h-56 md:h-64 w-full overflow-hidden">
        <img src={channel.banner} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/0 to-black/30" />
      </div>

      {/* Content row */}
      <div className="mx-auto -mt-9 sm:-mt-10 px-4 max-w-6xl">
        <div className="flex items-end gap-4">
          <img
            src={channel.avatar}
            alt={`${channel.name} avatar`}
            className="h-20 w-20 rounded-full ring-4 ring-white/90 shadow-md object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-semibold">{channel.name}</h1>
              {channel.verified && (
                <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {new Intl.NumberFormat().format(channel.subscribers)} subscribers · {channel.videos.length} videos
            </p>
          </div>
          <button
            className="rounded-full px-4 py-2 text-sm font-medium bg-black text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-300/50"
            aria-label="Subscribe"
          >
            Subscribe
          </button>
        </div>

        <p className="mt-3 text-sm text-foreground/80 max-w-3xl">{channel.description}</p>
        <div className="mt-2 text-xs text-muted-foreground">
          {channel.location} · {channel.createdAt}
        </div>
      </div>
    </header>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-56 w-full bg-muted/30" />
      <div className="mx-auto -mt-9 px-4 max-w-6xl">
        <div className="h-20 w-20 rounded-full bg-muted/40 ring-4 ring-white/80" />
        <div className="mt-4 h-6 w-64 bg-muted/40 rounded" />
        <div className="mt-2 h-4 w-40 bg-muted/30 rounded" />
      </div>
    </div>
  );
}
ChannelHeader.Skeleton = Skeleton;
