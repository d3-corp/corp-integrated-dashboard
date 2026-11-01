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
    PLACEHOLDER,
    rebootFlag(record.reboot_required),
    text(record.agent_version),
  ];
}

export function toLivePayload({ organization, assets, truncated, fetchedAt }) {
  return {
    fetchedAt,
    organization,
    endpoints: assets.map(toEndpointRow),
    updates: [],
    runs: [],
    truncated: Boolean(truncated),
  };
}
