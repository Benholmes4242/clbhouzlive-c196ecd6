/** CB50 Design A: shared presentation only; never a control. */
import React, { useEffect, useState } from 'react';
import { VideoEngine, type LaneId } from '@/video/VideoEngine';
import { ownerMatches } from '@/components/fullscreen-feed/scrubberMath';

export function BufferingSpinner({ laneId, ownerKey, active, fullscreen = false }: {
  laneId: LaneId | null; ownerKey: string | null; active: boolean; fullscreen?: boolean;
}) {
  const [buffering, setBuffering] = useState(false);
  useEffect(() => {
    setBuffering(false);
    if (!laneId || !active || !ownerKey) return;
    const unregister = VideoEngine.presentBuffering(laneId);
    const unsubscribe = VideoEngine.subscribe(laneId, (snap) => {
      setBuffering(snap.buffering && ownerMatches(snap.postId, ownerKey));
    });
    return () => { unsubscribe(); unregister(); };
  }, [laneId, ownerKey, active]);
  if (!active || !buffering) return null;
  return <div aria-hidden="true" className={`video-buffering-centre${fullscreen ? ' video-buffering-centre--fullscreen' : ''}`} data-video-buffering={fullscreen ? 'fullscreen' : 'inline'}>
    <div className={`video-buffering-arc${fullscreen ? ' video-buffering-arc--fullscreen' : ''}`} />
  </div>;
}