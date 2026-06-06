// Curio — Fact + Quote Generation Script
// Writes facts  → data/facts.json   ({ id, date, category, text, detail, searchKeywords })
// Writes quotes → data/quotes.json  ({ text, author })
// Run: node generate-facts.js   (or: npm run generate)
//
// Config lives in .env (see .env.example) or the process environment:
//   OPENAI_API_KEY — your OpenAI key (required)
//   MODE           — "append" (default): keep existing content and continue
//                    after the last fact's date. "replace": overwrite from scratch.
//   START_DATE     — first fact's date (YYYY-MM-DD). Defaults to the day after
//                    the last existing fact, or today on a fresh run.
//   TOTAL          — how many facts/quotes to generate per run (default 90)

const https = require("https");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// ─── CONFIG ───────────────────────────────────────────────────
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // set in .env
if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY — add it to your .env file.");
  process.exit(1);
}
const TOTAL = Number(process.env.TOTAL) || 90;
// "append" (default): keep existing content and continue after the last fact's
// date — used by the scheduled job. "replace": overwrite everything from scratch.
const MODE = (process.env.MODE || "append").toLowerCase();
const FACTS_FILE  = path.join(__dirname, "facts.json");
const QUOTES_FILE = path.join(__dirname, "quotes.json");

// Category keys must match CategoryKey in constants/theme.ts.
const CATEGORIES = [
  "naturalScience",
  "history",
  "famousLives",
  "literature",
  "physics",
  "math",
  "astronomy",
];

const PUBLIC_DOMAIN_AUTHORS = [
  "Dostoevsky", "Bulgakov", "Tolstoy", "Marcus Aurelius",
  "Socrates", "Aristotle", "Plato", "Nietzsche", "Schopenhauer",
  "Victor Hugo", "Oscar Wilde", "Mark Twain", "Voltaire",
  "Chekhov", "Kafka", "Einstein", "Darwin", "Newton",
];

// ─── HELPERS ──────────────────────────────────────────────────
function addDays(dateStr, days) {
  const date = new Date(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split("T")[0];
}

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
}

function buildCategorySequence(total) {
  const sequence = [];
  let lastCategory = null;
  for (let i = 0; i < total; i++) {
    const available = CATEGORIES.filter((c) => c !== lastCategory);
    const category = available[i % available.length];
    sequence.push(category);
    lastCategory = category;
  }
  return sequence;
}

// Turns a fact sentence into a unique kebab-case id, matching the existing data.
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .slice(0, 4)
    .join("-");
}

function uniqueId(base, taken) {
  let id = base || "fact";
  let n = 2;
  while (taken.has(id)) id = `${base}-${n++}`;
  taken.add(id);
  return id;
}

