import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Top100MapView from '@/components/courses/Top100MapView';
import { Top100MapScope } from '@/hooks/useTop100MapCourses';

/**
 * MapPage — standalone full-page map at /map
 * Exact match of Top100MapModal: same component, same full-screen layout, no chrome.
 * Back/close uses router history (navigate(-1)).
 */
const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const [scope, setScope] = useState<Top100MapScope>('global');

  return (
    <div className="h-[100dvh] w-full overflow-hidden">
      <Top100MapView
        scope={scope}
        onScopeChange={setScope}
        fullHeight
        onClose={() => navigate(-1)}
      />
    </div>
  );
};

export default MapPage;
