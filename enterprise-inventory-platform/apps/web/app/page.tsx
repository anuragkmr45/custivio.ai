const modules = ["Assets", "Stock", "Custody", "Maintenance", "Audits", "Reports", "Admin"];

export default function HomePage() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <h1 className="topbar__title">Enterprise Inventory Platform</h1>
        <p className="topbar__meta">Phase 1 scaffold with governed local services</p>
      </header>
      <section className="workspace">
        <aside className="sidebar" aria-label="Primary navigation">
          <div className="sidebar__section">Modules</div>
          <nav>
            <ul className="nav-list">
              {modules.map((moduleName, index) => (
                <li key={moduleName}>
                  <span
                    className={
                      index === 0 ? "nav-list__item nav-list__item--active" : "nav-list__item"
                    }
                  >
                    {moduleName}
                  </span>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <section className="main-panel" aria-label="Dashboard">
          <div className="dashboard-grid">
            <article className="metric">
              <p className="metric__label">Governance</p>
              <p className="metric__value">Ready</p>
            </article>
            <article className="metric">
              <p className="metric__label">Runtime</p>
              <p className="metric__value">Local</p>
            </article>
            <article className="metric">
              <p className="metric__label">Auth</p>
              <p className="metric__value">Phase 3</p>
            </article>
          </div>
          <article className="panel">
            <h2>Foundation status</h2>
            <p>
              The scaffold defines the monorepo boundaries, local infrastructure, health checks,
              initial Drizzle schema, and engineering guardrails for the implementation phases.
            </p>
          </article>
        </section>
      </section>
    </main>
  );
}
