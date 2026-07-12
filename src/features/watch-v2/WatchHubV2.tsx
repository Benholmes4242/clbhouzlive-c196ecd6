import { useState } from 'react';
import { PageRoot } from '@/components/layout/PageRoot';
import { DestinationDoors } from './components/DestinationDoors';
import { HubVideoRow } from './components/HubVideoRow';
import { HubClipsRow } from './components/HubClipsRow';
import { HubMixedGrid } from './components/HubMixedGrid';
import { HubChipBar } from './components/HubChipBar';

export default function WatchHubV2({ embedded = false }: { embedded?: boolean }) {
  const [filter, setFilter] = useState('all');

  const content = (
    <>
      <main
        style={{
          paddingBottom: 80,
          // .app-shell already pads by var(--sat); pad by --header-h ONLY so
          // we clear CompactHeader without inheriting --shell-extra-h from a
          // keep-alive page (Clubhouse tab bar) that's still mounted in the
          // background. This surface has no ShellSlot of its own.
          ...(embedded
            ? {}
            : { paddingTop: 'var(--header-h, 55px)' }),
        }}
      >
        {/* DestinationDoors are the first content — CompactHeader owns the
            page chrome (title + global search). Doors row provides its own
            10px top padding to sit under the fixed chrome. */}
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
    </>
  );

  if (embedded) return content;

  return (
    <PageRoot className="min-h-screen text-foreground bg-background">
      {content}
    </PageRoot>
  );
}
