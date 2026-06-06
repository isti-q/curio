import factsData from "@/data/facts.json";
import type { CategoryKey } from "@/constants/theme";

export type Fact = {
  id: string;
  /** The UTC calendar day this fact is for, as "YYYY-MM-DD". */
  date: string;
  category: CategoryKey;
  text: string;
  detail: string;
  searchKeywords: string;
};

/**
 * The active facts list. Starts as the bundled snapshot and is replaced at
 * runtime once the remote source loads (see lib/factsSource.ts). The data is
 * append-only and each entry carries an explicit `date`, so a fact's archive
 * date never shifts as new entries are added.
 */
export let FACTS = factsData as Fact[];

/** Swaps in a freshly loaded facts list (e.g. fetched from the remote CDN). */
export function setFacts(facts: Fact[]): void {
  FACTS = facts;
}

/** Today's UTC calendar day as "YYYY-MM-DD". */
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The fact for today. If today's entry hasn't been published yet (e.g. the
 * daily job hasn't run), falls back to the most recent entry on or before
 * today so the screen is never empty.
 */
export function getTodaysFact(): Fact {
  const today = todayKey();
  const eligible = FACTS.filter((f) => f.date <= today);
  const pool = eligible.length > 0 ? eligible : FACTS;
  return pool.reduce((latest, f) => (f.date > latest.date ? f : latest));
}

export type ArchiveEntry = { fact: Fact; date: Date };

/** Every fact strictly before today, newest first. */
export function getArchiveFacts(): ArchiveEntry[] {
  const today = todayKey();
  return FACTS.filter((f) => f.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((fact) => ({ fact, date: parseDate(fact.date) }));
}

/** Looks up a single fact by id. */
export function getFactById(id: string): Fact | undefined {
  return FACTS.find((f) => f.id === id);
}

/** The calendar date a fact is for. */
export function factDate(id: string): Date {
  const fact = FACTS.find((f) => f.id === id);
  return fact ? parseDate(fact.date) : new Date();
}

/** Parses a "YYYY-MM-DD" UTC day key into a Date at UTC midnight. */
function parseDate(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
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
