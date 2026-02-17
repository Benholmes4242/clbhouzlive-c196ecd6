import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // Only scroll to top on PUSH navigation (user clicked a link/button)
    // Skip on POP (back/forward) so ScrollRestoration can restore position
    // Skip on REPLACE as well (tab changes, redirects)
    if (navigationType === 'PUSH') {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }
  }, [pathname, navigationType]);

  return null;
};

export default ScrollToTop;
