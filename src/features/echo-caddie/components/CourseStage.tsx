/**
 * BRIEF_ECHO_CADDIE §2 / §3.1 — THE SCREEN IS THE COURSE.
 *
 * The venue's own photograph, full bleed, behind everything. Echo speaks over it.
 *
 * A MISSING PHOTOGRAPH IS NOT A STATE THAT GETS DRAWN. While the image is
 * loading, or if it fails, or if there is no image at all, this renders the
 * BLACK TREATMENT — never a grey placeholder, never a blurred box, never an
 * empty band. That is why the <img> is opacity 0 until it has decoded.
 */

import React, { useEffect, useState } from 'react';
import { EC } from '../tokens';

export type StageTone = 'ask' | 'answer';

export const CourseStage: React.FC<{
  imageUrl: string | null;
  tone: StageTone;
  /** Extra bottom lift under the composer / panel stack (§3.2). */
  lift?: boolean;
  children: React.ReactNode;
}> = ({ imageUrl, tone, lift = true, children }) => {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setReady(false);
    setFailed(false);
  }, [imageUrl]);

  const showPhoto = !!imageUrl && !failed;

  return (
    <div className="ec-root" style={{ background: EC.BLACK }}>
      {showPhoto && (
        <img
          src={imageUrl as string}
          alt=""
          aria-hidden
          decoding="async"
          className={ready ? 'ec-photo ec-photo--in' : 'ec-photo'}
          onLoad={() => setReady(true)}
          onError={() => setFailed(true)}
        />
      )}
      {/* The scrim only exists over media. On the black treatment it would be
          darkening black, so it is skipped entirely. */}
      {showPhoto && ready && (
        <>
          <div className={`ec-scrim ec-scrim--${tone}`} />
          {lift && <div className="ec-scrim ec-scrim--lift" />}
        </>
      )}
      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
};
