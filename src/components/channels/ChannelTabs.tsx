import { useState } from 'react';
import { MockChannel } from '@/mocks/channel-profile.mock';
import ChannelVideosGrid from './ChannelVideosGrid';

const tabs = ['Home','Videos','Playlists','About'] as const;
type Tab = typeof tabs[number];

export default function ChannelTabs({ channel }: { channel: MockChannel }) {
  const [tab, setTab] = useState<Tab>('Home');

  return (
    <section className="mx-auto max-w-6xl px-4 pb-12">
      {/* Tabs */}
      <div role="tablist" className="mt-6 border-b border-border flex gap-6 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`pb-3 -mb-px text-sm font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-300/50 outline-none ${
              tab === t ? 'border-b-2 border-[color:var(--slate-secondary)] text-foreground' : 'text-muted-foreground'
            }`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-6">
        {tab === 'Home'   && <ChannelHome channel={channel} />}
        {tab === 'Videos' && <ChannelVideosGrid videos={channel.videos} />}
        {tab === 'Playlists' && <Empty msg="Playlists coming soon" />}
        {tab === 'About' && <About channel={channel} />}
      </div>
    </section>
  );
}

function ChannelHome({ channel }: { channel: MockChannel }) {
  const [hero, ...rest] = channel.videos;
  return (
    <div className="grid gap-6">
      {/* Hero */}
      <article className="grid sm:grid-cols-2 gap-4">
        <div className="aspect-video overflow-hidden rounded-lg">
          <img src={hero.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{hero.title}</h2>
          <p className="text-sm text-muted-foreground">
            {Intl.NumberFormat().format(hero.views)} views · {new Date(hero.created_at).toLocaleDateString()}
          </p>
          <button className="self-start rounded-full bg-black text-white text-sm px-4 py-2 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-300/50">
            Watch
          </button>
        </div>
      </article>

      {/* Recent uploads */}
      <ChannelVideosGrid videos={rest.slice(0, 8)} />
    </div>
  );
}

function About({ channel }: { channel: MockChannel }) {
  return (
    <div className="prose prose-sm max-w-none">
      <p>{channel.description}</p>
      <ul className="mt-4 text-sm">
        <li><strong>Location:</strong> {channel.location}</li>
        <li><strong>Joined:</strong> {channel.createdAt}</li>
      </ul>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="text-sm text-muted-foreground">{msg}</div>;
}
