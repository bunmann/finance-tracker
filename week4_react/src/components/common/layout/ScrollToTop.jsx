// ============================================================================
// File: ScrollToTop.jsx
// Description: Utility component that resets window scroll position to the top
//              whenever the route pathname changes, ensuring users start at the
//              top when switching tabs or domain views.
// ============================================================================
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Component: ScrollToTop
 * Description: Listens to React Router location changes and scrolls the browser
 *              window to (0, 0) immediately upon navigation.
 */
function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}

export default ScrollToTop;
