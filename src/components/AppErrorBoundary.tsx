import { Component, type ReactNode } from 'react'

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children

    return <main className="login-screen">
      <section className="panel login-panel" role="alert">
        <h1>CloudLedger couldn’t load</h1>
        <p>Reload the page to retry.</p>
        <button className="button button-primary" onClick={() => window.location.reload()}>Reload page</button>
      </section>
    </main>
  }
}
