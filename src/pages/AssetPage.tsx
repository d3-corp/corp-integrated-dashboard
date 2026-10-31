import { useEffect } from "react";
import { Link, useParams } from "react-router";
import { findEndpoint, ORG, runsForEndpoint, SNAPSHOT_DATE } from "../data/snapshot";
import { GridHead, GridRow, GridTable, Panel, Pill, RUN_BAR, RUN_TONE, Track } from "../components/ui";

const BACK_TO_ASSETS = "/?tab=assets";
const RUN_COLS = "2.6fr 1.8fr 0.7fr 1.2fr 1.2fr 0.9fr 1.2fr";

function Facts({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="facts">
      {rows.map(([k, v]) => (
        <div key={k} className="facts__row">
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function BackLink() {
  return (
    <Link to={BACK_TO_ASSETS} className="back-link">
      <span aria-hidden="true">←</span> All assets
    </Link>
  );
}

export function AssetPage() {
  const { hostname = "" } = useParams();
  const e = findEndpoint(hostname);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [hostname]);

  if (!e) {
    return (
      <div className="page">
        <div className="page__inner">
          <BackLink />
          <h1 className="header__title">&gt; Endpoint not found</h1>
          <p className="fg-muted">No endpoint named “{hostname}” in the {SNAPSHOT_DATE} snapshot.</p>
        </div>
      </div>
    );
  }

  const endpointRuns = runsForEndpoint(e);
  const failed = endpointRuns.filter((r) => r.run.status === "Error").length;

  const kpis = [
    { label: "Agent status", value: e.online ? "Online" : "Offline", tone: e.online ? "fg-text" : "fg-muted", sub: `Last seen ${e.lastSeen}` },
    { label: "Reboot", value: e.rebootPending ? "Pending" : "Not needed", tone: e.rebootPending ? "fg-warn" : "fg-muted", sub: e.rebootPending ? "Restart to finish installing updates" : "No restart waiting" },
    { label: "Policy runs", value: String(endpointRuns.length), tone: "fg-text", sub: `${endpointRuns.filter((r) => r.via === "direct").length} direct · ${endpointRuns.filter((r) => r.via === "group").length} via group` },
    { label: "Failed runs", value: String(failed), tone: failed ? "fg-danger" : "fg-muted", sub: "since 13 Oct" },
  ];

  return (
    <div className="page">
      <div className="page__inner">
        <BackLink />

        <header className="header">
          <div className="header__titles">
            <div className="header__prompt">root@{ORG.toLowerCase()}:~$ action1 endpoint show "{e.name}"</div>
            <h1 className="header__title c-break">
              &gt; {e.name}
              <span className="cursor" aria-hidden="true" />
            </h1>
            <div className="header__tags">
              <Pill tone={e.online ? "ok" : "neutral"}>{e.online ? "Online" : "Offline"}</Pill>
              {e.isServer && <Pill tone="run">Server</Pill>}
              {e.rebootPending && <Pill tone="warn">Reboot pending</Pill>}
            </div>
          </div>
          <div className="header__meta">Snapshot {SNAPSHOT_DATE}</div>
        </header>

        <section aria-label="Endpoint status" className="kpis">
          {kpis.map((k) => (
            <Panel key={k.label} className="kpi">
              <div className="kpi__label">{k.label}</div>
              <div className={`kpi__value ${k.tone}`}>{k.value}</div>
              <div className="kpi__sub">{k.sub}</div>
            </Panel>
          ))}
        </section>

        <section className="insights">
          <Panel title="Device">
            <Facts rows={[["User", e.user], ["Operating system", e.os], ["Group", e.group], ["Agent version", e.agentVersion]]} />
          </Panel>
          <Panel title="Hardware">
            <Facts rows={[["Manufacturer", e.manufacturer], ["CPU", e.cpu], ["Memory", e.ram], ["Disks", e.disk], ["Serial", e.serial]]} />
          </Panel>
          <Panel title="Network">
            <Facts rows={[["IP address", e.ip], ["Last seen", e.lastSeen], ["Connectivity", e.online ? "Agent connected" : "Agent disconnected"]]} />
          </Panel>
        </section>

        <section className="explorer">
          <div className="section-head">
            <h2 className="panel__title">Policy runs</h2>
            <span className="toolbar__count">{endpointRuns.length} runs</span>
          </div>
          {endpointRuns.length === 0 ? (
            <div className="empty">No policy runs targeted this endpoint since 13 Oct.</div>
          ) : (
            <GridTable minWidth={1040}>
              <GridHead cols={RUN_COLS} headers={["Policy run", "Target", "Via", "Started", "Finished", "Status", "Progress"]} />
              {endpointRuns.map(({ run: r, via }, i) => (
                <GridRow key={`${r.name}-${r.started}-${i}`} cols={RUN_COLS}>
                  <span className="c-strong">{r.name}</span>
                  <span className="c-2">{r.target}</span>
                  <span className="c-2">{via === "direct" ? "Direct" : "Group"}</span>
                  <span className="c-code c-2">{r.started}</span>
                  <span className="c-code c-2">{r.finished}</span>
                  <span><Pill tone={RUN_TONE[r.status]}>{r.status}</Pill></span>
                  <span className="progress">
                    <Track thin pct={r.progress} fillClass={RUN_BAR[r.status]} />
                    <span className="progress__pct">{r.progress}%</span>
                  </span>
                </GridRow>
              ))}
            </GridTable>
          )}
        </section>

        <footer className="footer">
          Missing updates and installed software aren't shown per endpoint: the Action1 connector doesn't map them to
          individual endpoints. See the org-wide <Link to="/">Vulnerabilities</Link> and{" "}
          <Link to="/?tab=software">Installed software</Link> tabs. Group runs apply to every member of {e.group}; whether
          this endpoint was included in a group run's result isn't exposed.
        </footer>
      </div>
    </div>
  );
}
