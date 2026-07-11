import { useState } from 'react';
import { Search } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { SearchOverlayV2 } from '@/features/search-v2/SearchOverlayV2';
import { DestinationDoors } from './components/DestinationDoors';
import { HubVideoRow } from './components/HubVideoRow';

const FONT_FAMILY =
  'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export default function WatchHubV2() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <PageRoot className="min-h-screen text-foreground bg-background">
      <main
        style={{
          paddingBottom: 80,
          paddingTop: 'var(--chrome-total-h, 0px)',
        }}
      >
        <div
          style={{
            padding: '4px 16px 8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: FONT_FAMILY,
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: 24,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: '#0F172A',
              fontFamily: FONT_FAMILY,
            }}
          >
            Watch
          </div>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            style={{
              width: 38,
              height: 38,
              borderRadius: 999,
              border: '1px solid rgba(0,0,0,0.07)',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <Search size={16} color="#0F172A" />
          </button>
        </div>

        <DestinationDoors />

        {/* W2.2: video row mounts here */}
        {/* W2.3: clips row mounts here */}
        {/* W2.4: mixed grid mounts here */}
        {/* W2.5: chip bar mounts here */}
      </main>

      <SearchOverlayV2
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </PageRoot>
  );
}
