import React from 'react';

class TutorialErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('Tutorial system error:', error, errorInfo);
    
    // You could also log the error to an error reporting service here
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI - just render children without tutorial
      console.log('Rendering without tutorial due to error');
      return this.props.children;
    }

    return this.props.children;
  }

  componentDidUpdate(prevProps) {
    // Reset error boundary when props change (e.g., new tutorial)
    if (this.state.hasError && prevProps.tutorialType !== this.props.tutorialType) {
      this.setState({ hasError: false, error: null });
    }
  }
}

export default TutorialErrorBoundary; 