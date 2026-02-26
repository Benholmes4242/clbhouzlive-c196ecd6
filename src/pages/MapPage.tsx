import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Top100MapView from '@/components/courses/Top100MapView';
import { Top100MapScope } from '@/hooks/useTop100MapCourses';
import { PageRoot } from '@/components/layout/PageRoot';

/**
 * MapPage — standalone full-page map at /map
 * Reuses Top100MapView with global scope.
 * Bottom nav remains visible; back chevron uses history.back().
 */
const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const [scope, setScope] = useState<Top100MapScope>('global');

  return (
    <PageRoot className="h-[100dvh] overflow-hidden" hasBottomNav={false}>
      <Top100MapView
        scope={scope}
        onScopeChange={setScope}
        fullHeight
        onClose={() => navigate(-1)}
      />
    </PageRoot>
  );
};

export default MapPage;
