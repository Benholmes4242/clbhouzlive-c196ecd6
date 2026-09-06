import { useState } from 'react';
import { PageRoot } from '@/components/layout/PageRoot';
import { GlassHeaderPlate } from '@/components/chrome/GlassHeaderPlate';
import { DestinationDoors } from './components/DestinationDoors';
import { HubVideoRow } from './components/HubVideoRow';
import { HubClipsRow } from './components/HubClipsRow';
import { HubMixedGrid } from './components/HubMixedGrid';
import { HubChipBar } from './components/HubChipBar';

export default function WatchHubV2({ embedded = false }: { embedded?: boolean }) {
  const [filter, setFilter] = useState('all');

  const content = (
    <>
      {!embedded && <GlassHeaderPlate />}
      <main
        style={{
          paddingBottom: 'var(--bottom-nav-height, 96px)',
          // Bleed route: --header-h publishes 0 and .app-shell no longer pads
          // --sat, so the page owns top clearance for the floating island.
          ...(embedded
            ? {}
            : { paddingTop: 'calc(env(safe-area-inset-top, 0px) + 62px)' }),
        }}
      >
        {/* DestinationDoors are the first content — CompactHeader owns the
            page chrome (title + global search). Doors row provides its own
            10px top padding to sit under the fixed chrome. */}
        <DestinationDoors />

        <div style={{ paddingTop: 24 }}>
          <HubVideoRow />
        </div>
        <div style={{ paddingTop: 24 }}>
          <HubClipsRow />
        </div>

        <div style={{ paddingTop: 32 }}>
          <HubMixedGrid filter={filter}>
            <HubChipBar active={filter} onChange={setFilter} />
          </HubMixedGrid>
        </div>
      </main>
    </>
  );

  if (embedded) return content;

  return (
    <PageRoot className="min-h-screen text-foreground bg-background">
      {content}
    </PageRoot>
  );
}
