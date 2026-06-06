import factsData from "@/data/facts.json";
import type { CategoryKey } from "@/constants/theme";

export type Fact = {
  id: string;
  category: CategoryKey;
  text: string;
  searchKeywords: string;
};

export const FACTS = factsData as Fact[];

/** Whole days since the Unix epoch (UTC) — changes once per calendar day. */
function daysSinceEpoch(): number {
  return Math.floor(Date.now() / 86_400_000);
}

/** Deterministic fact for today, rotating through the list day by day. */
export function getTodaysFact(): Fact {
  return FACTS[daysSinceEpoch() % FACTS.length];
}

/** Resolves saved fact ids to Facts, preserving order and dropping stale ids. */
export function getFactsByIds(ids: string[]): Fact[] {
  return ids
    .map((id) => FACTS.find((f) => f.id === id))
    .filter((f): f is Fact => f != null);
}

/** Formats a date as "Tue · 6 Jun". */
export function formatDate(date: Date): string {
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${weekday} · ${day} ${month}`;
}

/** Builds the Google search URL for a fact's keywords. */
export function googleSearchUrl(keywords: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(keywords)}`;
}