function callOpenAI(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "gpt-4o",
      temperature: 0.8,
      response_format: { type: "json_object" }, // API guarantees valid JSON
      messages: [
        {
          role: "system",
          content: "You are a content writer for an educational daily fact app. Always respond with a single valid JSON object only. No markdown, no backticks, no explanation.",
        },
        { role: "user", content: prompt },
      ],
    });

    const options = {
      hostname: "api.openai.com",
      path: "/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(new Error(parsed.error.message));
          else resolve(parsed.choices[0].message.content);
        } catch (e) {
          reject(new Error("Failed to parse OpenAI response"));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// JSON mode returns an object; pull out the array it wraps (under "items").
function parseItems(raw) {
  const obj = JSON.parse(raw.replace(/```json|```/g, "").trim());
  if (Array.isArray(obj)) return obj;
  if (Array.isArray(obj.items)) return obj.items;
  const firstArray = Object.values(obj).find(Array.isArray);
  if (firstArray) return firstArray;
  throw new Error("OpenAI response did not contain a JSON array");
}

// ─── FACTS GENERATION ─────────────────────────────────────────
async function generateFactsBatch(batch, batchIndex, avoid) {
  const prompt = `
Generate ${batch.length} daily fun facts for a mobile app.
Return a JSON object of the form { "items": [ ... ] } and nothing else.

Each item in "items" must follow this exact shape:
{
  "category": "string (echo back the category given for this entry)",
  "text": "string (one vivid, accurate, genuinely surprising sentence)",
  "detail": "string (2-4 sentences expanding on the fact with extra context)",
  "searchKeywords": "string (3-6 plain keywords for a Google search of this fact)"
}

Generate exactly one fact for each of these categories, in this order:
${batch.map((b, i) => `${i + 1}. category: "${b.category}"`).join("\n")}

Rules:
- Facts must be genuinely true and verifiable
- Facts must be surprising — not generic or widely known
- Each fact must match its assigned category
- No two facts about the same subject
- Do NOT repeat any of these already-used topics: ${avoid.join("; ") || "none"}
- searchKeywords must be plain words only, no quotes or punctuation
`;

  console.log(`  Generating facts batch ${batchIndex + 1}...`);
  const response = await callOpenAI(prompt);
  const parsed = parseItems(response);
  console.log(`  ✓ Facts batch ${batchIndex + 1} done — ${parsed.length} facts`);
  return parsed;
}

// ─── QUOTES GENERATION ────────────────────────────────────────
async function generateQuotesBatch(count, batchIndex, avoid) {
  const authorList = PUBLIC_DOMAIN_AUTHORS.join(", ");

  const prompt = `
Generate ${count} splash screen quotes for a mobile app.
Return a JSON object of the form { "items": [ ... ] } and nothing else.

Each item in "items" must follow this exact shape:
{
  "text": "string (a short real quote, under 15 words)",
  "author": "string (the author's name)"
}

Rules:
- Quotes must be real and correctly attributed — do NOT invent quotes
- Only use authors from this list: ${authorList}
- Each quote must be under 15 words
- Vary the authors — don't repeat the same author consecutively
- Do NOT repeat any of these already-used quotes: ${avoid.join(" | ") || "none"}
- Quotes should feel warm, thoughtful, or inspiring
`;

  console.log(`  Generating quotes batch ${batchIndex + 1}...`);
  const response = await callOpenAI(prompt);
  const parsed = parseItems(response);
  console.log(`  ✓ Quotes batch ${batchIndex + 1} done — ${parsed.length} quotes`);
  return parsed;
}

// ─── MAIN ─────────────────────────────────────────────────────
async function main() {
  console.log("🌟 Curio Content Generator");
  console.log(`Mode: ${MODE} — generating ${TOTAL} facts + ${TOTAL} quotes...\n`);

  // In append mode we keep existing content; in replace mode we start clean.
  const existingFacts = MODE === "append" ? readJSON(FACTS_FILE) : [];
  const existingQuotes = MODE === "append" ? readJSON(QUOTES_FILE) : [];

  // First new fact's date: the launch date (START_DATE) on a fresh run, or the
  // day after the latest existing fact when appending. START_DATE always wins.
  const today = new Date().toISOString().slice(0, 10);
  const lastDate = existingFacts.reduce((max, f) => (f.date > max ? f.date : max), "");
  const startDate =
    process.env.START_DATE || (lastDate ? addDays(lastDate, 1) : today);

  const categorySequence = buildCategorySequence(TOTAL);
  const schedule = Array.from({ length: TOTAL }, (_, i) => ({
    date: addDays(startDate, i),
    category: categorySequence[i],
  }));

  // Split into batches of 10
  const BATCH_SIZE = 10;
  const batches = [];
  for (let i = 0; i < schedule.length; i += BATCH_SIZE) {
    batches.push(schedule.slice(i, i + BATCH_SIZE));
  }

  // Track ids and topics so generated content stays unique across batches and
  // (in append mode) against everything already in the file.
  const takenIds = new Set(existingFacts.map((f) => f.id));
  const usedTopics = existingFacts.map((f) => f.searchKeywords).filter(Boolean);

  // Generate facts
  console.log(`📚 Generating facts (starting ${startDate})...`);
  const newFacts = [];
  for (let i = 0; i < batches.length; i++) {
    const raw = await generateFactsBatch(batches[i], i, usedTopics);
    raw.forEach((entry, j) => {
      const slot = batches[i][j];
      if (!slot) return; // ignore extra entries the model may return
      const fact = {
        id: uniqueId(slugify(entry.text || ""), takenIds),
        date: slot.date,
        category: slot.category, // enforce schedule; don't trust the model
        text: entry.text,
        detail: entry.detail,
        searchKeywords: entry.searchKeywords,
      };
      newFacts.push(fact);
      if (entry.searchKeywords) usedTopics.push(entry.searchKeywords);
    });
    if (i < batches.length - 1) await new Promise((r) => setTimeout(r, 1000));
  }

  // Generate quotes
  console.log("\n💬 Generating quotes...");
  const usedQuotes = existingQuotes.map((q) => `${q.text} — ${q.author}`);
  const seenQuotes = new Set(existingQuotes.map((q) => q.text.toLowerCase()));
  const newQuotes = [];
  for (let i = 0; i < batches.length; i++) {
    const raw = await generateQuotesBatch(batches[i].length, i, usedQuotes);
    raw.forEach((q) => {
      if (!q.text || seenQuotes.has(q.text.toLowerCase())) return; // dedupe
      seenQuotes.add(q.text.toLowerCase());
      usedQuotes.push(`${q.text} — ${q.author}`);
      newQuotes.push({ text: q.text, author: q.author });
    });
    if (i < batches.length - 1) await new Promise((r) => setTimeout(r, 1000));
  }

  // Merge with existing content (sorted by date) and write the files.
  const allFacts = [...existingFacts, ...newFacts].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  const allQuotes = [...existingQuotes, ...newQuotes];

  fs.writeFileSync(FACTS_FILE,  JSON.stringify(allFacts,  null, 2));
  fs.writeFileSync(QUOTES_FILE, JSON.stringify(allQuotes, null, 2));

  console.log(`\n✅ Done!`);
  console.log(`📄 +${newFacts.length} facts (${allFacts.length} total) → ${FACTS_FILE}`);
  console.log(`📄 +${newQuotes.length} quotes (${allQuotes.length} total) → ${QUOTES_FILE}`);
  console.log(`\n👉 Review both files before using them in the app!`);
}

main().catch(console.error);
