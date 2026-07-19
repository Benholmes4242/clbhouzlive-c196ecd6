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
          paddingBottom: 88,
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

        <div style={{ height: 16 }} />

        <HubChipBar active={filter} onChange={setFilter} />

        <div style={{ paddingTop: 16 }}>
          <HubMixedGrid filter={filter} />
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
