import React, { useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { useSearchParams } from 'react-router-dom';
import Clubhouse from './Clubhouse';

const ClubhouseWrapped = () => {
  const { setVariant } = useHeader();
  const [searchParams] = useSearchParams();
  const showGlass = searchParams.get('glass') === 'true';

  useEffect(() => {
    setVariant('glass-dark');
  }, [setVariant]);

  return (
    <>
      <Clubhouse />
      {showGlass && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(120px)',
            WebkitBackdropFilter: 'blur(120px)',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  );
};

export default ClubhouseWrapped;