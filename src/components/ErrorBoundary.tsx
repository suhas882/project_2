import { Component, type ErrorInfo, type ReactNode } from 'react';

/* Keeps one broken screen from blanking the whole app. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Remitra screen error', error, info.componentStack); }
  componentDidUpdate(prev: { resetKey?: string }) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="card mx-auto max-w-xl p-6">
        <h1 className="text-xl font-bold">Something went wrong on this screen</h1>
        <p className="mt-2 text-ink-2">Your data is safe. Try another screen, or reload the page.</p>
        <pre className="mt-3 max-h-40 overflow-auto rounded-xl bg-canvas p-3 text-xs">{this.state.error.message}</pre>
        <button className="mt-4 min-h-11 rounded-xl bg-brand px-4 font-semibold text-white" onClick={() => location.reload()}>Reload</button>
      </div>
    );
  }
}
