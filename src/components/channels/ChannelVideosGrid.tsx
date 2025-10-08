type Vid = {
  id: string; title: string; duration_seconds: number;
  views: number; created_at: string; thumbnailUrl: string; courseTag?: string;
};

export default function ChannelVideosGrid({ videos }: { videos: Vid[] }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
      {videos.map(v => (
        <article key={v.id} className="group">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-muted/30">
            <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover group-hover:scale-[1.02] transition" />
            <span className="absolute bottom-2 right-2 text-[11px] font-semibold px-1.5 py-0.5 rounded bg-black/80 text-white">
              {formatDuration(v.duration_seconds)}
            </span>
          </div>
          <h3 className="mt-2 line-clamp-2 font-medium">{v.title}</h3>
          <p className="text-sm text-muted-foreground">
            {Intl.NumberFormat().format(v.views)} views · {new Date(v.created_at).toLocaleDateString()}
          </p>
        </article>
      ))}
    </div>
  );
}

function formatDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`;
}
