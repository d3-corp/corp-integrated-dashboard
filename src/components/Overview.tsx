import { useMemo } from "react";
import { byRisk, SLA_ORDER } from "../data/snapshot";
import { useData } from "../data/source";
import { Panel, Pill, SLA_BAR, SLA_TONE, Track } from "./ui";

export function KpiGrid() {
  const { data, source } = useData();
  const { endpoints, updates, runs } = data;
  const since = source.kind === "test" ? " since 13 Oct" : "";

  const kpis = useMemo(() => {
    const online = endpoints.filter((e) => e.online).length;
    const servers = endpoints.filter((e) => e.isServer).length;
    const reboots = endpoints.filter((e) => e.rebootPending).length;
    const crit = updates.filter((u) => u.severity === "Critical").length;
    const imp = updates.filter((u) => u.severity === "Important").length;
    const withCve = updates.filter((u) => u.cves.length > 0).length;
    const uniqueCves = new Set(updates.flatMap((u) => u.cves)).size;
    const overdue = updates.filter((u) => u.sla === "Overdue").length;
    const runErrors = runs.filter((r) => r.status === "Error").length;

    return [
      { label: "Managed endpoints", value: endpoints.length, sub: `${online} online · ${endpoints.length - online} offline · ${servers} servers`, tone: "fg-text" },
      { label: "Critical updates", value: crit, sub: `${imp} more rated Important`, tone: "fg-danger" },
      { label: "Unique CVEs open", value: uniqueCves, sub: `across ${withCve} missing updates`, tone: "fg-danger" },
      { label: "Missing updates", value: updates.length, sub: `${overdue} past SLA deadline`, tone: "fg-text" },
      { label: "Reboot pending", value: reboots, sub: "endpoints awaiting restart", tone: "fg-warn" },
      { label: "Failed automations", value: runErrors, sub: `of ${runs.length} policy runs${since}`, tone: "fg-danger" },
    ];
  }, [endpoints, updates, runs, since]);

  return (
    <section aria-label="Key figures" className="kpis">
      {kpis.map((k) => (
        <Panel key={k.label} className="kpi">
          <div className="kpi__label">{k.label}</div>
          <div className={`kpi__value ${k.tone}`}>{k.value}</div>
          <div className="kpi__sub">{k.sub}</div>
        </Panel>
      ))}
    </section>
  );
}

function BarRow({ label, n, pct, fillClass }: { label: string; n: number; pct: number; fillClass?: string }) {
  return (
    <div className="bar-row">
      <span className="bar-row__label">{label}</span>
      <Track pct={pct} fillClass={fillClass} />
      <span className="bar-row__n">{n}</span>
    </div>
  );
}

export function Insights() {
  const { data } = useData();
  const { endpoints, updates } = data;
  const { osMix, slaMix, slaFoot, topRisk } = useMemo(() => {
    const osCount = new Map<string, number>();
    endpoints.forEach((e) => osCount.set(e.os, (osCount.get(e.os) ?? 0) + 1));
    const osMax = Math.max(...osCount.values());
    const osMix = [...osCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, n]) => ({ label, n, pct: Math.round((n / osMax) * 100) }));

    const slaCount = SLA_ORDER.map((sla) => updates.filter((u) => u.sla === sla).length);
    const slaMax = Math.max(...slaCount) || 1;
    const slaMix = SLA_ORDER.map((sla, i) => ({ sla, n: slaCount[i], pct: Math.round((slaCount[i] / slaMax) * 100) }));

    const win = updates.filter((u) => u.type === "Windows").length;
    const slaFoot = `${win} Windows/driver updates · ${updates.length - win} third-party app updates`;

    const topRisk = updates.filter((u) => u.severity !== "None").sort(byRisk).slice(0, 6);
    return { osMix, slaMix, slaFoot, topRisk };
  }, [endpoints, updates]);

  return (
    <section className="insights">
      <Panel title="Operating systems">
        {osMix.map((o) => (
          <BarRow key={o.label} {...o} />
        ))}
      </Panel>

      <Panel title="Missing updates by SLA">
        {slaMix.map((o) => (
          <BarRow key={o.sla} label={o.sla} n={o.n} pct={o.pct} fillClass={SLA_BAR[o.sla]} />
        ))}
        <div className="panel__foot">{slaFoot}</div>
      </Panel>

      <Panel title="Fix first">
        {topRisk.map((u) => (
          <div key={u.id} className="risk-row">
            <span className="risk-row__name">{u.name}</span>
            <span className="risk-row__meta">
              <span className="risk-row__cve">{u.cves.length} CVE</span>
              <Pill tone={SLA_TONE[u.sla]} small>{u.sla}</Pill>
            </span>
          </div>
        ))}
      </Panel>
    </section>
  );
}
