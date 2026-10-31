import { useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import type { Endpoint, PolicyRun, RunStatus, Sla, Update } from "../data/snapshot";
import { byRisk, endpoints, runs, thirdPartyApps, updates } from "../data/snapshot";
import { AssetsTable, RunsTable, SoftwareTable, VulnsTable } from "./Tables";

type TabKey = "vulns" | "software" | "assets" | "policies";
type Filter<T> = { key: string; label: string; test: (x: T) => boolean };

const SEVERITY_FILTERS: Filter<Update>[] = [
  { key: "risk", label: "Critical + Important", test: (u) => u.severity !== "None" },
  { key: "critical", label: "Critical", test: (u) => u.severity === "Critical" },
  { key: "cve", label: "Has CVE", test: (u) => u.cves.length > 0 },
  { key: "all", label: "All updates", test: () => true },
];

const ASSET_FILTERS: Filter<Endpoint>[] = [
  { key: "all", label: "All", test: () => true },
  { key: "online", label: "Online", test: (a) => a.online },
  { key: "offline", label: "Offline", test: (a) => !a.online },
  { key: "servers", label: "Servers", test: (a) => a.isServer },
  { key: "reboot", label: "Reboot pending", test: (a) => a.rebootPending },
];

const RUN_FILTERS: Filter<PolicyRun>[] = [
  { key: "all", label: "All runs", test: () => true },
  ...(["Error", "Warning", "Success", "Running"] as RunStatus[]).map((s) => ({
    key: s,
    label: s,
    test: (r: PolicyRun) => r.status === s,
  })),
];

const SLA_FILTERS: { key: "all" | Sla; label: string }[] = [
  { key: "all", label: "Any SLA" },
  { key: "Overdue", label: "Overdue" },
  { key: "Due soon", label: "Due soon" },
  { key: "Due later", label: "Due later" },
];

const contains = (q: string, ...fields: string[]) => !q || fields.some((f) => f.toLowerCase().includes(q));

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="chip" aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

function FilterChips<T>({ filters, all, value, onChange }: { filters: Filter<T>[]; all: T[]; value: string; onChange: (k: string) => void }) {
  return (
    <div className="chips">
      {filters.map((f) => (
        <Chip key={f.key} on={value === f.key} onClick={() => onChange(f.key)}>
          {f.label} · {all.filter(f.test).length}
        </Chip>
      ))}
    </div>
  );
}

const TAB_KEYS: TabKey[] = ["vulns", "software", "assets", "policies"];

export function Explorer() {
  // The active tab lives in the URL (?tab=assets) so "Back" from an asset page lands on the same tab.
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab") as TabKey | null;
  const tab: TabKey = tabParam && TAB_KEYS.includes(tabParam) ? tabParam : "vulns";
  const setTab = (k: TabKey) => setParams(k === "vulns" ? {} : { tab: k }, { replace: true });
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("risk");
  const [sla, setSla] = useState<"all" | Sla>("all");
  const [assetFilter, setAssetFilter] = useState("all");
  const [runFilter, setRunFilter] = useState("all");
  const [openId, setOpenId] = useState("");

  const q = query.toLowerCase().trim();
  const pick = <T,>(filters: Filter<T>[], key: string) => filters.find((f) => f.key === key)!.test;

  const vulnRows = updates
    .filter(pick(SEVERITY_FILTERS, severity))
    .filter((u) => sla === "all" || u.sla === sla)
    .filter((u) => contains(q, u.name, u.vendor, u.kb, ...u.cves))
    .sort(byRisk);
  const softwareRows = thirdPartyApps.filter((s) => contains(q, s.name, s.vendor, s.version)).sort(byRisk);
  const assetRows = endpoints
    .filter(pick(ASSET_FILTERS, assetFilter))
    .filter((a) => contains(q, a.name, a.user, a.os, a.ip, a.cpu, a.serial, a.group));
  const runRows = runs.filter(pick(RUN_FILTERS, runFilter)).filter((r) => contains(q, r.name, r.target, r.status));

  const critPlusImp = updates.filter((u) => u.severity !== "None").length;
  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "vulns", label: "Vulnerabilities", count: critPlusImp },
    { key: "software", label: "Installed software", count: thirdPartyApps.length },
    { key: "assets", label: "Assets", count: endpoints.length },
    { key: "policies", label: "Automations", count: runs.length },
  ];

  const view = {
    vulns: { placeholder: "Search update, vendor, KB or CVE", shown: `${vulnRows.length} of ${updates.length} updates`, n: vulnRows.length },
    software: { placeholder: "Search application or vendor", shown: `${softwareRows.length} of ${thirdPartyApps.length} applications`, n: softwareRows.length },
    assets: { placeholder: "Search hostname, user, IP, serial", shown: `${assetRows.length} of ${endpoints.length} endpoints`, n: assetRows.length },
    policies: { placeholder: "Search policy or target", shown: `${runRows.length} of ${runs.length} runs`, n: runRows.length },
  }[tab];

  const selectTab = (k: TabKey) => {
    setTab(k);
    setQuery("");
    setOpenId("");
  };

  return (
    <section className="explorer">
      <div role="tablist" aria-label="Dashboard views" className="tabs">
        {tabs.map((t) => (
          <button key={t.key} type="button" role="tab" className="tab" aria-selected={tab === t.key} onClick={() => selectTab(t.key)}>
            {t.label}
            <span className="tab__count">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="toolbar">
        <label className="search">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="fg-muted">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <span className="sr-only">Search</span>
          <input
            type="search"
            value={query}
            placeholder={view.placeholder}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpenId("");
            }}
          />
        </label>

        {tab === "vulns" && (
          <>
            <FilterChips filters={SEVERITY_FILTERS} all={updates} value={severity} onChange={setSeverity} />
            <div className="chips">
              {SLA_FILTERS.map((f) => (
                <Chip key={f.key} on={sla === f.key} onClick={() => setSla(f.key)}>
                  {f.label}
                </Chip>
              ))}
            </div>
          </>
        )}
        {tab === "assets" && <FilterChips filters={ASSET_FILTERS} all={endpoints} value={assetFilter} onChange={setAssetFilter} />}
        {tab === "policies" && <FilterChips filters={RUN_FILTERS} all={runs} value={runFilter} onChange={setRunFilter} />}

        <div className="toolbar__count" aria-live="polite">{view.shown}</div>
      </div>

      {view.n === 0 ? (
        <div className="empty">Nothing matches these filters.</div>
      ) : (
        <>
          {tab === "vulns" && <VulnsTable rows={vulnRows} openId={openId} onToggle={(id) => setOpenId(openId === id ? "" : id)} />}
          {tab === "software" && <SoftwareTable rows={softwareRows} />}
          {tab === "assets" && <AssetsTable rows={assetRows} />}
          {tab === "policies" && <RunsTable rows={runRows} />}
        </>
      )}
    </section>
  );
}
