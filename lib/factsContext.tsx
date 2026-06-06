import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { loadFacts } from "@/lib/factsSource";

/**
 * Bumps once the remote/cached facts list has been swapped in. Screens read it
 * (via useFactsVersion) so they re-render and re-run the synchronous getters in
 * lib/facts.ts against the freshly loaded data.
 */
const FactsVersionContext = createContext(0);

export function FactsProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    loadFacts().then((updated) => {
      if (active && updated) setVersion((v) => v + 1);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <FactsVersionContext.Provider value={version}>
      {children}
    </FactsVersionContext.Provider>
  );
}

/** Subscribe a screen to facts updates so it re-renders when remote data lands. */
export function useFactsVersion(): number {
  return useContext(FactsVersionContext);
}
