import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { scrollPageToTop } from '@/lib/getScrollParent';

const ScrollToTop = () => {
  const location = useLocation();
  const { pathname } = location;
  const navigationType = useNavigationType();
  const hasBackgroundLocation = Boolean((location.state as { backgroundLocation?: unknown } | null)?.backgroundLocation);

  useEffect(() => {
    // Only scroll to top on PUSH navigation (user clicked a link/button)
    // Skip on POP (back/forward) so ScrollRestoration can restore position
    // Skip on REPLACE as well (tab changes, redirects)
    if (navigationType === 'PUSH' && !hasBackgroundLocation) {
      scrollPageToTop('auto');
    }
  }, [pathname, navigationType, hasBackgroundLocation]);

  return null;
};

export default ScrollToTop;
