import React, { useState } from 'react';
import { FindPlayerRow } from './pulse/FindPlayerRow';
import { PulseRail } from './pulse/PulseRail';
import { PlayerSearchSheet } from './pulse/PlayerSearchSheet';

interface Props {
  userId: string;
}

export const PulseSection: React.FC<Props> = ({ userId }) => {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      {/* The header comes first: PulseRail owns it, so the find row is passed
          in and rendered between the header and the rail in every state. */}
      <PulseRail
        userId={userId}
        onOpenSearch={() => setSearchOpen(true)}
        findRow={<FindPlayerRow onOpen={() => setSearchOpen(true)} />}
      />
      <PlayerSearchSheet open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default PulseSection;
