const PLACEHOLDER = "\u2014";

function text(value) {
  if (value === null || value === undefined || typeof value === "object") {
    return PLACEHOLDER;
  }
  const string = String(value);
  return string.trim() ? string : PLACEHOLDER;
}

function statusCode(value) {
  if (typeof value === "string") {
    if (/^connected$/i.test(value)) return "C";
    if (/^disconnected$/i.test(value)) return "D";
  }
  return PLACEHOLDER;
}

function rebootFlag(value) {
  if (value === true) return "Y";
  if (value === false) return "N";
  const string = text(value);
  if (/^(yes|true|1)$/i.test(string)) return "Y";
  if (/^(no|false|0)$/i.test(string)) return "N";
  return PLACEHOLDER;
}

/** Group names from Action1 group membership entries, or a placeholder. */
function groupNames(value) {
  if (!Array.isArray(value)) return PLACEHOLDER;
  const names = value
    .map((entry) => (entry && typeof entry === "object" ? entry.name : undefined))
    .filter((name) => typeof name === "string" && name.trim())
    .map((name) => name.trim());
  return names.length ? names.join(", ") : PLACEHOLDER;
}

/** One endpoint as a RAW_ENDPOINTS tuple; unavailable values stay placeholders. */
export function toEndpointRow(asset) {
  const record = asset && typeof asset === "object" ? asset : {};
  return [
    text(record.name || record.id),
    text(record.user),
    text(record.OS),
    statusCode(record.status),
    text(record.address),
    text(record.last_seen),
    text(record.manufacturer),
    text(record.CPU_name),
    text(record.RAM),
    text(record.disk),
    text(record.serial),
    groupNames(record.group_membership),
    rebootFlag(record.reboot_required),
    text(record.agent_version),
  ];
}

/** Resolve endpoint and group ids in one pass over the asset list. */
export function buildLookup(assets) {
  const hosts = new Map();
  const groups = new Map();
  for (const asset of assets || []) {
    if (!asset || typeof asset !== "object") continue;
    hosts.set(asset.id, text(asset.name || asset.id));
    if (!Array.isArray(asset.group_membership)) continue;
    for (const entry of asset.group_membership) {
      if (!entry || typeof entry !== "object") continue;
      if (typeof entry.id !== "string") continue;
      if (typeof entry.name !== "string" || !entry.name.trim()) continue;
      groups.set(entry.id, entry.name);
    }
  }
  return { hosts, groups };
}

/** YYYY-MM-DD_HH-MM-SS to "YYYY-MM-DD HH:MM"; other values pass through as text. */
function formatTime(value) {
  if (typeof value === "string") {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-\d{2}$/);
    if (match) return `${match[1]} ${match[2]}:${match[3]}`;
  }
  return text(value);
}

const RUN_STATUSES = new Set(["Running", "Success", "Warning", "Error"]);

function progressPercent(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(100, Math.max(0, parsed));
}

function runTarget(endpoints, lookup) {
  if (endpoints.length === 0) return PLACEHOLDER;
  const labels = endpoints.map((entry) => {
    const item = entry && typeof entry === "object" ? entry : {};
    if (item.type === "Endpoint") {
      return lookup.hosts.get(item.id) ?? PLACEHOLDER;
    }
    if (item.type === "EndpointGroup") {
      const name = lookup.groups.get(item.id);
      return name ? `${name} (group)` : PLACEHOLDER;
    }
    return PLACEHOLDER;
  });
  if (endpoints.length === 1) return labels[0];
  if (endpoints.length <= 3) return labels.join(", ");
  const allEndpoints = endpoints.every(
    (entry) => entry && typeof entry === "object" && entry.type === "Endpoint",
  );
  return allEndpoints
    ? `${endpoints.length} endpoints`
    : `${endpoints.length} targets`;
}

/** One Action1 automation instance as a RAW_RUNS tuple. */
export function toRunRow(instance, lookup) {
  const record = instance && typeof instance === "object" ? instance : {};
  const endpoints = Array.isArray(record.endpoints) ? record.endpoints : [];
  const status = RUN_STATUSES.has(record.status)
    ? record.status
    : PLACEHOLDER;
  return [
    text(record.name),
    runTarget(endpoints, lookup),
    formatTime(record.start_time),
    formatTime(record.end_time),
    status,
    progressPercent(record.percent_completed),
  ];
}

export function toLivePayload({ organization, assets, instances, runsFailed, truncated, fetchedAt }) {
  const list = Array.isArray(assets) ? assets : [];
  const lookup = buildLookup(list);
  const runs = (instances || [])
    .map((instance) => toRunRow(instance, lookup))
    .sort((a, b) => {
      const left = a[2];
      const right = b[2];
      const leftMissing = left === PLACEHOLDER;
      const rightMissing = right === PLACEHOLDER;
      if (leftMissing && rightMissing) return 0;
      if (leftMissing) return 1;
      if (rightMissing) return -1;
      return right.localeCompare(left);
    });
  return {
    fetchedAt,
    organization,
    endpoints: list.map(toEndpointRow),
    updates: [],
    runs,
    unavailable: runsFailed ? ["updates", "runs"] : ["updates"],
    truncated: Boolean(truncated),
  };
}
