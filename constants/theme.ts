// Curio design tokens — derived from the curio-ui-flow.html reference.

export const COLORS = {
  paper: "#F3EAD9", // warm cream background
  card: "#FBF6EC", // lighter paper for cards / tab bar
  ink: "#2C241B", // primary dark text
  inkSoft: "#5A4F40", // secondary text
  inkFaint: "#8B8170", // muted labels / icons
  line: "#E2D6BF", // hairline borders / dividers
  accent: "#BB4D2A", // brand accent (terracotta)
  iconBg: "#EFE3CC", // search icon tile background
  white: "#FFFFFF",
} as const;

export const FONTS = {
  serifMedium: "Fraunces_500Medium",
  serifSemiBold: "Fraunces_600SemiBold",
  serifQuote: "Newsreader_400Regular_Italic",
} as const;

export type CategoryKey =
  | "naturalScience"
  | "history"
  | "famousLives"
  | "literature"
  | "physics"
  | "math"
  | "astronomy";

export const CATEGORIES: Record<CategoryKey, { label: string; color: string }> = {
  naturalScience: { label: "Natural Science", color: "#2F7E7E" },
  history: { label: "History", color: "#B07D2B" },
  famousLives: { label: "Famous Lives", color: "#7A4A6B" },
  literature: { label: "Literature", color: "#BB4D2A" },
  physics: { label: "Physics", color: "#3D6BB5" },
  math: { label: "Math", color: "#8B4EA6" },
  astronomy: { label: "Astronomy", color: "#1A527A" },
};

/** Returns a #RRGGBB hex as an rgba() string at the given alpha (0–1). */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
