import quotesData from "@/data/quotes.json";

export type Quote = {
  text: string;
  author: string;
};

export const QUOTES = quotesData as Quote[];

/** Whole days since the Unix epoch (UTC) — changes once per calendar day. */
function daysSinceEpoch(): number {
  return Math.floor(Date.now() / 86_400_000);
}

/** Deterministic quote for today, rotating through the list day by day. */
export function getTodaysQuote(): Quote {
  return QUOTES[daysSinceEpoch() % QUOTES.length];
}
