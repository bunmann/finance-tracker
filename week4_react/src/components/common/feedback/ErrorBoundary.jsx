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
                <div className="error-boundary" style={{ padding: '24px', textAlign: 'center' }}>
                    <h2>Something went wrong</h2>
                    <p style={{ color: '#EF4444', fontFamily: 'monospace', fontSize: '14px', margin: '12px 0' }}>
                        {this.state.error?.toString()}
                    </p>
                    {this.state.error?.stack && (
                        <pre style={{ textAlign: 'left', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '8px', fontSize: '11px', overflowX: 'auto', maxHeight: '200px', margin: '12px 0' }}>
                            {this.state.error.stack}
                        </pre>
                    )}
                    <button onClick={() => this.setState({ hasError: false, error: null })}>
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;