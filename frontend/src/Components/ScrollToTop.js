import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scroll window to top on every route change (SPA navigation).
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}

export default ScrollToTop;
