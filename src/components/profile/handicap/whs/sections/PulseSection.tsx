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
      <FindPlayerRow onOpen={() => setSearchOpen(true)} />
      <PulseRail userId={userId} onOpenSearch={() => setSearchOpen(true)} />
      <PlayerSearchSheet open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default PulseSection;
