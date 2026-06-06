import AsyncStorage from "@react-native-async-storage/async-storage";

import { setFacts, type Fact } from "@/lib/facts";

/**
 * Remote, CDN-hosted copy of data/facts.json. The scheduled job (see
 * .github/workflows/generate-facts.yml) appends new entries and pushes;
 * jsDelivr serves the file straight from the repo, so users get new facts
 * without an app rebuild. Replace <owner>/<repo> with your GitHub repo
 * (the repo root is this `curio/` folder, so the path is just data/facts.json).
 */
const REMOTE_URL =
  "https://cdn.jsdelivr.net/gh/isti-q/curio@main/data/facts.json";

const CACHE_KEY = "@curio/facts-cache";

/** Narrow validation so a malformed payload never replaces the live list. */
function isFactArray(value: unknown): value is Fact[] {
  return (
    Array.isArray(value) &&
    value.every(
      (f) =>
        f != null &&
        typeof f === "object" &&
        typeof (f as Fact).id === "string" &&
        typeof (f as Fact).date === "string" &&
        typeof (f as Fact).text === "string"
    )
  );
}

/**
 * Loads facts for this session. Order of preference:
 *  1. fresh copy from the remote CDN (also cached for next time),
 *  2. last cached copy (offline / fetch failed),
 *  3. the bundled snapshot already active in lib/facts.ts.
 *
 * Returns true if the live list was updated from remote or cache, letting the
 * caller re-render. Never throws.
 */
export async function loadFacts(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(REMOTE_URL, {
      cache: "no-store",
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
    if (res.ok) {
      const data: unknown = await res.json();
      if (isFactArray(data)) {
        setFacts(data);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)).catch(
          () => {}
        );
        return true;
      }
    }
  } catch {
    // fall through to cache
  }

  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached: unknown = JSON.parse(raw);
      if (isFactArray(cached)) {
        setFacts(cached);
        return true;
      }
    }
  } catch {
    // fall through to bundled
  }

  return false;
}
