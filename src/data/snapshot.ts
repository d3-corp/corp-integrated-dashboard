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
  /** true = connected, false = disconnected, null = unknown (live data omitted or marked "—"/other). */
  online: boolean | null;
  ip: string;
  lastSeen: string;
  manufacturer: string;
  cpu: string;
  ram: string;
  disk: string;
  serial: string;
  group: string;
  isServer: boolean;
  /** true = pending, false = not pending, null = unknown (live data omitted or marked "—"/other). */
  rebootPending: boolean | null;
  agentVersion: string;
}

export interface Update {
  id: string;
  name: string;
  vendor: string;
  type: "App" | "Windows" | null;
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

export interface RawData {
  endpoints: string[][];
  updates: string[][];
  runs: [string, string, string, string, string, number][];
}

export interface DataSet {
  endpoints: Endpoint[];
  updates: Update[];
  runs: PolicyRun[];
  thirdPartyApps: Update[];
}

export interface BuildOptions {
  /** Label for an empty update version. Live data leaves it unknown ("—"); the bundled sample means "Latest". */
  emptyVersion?: string;
}

export function buildData(raw: RawData, { emptyVersion = "—" }: BuildOptions = {}): DataSet {
  const endpoints: Endpoint[] = raw.endpoints.map((a) => ({
    name: a[0],
    user: a[1],
    os: a[2],
    online: a[3] === "C" ? true : a[3] === "D" ? false : null,
    ip: a[4],
    lastSeen: a[5],
    manufacturer: a[6],
    cpu: a[7],
    ram: a[8].replace("Gb", " GB"),
    disk: a[9],
    serial: a[10],
    group: a[11],
    isServer: a[11] === "Servers",
    rebootPending: a[12] === "Y" ? true : a[12] === "N" ? false : null,
    agentVersion: a[13],
  }));

  const updates: Update[] = raw.updates.map((p, i) => ({
    id: `p${i}`,
    name: p[0],
    vendor: p[1],
    type: p[2] === "App" ? "App" : p[2] === "Windows" ? "Windows" : null,
    kb: p[3] || "—",
    // An empty version is unknown in live data; only the bundled sample uses "" to mean the latest version.
    version: p[4] === "" ? emptyVersion : p[4],
    severity: p[5] as Severity,
    sla: p[6] as Sla,
    deadline: p[7],
    released: p[8],
    cves: p[9] ? p[9].split(" ") : [],
  }));

  const runs: PolicyRun[] = raw.runs.map((r) => ({
    name: r[0],
    target: r[1],
    started: r[2],
    finished: r[3],
    status: r[4] as RunStatus,
    progress: r[5],
  }));

  const thirdPartyApps = updates.filter((u) => u.type === "App");

  return { endpoints, updates, runs, thirdPartyApps };
}

export const sampleData = buildData(
  {
    endpoints: RAW_ENDPOINTS,
    updates: RAW_UPDATES,
    runs: RAW_RUNS,
  },
  { emptyVersion: "Latest" },
);

export const endpoints: Endpoint[] = sampleData.endpoints;
export const updates: Update[] = sampleData.updates;
export const runs: PolicyRun[] = sampleData.runs;
export const thirdPartyApps: Update[] = sampleData.thirdPartyApps;

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

export const assetPath = (hostname: string) => `/assets/${encodeURIComponent(hostname)}`;

export const findEndpoint = (data: DataSet, hostname: string) => data.endpoints.find((e) => e.name === hostname);

export interface EndpointRun {
  run: PolicyRun;
  /** "direct" when the endpoint is named in the run's target, "group" when it ran via the endpoint's group. */
  via: "direct" | "group";
}

/** Policy runs that targeted this endpoint by name (full or short hostname) or through its group. */
export function runsForEndpoint(e: Endpoint, runs: PolicyRun[]): EndpointRun[] {
  const short = e.name.split(".")[0].toLowerCase();
  const names = new Set([e.name.toLowerCase(), short]);
  const groupTarget = `${e.group} (group)`.toLowerCase();

  return runs.flatMap((run): EndpointRun[] => {
    const target = run.target.toLowerCase();
    if (target.split(",").some((t) => names.has(t.trim()))) return [{ run, via: "direct" }];
    if (target === groupTarget) return [{ run, via: "group" }];
    return [];
  });
}

function isStringMatrix(value: unknown, width: number): value is string[][] {
  return (
    Array.isArray(value) &&
    value.every(
      (row) => Array.isArray(row) && row.length === width && row.every((cell) => typeof cell === "string"),
    )
  );
}

function isRunMatrix(value: unknown): value is [string, string, string, string, string, number][] {
  return (
    Array.isArray(value) &&
    value.every(
      (row) =>
        Array.isArray(row) &&
        row.length === 6 &&
        typeof row[0] === "string" &&
        typeof row[1] === "string" &&
        typeof row[2] === "string" &&
        typeof row[3] === "string" &&
        typeof row[4] === "string" &&
        typeof row[5] === "number" &&
        Number.isFinite(row[5]),
    )
  );
}

/** True when a value has the raw.ts tuple layout: 14 endpoint fields, 10 update fields and 5 run fields plus progress. */
export function isRawLayout(value: unknown): value is RawData {
  if (value === null || typeof value !== "object") return false;
  const candidate = value as { endpoints?: unknown; updates?: unknown; runs?: unknown };
  return (
    isStringMatrix(candidate.endpoints, 14) && isStringMatrix(candidate.updates, 10) && isRunMatrix(candidate.runs)
  );
}
