import { useParams, useNavigate } from 'react-router-dom';
import { isMockChannelsEnabled, getMockChannel } from '@/mocks/channel-profile.mock';
import ChannelHeader from '@/components/channels/ChannelHeader';
import ChannelTabs from '@/components/channels/ChannelTabs';
import { useEffect, useState } from 'react';

export default function ChannelProfile() {
  const { slug = 'clbhouz-demo' } = useParams();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<ReturnType<typeof getMockChannel> | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        if (isMockChannelsEnabled) {
          // Mock data for development/testing only
          const mock = getMockChannel(slug);
          if (mounted) setChannel(mock);
        } else {
          // TODO: Implement real channel fetch from Supabase
          // For now, redirect to discover page since channels aren't live yet
          nav('/discover', { replace: true });
          return;
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  if (loading || !channel) {
    return <ChannelHeader.Skeleton />;
  }

  return (
    <div className="min-h-screen bg-elev-0">
      <ChannelHeader channel={channel} onBack={() => nav(-1)} />
      <ChannelTabs channel={channel} />
    </div>
  );
}
