import { RAW_ENDPOINTS, RAW_RUNS, RAW_UPDATES } from "./raw";

export const SNAPSHOT_DATE = "2026-11-01";
export const SNAPSHOT_TZ = "Asia/Singapore";
export const ORG = "Contoso";

export type Severity = "Critical" | "Important" | "None";
export type Sla = "Overdue" | "Due soon" | "Due later";
export type RunStatus = "Running" | "Success" | "Warning" | "Error";

export interface Endpoint {
  name: string;
  user: string;
  os: string;
  online: boolean;
  ip: string;
  lastSeen: string;
  manufacturer: string;
  cpu: string;
  ram: string;
  disk: string;
  serial: string;
  group: string;
  isServer: boolean;
  rebootPending: boolean;
  agentVersion: string;
}

export interface Update {
  id: string;
  name: string;
  vendor: string;
  type: "App" | "Windows";
  kb: string;
  version: string;
  severity: Severity;
  sla: Sla;
  deadline: string;
  released: string;
  cves: string[];
}

export interface PolicyRun {
  name: string;
  target: string;
  started: string;
  finished: string;
  status: RunStatus;
  progress: number;
}

export const endpoints: Endpoint[] = RAW_ENDPOINTS.map((a) => ({
  name: a[0],
  user: a[1],
  os: a[2],
  online: a[3] === "C",
  ip: a[4],
  lastSeen: a[5],
  manufacturer: a[6],
  cpu: a[7],
  ram: a[8].replace("Gb", " GB"),
  disk: a[9],
  serial: a[10],
  group: a[11],
  isServer: a[11] === "Servers",
  rebootPending: a[12] === "Y",
  agentVersion: a[13],
}));

export const updates: Update[] = RAW_UPDATES.map((p, i) => ({
  id: `p${i}`,
  name: p[0],
  vendor: p[1],
  type: p[2] === "App" ? "App" : "Windows",
  kb: p[3] || "—",
  version: p[4] || "Latest",
  severity: p[5] as Severity,
  sla: p[6] as Sla,
  deadline: p[7],
  released: p[8],
  cves: p[9] ? p[9].split(" ") : [],
}));

export const runs: PolicyRun[] = RAW_RUNS.map((r) => ({
  name: r[0],
  target: r[1],
  started: r[2],
  finished: r[3],
  status: r[4] as RunStatus,
  progress: r[5],
}));

export const thirdPartyApps = updates.filter((u) => u.type === "App");

const SEV_RANK: Record<Severity, number> = { Critical: 0, Important: 1, None: 2 };
const SLA_RANK: Record<Sla, number> = { Overdue: 0, "Due soon": 1, "Due later": 2 };

/** Riskiest first: severity, then SLA urgency, then CVE count, then earliest deadline. */
export function byRisk(a: Update, b: Update): number {
  return (
    SEV_RANK[a.severity] - SEV_RANK[b.severity] ||
    SLA_RANK[a.sla] - SLA_RANK[b.sla] ||
    b.cves.length - a.cves.length ||
    a.deadline.localeCompare(b.deadline)
  );
}

export const SLA_ORDER: Sla[] = ["Overdue", "Due soon", "Due later"];

export const severityLabel = (s: Severity) => (s === "None" ? "Unrated" : s);

export const cveUrl = (id: string) => `https://www.cve.org/CVERecord?id=${id}`;
