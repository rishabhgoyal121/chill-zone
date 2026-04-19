export function AppLoader({ subtitle = 'Warming up your chill feed...' }) {
  return (
    <section className="app-loader" role="status" aria-live="polite">
      <div className="app-loader-card">
        <p className="app-loader-kicker">CHILL ZONE</p>
        <h1>Loading Your Lounge</h1>
        <p className="app-loader-subtitle">{subtitle}</p>
        <div className="app-loader-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </section>
  );
}
