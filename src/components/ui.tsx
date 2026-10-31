import type { CSSProperties, ReactNode } from "react";
import type { RunStatus, Severity, Sla } from "../data/snapshot";

export type Tone = "danger" | "warn" | "neutral" | "ok" | "run";

export const SEVERITY_TONE: Record<Severity, Tone> = {
  Critical: "danger",
  Important: "warn",
  None: "neutral",
};

export const SLA_TONE: Record<Sla, Tone> = {
  Overdue: "danger",
  "Due soon": "warn",
  "Due later": "neutral",
};

export const SLA_TEXT: Record<Sla, string> = {
  Overdue: "fg-danger",
  "Due soon": "fg-warn",
  "Due later": "fg-muted",
};

export const SLA_BAR: Record<Sla, string> = {
  Overdue: "bg-danger",
  "Due soon": "bg-warn",
  "Due later": "bg-dim",
};

export const RUN_TONE: Record<RunStatus, Tone> = {
  Running: "run",
  Success: "ok",
  Warning: "warn",
  Error: "danger",
};

export const RUN_BAR: Record<RunStatus, string> = {
  Running: "bg-accent",
  Success: "bg-text",
  Warning: "bg-warn",
  Error: "bg-danger",
};

export function Pill({ tone, small, children }: { tone: Tone; small?: boolean; children: ReactNode }) {
  return <span className={`pill tone-${tone}${small ? " pill--sm" : ""}`}>{children}</span>;
}

export function Panel({ title, className = "", children }: { title?: string; className?: string; children: ReactNode }) {
  return (
    <div className={`panel ${className}`}>
      {title && <h2 className="panel__title">{title}</h2>}
      {children}
    </div>
  );
}

export function Track({ pct, fillClass = "", thin }: { pct: number; fillClass?: string; thin?: boolean }) {
  return (
    <span className={`track${thin ? " track--thin" : ""}`}>
      <span className={`track__fill ${fillClass}`} style={{ width: `${pct}%` }} />
    </span>
  );
}

/** A table built on CSS grid so every row shares one column template. */
export function GridHead({ cols, headers, withTop }: { cols: string; headers: string[]; withTop?: boolean }) {
  return (
    <div className={`grid-row grid-row--head${withTop ? " with-top" : ""}`} style={{ gridTemplateColumns: cols }}>
      {headers.map((h, i) => (
        <span key={i}>{h}</span>
      ))}
    </div>
  );
}

export function GridRow({ cols, className = "", children }: { cols: string; className?: string; children: ReactNode }) {
  return (
    <div className={`grid-row ${className}`} style={{ gridTemplateColumns: cols }}>
      {children}
    </div>
  );
}

export function GridTable({ minWidth, children }: { minWidth: number; children: ReactNode }) {
  const style: CSSProperties = { minWidth };
  return (
    <div className="table-scroll">
      <div style={style}>
        {children}
      </div>
    </div>
  );
}
