import { Link } from "react-router";
import type { Endpoint, PolicyRun, Update } from "../data/snapshot";
import { assetPath, cveUrl, severityLabel } from "../data/snapshot";
import { GridHead, GridRow, GridTable, Pill, RUN_BAR, RUN_TONE, SEVERITY_TONE, SLA_TEXT, Track } from "./ui";

const ASSET_COLS = "1.6fr 1.3fr 1.2fr 0.8fr 1.1fr 1.2fr 1.6fr 0.6fr 1fr 0.7fr";

export function AssetsTable({ rows }: { rows: Endpoint[] }) {
  return (
    <GridTable minWidth={1180}>
      <GridHead cols={ASSET_COLS} headers={["Hostname", "User", "OS", "Status", "IP address", "Last seen", "CPU", "RAM", "Group", "Reboot"]} />
      {rows.map((a) => (
        <GridRow key={a.name} cols={ASSET_COLS} className="grid-row--link">
          <Link to={assetPath(a.name)} className="row-link c-strong c-code c-break">{a.name}</Link>
          <span className="c-2">{a.user}</span>
          <span className="c-2">{a.os}</span>
          <span className={`status ${a.online ? "fg-text" : "fg-muted"}`}>
            <span className={`status__dot ${a.online ? "bg-text" : "bg-dim"}`} aria-hidden="true" />
            {a.online ? "Online" : "Offline"}
          </span>
          <span className="c-code c-2">{a.ip}</span>
          <span className="c-code c-2">{a.lastSeen}</span>
          <span className="c-2">{a.cpu}</span>
          <span className="c-2">{a.ram}</span>
          <span className="c-2">{a.group}</span>
          <span className={`c-strong ${a.rebootPending ? "fg-warn" : "fg-muted"}`}>{a.rebootPending ? "Pending" : "No"}</span>
        </GridRow>
      ))}
    </GridTable>
  );
}

const SOFTWARE_COLS = "2fr 1.6fr 1.3fr 0.9fr 0.7fr 0.9fr 1fr";

export function SoftwareTable({ rows }: { rows: Update[] }) {
  return (
    <>
      <div className="intro">
        Third-party applications Action1 detects on your endpoints and tracks for updates. Version shown is the latest available from Action1.
      </div>
      <GridTable minWidth={960}>
        <GridHead withTop cols={SOFTWARE_COLS} headers={["Application", "Vendor", "Latest version", "Severity", "CVEs", "SLA", "Deadline"]} />
        {rows.map((s) => (
          <GridRow key={s.id} cols={SOFTWARE_COLS}>
            <span className="c-strong">{s.name}</span>
            <span className="c-2">{s.vendor}</span>
            <span className="c-code c-2">{s.version}</span>
            <span><Pill tone={SEVERITY_TONE[s.severity]}>{severityLabel(s.severity)}</Pill></span>
            <span className="c-code c-strong">{s.cves.length}</span>
            <span className={`c-strong ${SLA_TEXT[s.sla]}`}>{s.sla}</span>
            <span className="c-code c-2">{s.deadline}</span>
          </GridRow>
        ))}
      </GridTable>
    </>
  );
}

const VULN_COLS = "24px 3fr 1.2fr 0.8fr 0.9fr 0.7fr 0.9fr 1fr";

export function VulnsTable({ rows, openId, onToggle }: { rows: Update[]; openId: string; onToggle: (id: string) => void }) {
  return (
    <GridTable minWidth={1040}>
      <GridHead cols={VULN_COLS} headers={["", "Update", "Vendor", "Type", "Severity", "CVEs", "SLA", "Deadline"]} />
      {rows.map((v) => {
        const isOpen = openId === v.id;
        return (
          <div key={v.id} className="expandable">
            <button
              type="button"
              className="grid-row grid-row--button"
              style={{ gridTemplateColumns: VULN_COLS }}
              aria-expanded={isOpen}
              onClick={() => onToggle(v.id)}
            >
              <span className="fg-muted" aria-hidden="true">{isOpen ? "−" : "+"}</span>
              <span className="c-strong">{v.name}</span>
              <span className="c-2">{v.vendor}</span>
              <span className="c-2">{v.type}</span>
              <span><Pill tone={SEVERITY_TONE[v.severity]}>{severityLabel(v.severity)}</Pill></span>
              <span className="c-code c-strong">{v.cves.length}</span>
              <span className={`c-strong ${SLA_TEXT[v.sla]}`}>{v.sla}</span>
              <span className="c-code c-2">{v.deadline}</span>
            </button>
            {isOpen && (
              <div className="details">
                <div className="details__facts">
                  <span>KB: <strong>{v.kb}</strong></span>
                  <span>Version: <strong>{v.version}</strong></span>
                  <span>Released: <strong>{v.released}</strong></span>
                </div>
                {v.cves.length > 0 ? (
                  <div className="chips">
                    {v.cves.map((c) => (
                      <a key={c} className="cve-link" href={cveUrl(c)} target="_blank" rel="noopener noreferrer">{c}</a>
                    ))}
                  </div>
                ) : (
                  <div className="fg-muted">No CVE references published by Action1 for this update.</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </GridTable>
  );
}

const RUN_COLS = "2.6fr 1.8fr 1.2fr 1.2fr 0.9fr 1.2fr";

export function RunsTable({ rows }: { rows: PolicyRun[] }) {
  return (
    <GridTable minWidth={1000}>
      <GridHead cols={RUN_COLS} headers={["Policy run", "Target", "Started", "Finished", "Status", "Progress"]} />
      {rows.map((r, i) => (
        <GridRow key={`${r.name}-${r.started}-${i}`} cols={RUN_COLS}>
          <span className="c-strong">{r.name}</span>
          <span className="c-2">{r.target}</span>
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
  );
}
