import { useState } from 'react';
import { Search } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { SearchOverlayV2 } from '@/features/search-v2/SearchOverlayV2';
import { DestinationDoors } from './components/DestinationDoors';
import { HubVideoRow } from './components/HubVideoRow';
import { HubClipsRow } from './components/HubClipsRow';
import { HubMixedGrid } from './components/HubMixedGrid';
import { HubChipBar } from './components/HubChipBar';

const FONT_FAMILY =
  'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export default function WatchHubV2({ embedded = false }: { embedded?: boolean }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [filter, setFilter] = useState('all');

  const content = (
    <>
      <main
        style={{
          paddingBottom: 80,
          // .app-shell already pads by var(--sat); --chrome-total-h also
          // includes --sat, which stacks a second safe-area gap on device
          // (invisible in browser preview where sat=0). Subtract it out.
          ...(embedded
            ? {}
            : { paddingTop: 'calc(var(--chrome-total-h, 0px) - var(--sat, 0px))' }),
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

        <div style={{ paddingTop: 12 }}>
          <HubChipBar active={filter} onChange={setFilter} />
        </div>

        <div style={{ paddingTop: 16 }}>
          <HubVideoRow />
        </div>
        <div style={{ paddingTop: 22 }}>
          <HubClipsRow />
        </div>
        <div style={{ paddingTop: 24, paddingBottom: 30 }}>
          <HubMixedGrid filter={filter} />
        </div>
      </main>

      <SearchOverlayV2
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );

  if (embedded) return content;

  return (
    <PageRoot className="min-h-screen text-foreground bg-background">
      {content}
    </PageRoot>
  );
}
