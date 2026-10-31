import { ORG, SNAPSHOT_DATE, SNAPSHOT_TZ } from "../data/snapshot";
import { Explorer } from "../components/Explorer";
import { Insights, KpiGrid } from "../components/Overview";

export function Dashboard() {
  return (
    <div className="page">
      <div className="page__inner">
        <header className="header">
          <div className="header__titles">
            <div className="header__prompt">root@{ORG.toLowerCase()}:~$ action1 report --org {ORG}</div>
            <h1 className="header__title">
              &gt; Endpoint security posture
              <span className="cursor" aria-hidden="true" />
            </h1>
          </div>
          <div className="header__meta">
            Snapshot {SNAPSHOT_DATE} · {SNAPSHOT_TZ}
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
