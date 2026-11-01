import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { buildData, isRawLayout, sampleData, type DataSet } from "./snapshot";

export type Source = { kind: "test" } | { kind: "live"; organization: string; fetchedAt: string };

export interface DataContextValue {
  data: DataSet;
  source: Source;
  loading: boolean;
  error: string | null;
  fetchLive: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

const NETWORK_ERROR = "Live data unavailable: the local live bridge is not running (start it with npm run live)";
const SHAPE_ERROR = "Live data unavailable: unexpected response shape";

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body !== null && typeof body === "object" && "error" in body) {
      const message = (body as { error?: unknown }).error;
      if (typeof message === "string" && message) return message;
    }
  } catch {
    // The body is not JSON; fall back to the HTTP status.
  }
  return `HTTP ${response.status}`;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DataSet>(sampleData);
  const [source, setSource] = useState<Source>({ kind: "test" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const fetchLive = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/live", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!response.ok) {
        setError(`Live data unavailable: ${await readErrorMessage(response)}`);
        return;
      }

      let body: unknown;
      try {
        body = await response.json();
      } catch {
        setError(SHAPE_ERROR);
        return;
      }

      if (body === null || typeof body !== "object") {
        setError(SHAPE_ERROR);
        return;
      }

      const payload = body as {
        fetchedAt?: unknown;
        organization?: unknown;
        endpoints?: unknown;
        updates?: unknown;
        runs?: unknown;
      };
      const fetchedAt = payload.fetchedAt;
      const organization = payload.organization;
      const raw = { endpoints: payload.endpoints, updates: payload.updates, runs: payload.runs };

      if (typeof fetchedAt !== "string" || typeof organization !== "string" || !isRawLayout(raw)) {
        setError(SHAPE_ERROR);
        return;
      }

      setData(buildData(raw));
      setSource({ kind: "live", organization, fetchedAt });
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  return (
    <DataContext.Provider value={{ data, source, loading, error, fetchLive }}>{children}</DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used inside a DataProvider");
  return context;
}
