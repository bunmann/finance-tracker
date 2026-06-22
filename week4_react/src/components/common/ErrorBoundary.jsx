// ============================================================================
// File: ErrorBoundary.jsx
// Description: Class component that catches rendering errors in child components
//              and renders a fallback error UI instead of crashing the app.
// ============================================================================
import { Component } from 'react';

/**
 * Component: ErrorBoundary
 * Description: Class-based React component wrapper that catches JavaScript runtime errors 
 *              anywhere in its child component tree, logging errors and rendering a fallback UI.
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    /**
     * Function: getDerivedStateFromError
     * Description: Static lifecycle method invoked after a descendant component throws an error,
     *              returning the state update object to render the fallback UI.
     * Parameters:
     *   - error (Error): The error thrown.
     * Returns:
     *   - Object: State update object.
     */
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    /**
     * Function: componentDidCatch
     * Description: Lifecycle method invoked after an error has been caught by the boundary,
     *              allowing logging of stack traces or reporting to error aggregation services.
     * Parameters:
     *   - error (Error): The error thrown.
     *   - errorInfo (Object): Stack trace metadata info.
     */
    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <h2>Something went wrong</h2>
                    <p>An unexpected error occurred. Please try refreshing the page.</p>
                    <button onClick={() => this.setState({ hasError: false })}>
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;