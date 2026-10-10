import { normalizeArabic } from "./normalize";

export const EMBEDDING_DIM = 32;

export const TOPICS = [
  "coffee",
  "food",
  "trade",
  "sea",
  "desert",
  "water",
  "architecture",
  "calligraphy",
  "poetry",
  "grammar",
  "music",
  "astronomy",
] as const;

export type Topic = (typeof TOPICS)[number];

const TOPIC_INDEX = new Map<string, number>(TOPICS.map((topic, index) => [topic, index]));

// Hand lexicon, not a learned model. Keys are folded by normalizeArabic.
const LEXICON_SOURCE: Record<string, readonly Topic[]> = {
  قهوة: ["coffee"],
  بن: ["coffee"],
  مخا: ["coffee"],
  mocha: ["coffee"],
  coffee: ["coffee"],
  bean: ["coffee"],
  beans: ["coffee"],
  تمر: ["food"],
  تمور: ["food"],
  date: ["food"],
  dates: ["food"],
  كنافة: ["food"],
  kunafa: ["food"],
  breakfast: ["food"],
  فطور: ["food"],
  مرجان: ["sea"],
  coral: ["sea"],
  reef: ["sea"],
  لؤلؤ: ["sea"],
  pearl: ["sea"],
  pearls: ["sea"],
  بحر: ["sea"],
  sea: ["sea"],
  لبان: ["trade"],
  frankincense: ["trade"],
  incense: ["trade"],
  قافلة: ["trade"],
  caravan: ["trade"],
  صحراء: ["desert"],
  رمل: ["desert"],
  dune: ["desert"],
  dunes: ["desert"],
  فلج: ["water"],
  أفلاج: ["water"],
  aflaj: ["water"],
  falaj: ["water"],
  cistern: ["water"],
  برج: ["architecture"],
  barjeel: ["architecture"],
  courtyard: ["architecture"],
  فناء: ["architecture"],
  خط: ["calligraphy"],
  calligraphy: ["calligraphy"],
  نسخ: ["calligraphy"],
  naskh: ["calligraphy"],
  reed: ["calligraphy"],
  شعر: ["poetry"],
  قصيدة: ["poetry"],
  poem: ["poetry"],
  poetry: ["poetry"],
  مطر: ["poetry"],
  rain: ["poetry"],
  نحو: ["grammar"],
  grammar: ["grammar"],
  جذر: ["grammar"],
  root: ["grammar"],
  roots: ["grammar"],
  عود: ["music"],
  oud: ["music"],
  مقام: ["music"],
  maqam: ["music"],
  هلال: ["astronomy"],
  قمر: ["astronomy"],
  moon: ["astronomy"],
  أسطرلاب: ["astronomy"],
  astrolabe: ["astronomy"],
  تقويم: ["astronomy"],
  calendar: ["astronomy"],
};

const LEXICON = new Map<string, readonly Topic[]>();
for (const [word, topics] of Object.entries(LEXICON_SOURCE)) {
  LEXICON.set(normalizeArabic(word), topics);
}

function l2(values: number[]): number[] {
  let sum = 0;
  for (const value of values) sum += value * value;
  if (sum === 0) return values.map(() => 0);
  const norm = Math.sqrt(sum);
  return values.map((value) => Math.round((value / norm) * 1e6) / 1e6);
}

function fnv1a(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function topicsForText(normalized: string): Topic[] {
  const found: Topic[] = [];
  const seen = new Set<Topic>();
  for (const token of normalized.split(" ")) {
    const topics = LEXICON.get(token);
    if (!topics) continue;
    for (const topic of topics) {
      if (seen.has(topic)) continue;
      seen.add(topic);
      found.push(topic);
    }
  }
  return found;
}

export function embedDocument(topics: readonly string[]): number[] {
  const vector = Array<number>(EMBEDDING_DIM).fill(0);
  for (const topic of topics) {
    const index = TOPIC_INDEX.get(topic);
    if (index !== undefined) vector[index] = 1;
  }
  return l2(vector);
}

function hashEmbedding(normalized: string): number[] {
  const vector = Array<number>(EMBEDDING_DIM).fill(0);
  const width = EMBEDDING_DIM - TOPICS.length;
  for (const token of normalized.split(" ")) {
    if (!token) continue;
    const hash = fnv1a(token);
    const index = TOPICS.length + (hash % width);
    const current = vector[index] ?? 0;
    vector[index] = current + ((hash & 1) === 0 ? 1 : -1);
  }
  return l2(vector);
}

/** Topic vector when the lexicon knows a token, otherwise a hashed fallback. */
export function embedQuery(query: string): number[] {
  const normalized = normalizeArabic(query);
  const topics = topicsForText(normalized);
  if (topics.length > 0) return embedDocument(topics);
  return hashEmbedding(normalized);
}

export function cosine(left: readonly number[], right: readonly number[]): number {
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    dot += a * b;
    leftNorm += a * a;
    rightNorm += b * b;
  }
  if (leftNorm === 0 || rightNorm === 0) return 0;
  const value = dot / Math.sqrt(leftNorm * rightNorm);
  return Math.max(-1, Math.min(1, value));
}
