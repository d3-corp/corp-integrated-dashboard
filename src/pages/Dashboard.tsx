import { ORG, SNAPSHOT_DATE, SNAPSHOT_TZ } from "../data/snapshot";
import { useData } from "../data/source";
import { Explorer } from "../components/Explorer";
import { Insights, KpiGrid } from "../components/Overview";

export function Dashboard() {
  const { source, loading, error, fetchLive } = useData();
  const org = source.kind === "live" ? source.organization : ORG;
  const indicator =
    source.kind === "live"
      ? `Live data · ${source.organization} · fetched ${new Date(source.fetchedAt).toLocaleString()}`
      : `Test data · Snapshot ${SNAPSHOT_DATE} · ${SNAPSHOT_TZ}`;

  return (
    <div className="page">
      <div className="page__inner">
        <header className="header">
          <div className="header__titles">
            <div className="header__prompt">root@{org.toLowerCase()}:~$ action1 report --org {org}</div>
            <h1 className="header__title">
              &gt; Endpoint security posture
              <span className="cursor" aria-hidden="true" />
            </h1>
          </div>
          <div className="header__meta">
            <span className={`data-indicator data-indicator--${source.kind}`}>{indicator}</span>
            <button type="button" className="fetch-live" onClick={fetchLive} disabled={loading}>
              {loading ? "Fetching…" : "Fetch live data"}
            </button>
            {error && (
              <div className="fetch-live__error" role="alert">
                {error}
              </div>
            )}
          </div>
        </header>

        <KpiGrid />
        <Insights />
        <Explorer />

        <footer className="footer">
          Source: Action1 API via connector — organizations, endpoints (list + detail), missing updates, policies/automation
          runs. Status reflects agent connectivity at snapshot time. Per-endpoint software inventory and per-endpoint
          vulnerability mapping are not exposed by the connector.
        </footer>
      </div>
    </div>
  );
}
