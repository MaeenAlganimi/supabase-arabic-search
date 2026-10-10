import type { Language, MatchMethod, SearchResponse } from "../lib/types";

const COPY = {
  ar: {
    kicker: "معين الغانمي",
    title: "قسطاس",
    subtitle: "بحث عربي هجين يجمع النص الكامل والمتجهات.",
    demo: "وضع التجربة: فهرس في الذاكرة، بلا مفاتيح ولا قاعدة بيانات.",
    live: "وضع سوبابيس: الدالة hybrid_search على Postgres.",
    label: "عبارة البحث",
    placeholder: "قَهْوَة، احمد، مكتبه، coral",
    submit: "ابحث",
    normalised: "بعد التوحيد",
    examples: "أمثلة",
    language: "اللغة",
    empty: "اكتب عبارة لترى أي قناة طابقتها: النص، أو المتجه، أو الاثنان.",
    none: "لا نتائج لهذه العبارة.",
    count: "نتائج",
    pitfallsTitle: "ما يوحّده الفهرس",
    pitfalls: [
      "التشكيل والتطويل يُحذفان",
      "أ إ آ تصبح ا، وى تصبح ي، وة تصبح ه",
      "السوابق مثل ال تبقى ملتصقة",
    ],
    method: { fulltext: "نصي", vector: "متجهي", hybrid: "هجين" },
    because: {
      fulltext: "تطابق بعد توحيد الإملاء",
      vector: "تشابه متجهي",
      hybrid: "تطابق نصي ومتجهي",
    },
    fts: "رتبة نصية",
    vector: "تشابه",
    rrf: "دمج",
    arabic: "عربي",
    english: "إنجليزي",
  },
  en: {
    kicker: "Maeen Alganimi",
    title: "Qistas",
    subtitle: "Hybrid Arabic search: full text and vectors.",
    demo: "Demo mode: an in-memory index, with no keys and no database.",
    live: "Supabase mode: the hybrid_search function on Postgres.",
    label: "Query",
    placeholder: "قَهْوَة, احمد, coral, coffee",
    submit: "Search",
    normalised: "Normalised",
    examples: "Examples",
    language: "Language",
    empty: "Type a query to see which channel matched: full text, vector, or both.",
    none: "No results for this query.",
    count: "results",
    pitfallsTitle: "What the index folds",
    pitfalls: [
      "Diacritics and tatweel are removed",
      "أ إ آ become ا, ى becomes ي, ة becomes ه",
      "Prefixes such as ال stay attached",
    ],
    method: { fulltext: "Full text", vector: "Vector", hybrid: "Hybrid" },
    because: {
      fulltext: "Matched after orthographic normalisation",
      vector: "Matched by vector similarity",
      hybrid: "Matched by both channels",
    },
    fts: "Full-text rank",
    vector: "Similarity",
    rrf: "Fusion",
    arabic: "Arabic",
    english: "English",
  },
} as const;

const TOPIC_LABELS: Record<Language, Record<string, string>> = {
  ar: {
    coffee: "قهوة",
    food: "طعام",
    trade: "تجارة",
    sea: "بحر",
    desert: "صحراء",
    water: "ماء",
    architecture: "عمارة",
    calligraphy: "خط",
    poetry: "شعر",
    grammar: "نحو",
    music: "موسيقى",
    astronomy: "فلك",
  },
  en: {
    coffee: "coffee",
    food: "food",
    trade: "trade",
    sea: "sea",
    desert: "desert",
    water: "water",
    architecture: "architecture",
    calligraphy: "calligraphy",
    poetry: "poetry",
    grammar: "grammar",
    music: "music",
    astronomy: "astronomy",
  },
};

const EXAMPLES: Record<Language, string[]> = {
  ar: ["قَهْوَة", "احمد", "مكتبه", "coral"],
  en: ["coffee", "coral", "أحمد", "كتاب"],
};

const BADGE: Record<MatchMethod, string> = {
  fulltext: "bg-tide text-paper",
  vector: "bg-copper text-paper",
  hybrid: "bg-ink text-paper",
};

function pageHref(lang: Language, query: string): string {
  const params = new URLSearchParams();
  params.set("lang", lang);
  if (query.trim()) params.set("q", query.trim());
  return `/?${params.toString()}`;
}

function excerpt(body: string): string {
  const flat = body.replace(/\s+/g, " ").trim();
  if (flat.length <= 220) return flat;
  return `${flat.slice(0, 220).trimEnd()}…`;
}

function formatNumber(value: number | null, digits: number): string {
  if (value === null) return "—";
  return value.toFixed(digits);
}

export function SearchScreen({
  lang,
  query,
  response,
  realMode,
}: {
  lang: Language;
  query: string;
  response: SearchResponse | null;
  realMode: boolean;
}) {
  const copy = COPY[lang];
  const mode = response?.mode ?? (realMode ? "supabase" : "demo");
  const topics = TOPIC_LABELS[lang];

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} className="min-h-screen">
      <div className="h-1.5 bg-tide" />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10 sm:px-8">
        <header className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <p className="text-sm tracking-wide text-muted">{copy.kicker}</p>
            <nav aria-label={copy.language} className="flex rounded-full border border-line bg-card p-1">
              {(["ar", "en"] as const).map((choice) => {
                const selected = choice === lang;
                return (
                  <a
                    key={choice}
                    href={pageHref(choice, query)}
                    aria-current={selected ? "page" : undefined}
                    className={`rounded-full px-3 py-1 text-sm ${
                      selected ? "bg-tide text-paper" : "text-ink hover:bg-line"
                    }`}
                  >
                    {choice === "ar" ? "العربية" : "English"}
                  </a>
                );
              })}
            </nav>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{copy.title}</h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted">{copy.subtitle}</p>
            <p className="text-sm text-tide">{mode === "supabase" ? copy.live : copy.demo}</p>
          </div>
        </header>

        <form action="/" method="get" className="flex flex-col gap-3" role="search">
          <input type="hidden" name="lang" value={lang} />
          <label htmlFor="q" className="text-sm font-medium">
            {copy.label}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="q"
              name="q"
              defaultValue={query}
              dir="auto"
              maxLength={200}
              placeholder={copy.placeholder}
              autoComplete="off"
              className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-lg outline-none ring-tide focus:ring-2"
            />
            <button
              type="submit"
              className="rounded-2xl bg-tide px-5 py-3 font-medium text-paper hover:bg-ink"
            >
              {copy.submit}
            </button>
          </div>
        </form>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted">{copy.examples}</h2>
          <ul className="flex flex-wrap gap-2">
            {EXAMPLES[lang].map((example) => (
              <li key={example}>
                <a
                  href={pageHref(lang, example)}
                  dir="auto"
                  className="inline-block rounded-full border border-line bg-card px-3 py-1 text-sm hover:border-tide hover:text-tide"
                >
                  {example}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-line bg-card px-5 py-4">
          <h2 className="text-sm font-medium">{copy.pitfallsTitle}</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm leading-relaxed text-muted">
            {copy.pitfalls.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section aria-live="polite" className="flex flex-col gap-4">
          {response?.error ? (
            <p role="alert" className="text-copper">
              {response.error}
            </p>
          ) : null}

          {response ? (
            <p className="text-sm text-muted">
              {copy.normalised}:{" "}
              <span dir="auto" className="font-medium text-ink">
                {response.normalizedQuery || "—"}
              </span>
              <span className="px-2">·</span>
              {response.results.length} {copy.count}
            </p>
          ) : (
            <p className="text-muted">{copy.empty}</p>
          )}

          {response && response.results.length === 0 && !response.error ? (
            <p>{copy.none}</p>
          ) : null}

          <ol className="flex flex-col gap-3">
            {response?.results.map((result) => (
              <li key={result.id} className="rounded-2xl border border-s-4 border-line border-s-copper bg-card px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${BADGE[result.matchedBy]}`}>
                    {copy.method[result.matchedBy]}
                  </span>
                  <span className="text-sm text-muted">
                    {result.language === "ar" ? copy.arabic : copy.english}
                  </span>
                  <code className="text-xs text-muted">{result.id}</code>
                </div>
                <h2 dir="auto" className="mt-3 text-xl font-semibold text-pretty">
                  {result.title}
                </h2>
                <p dir="auto" className="mt-2 leading-relaxed">
                  {excerpt(result.body)}
                </p>
                <p className="mt-3 text-sm text-muted">
                  {result.topics.map((topic) => topics[topic] ?? topic).join(" · ")}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {copy.fts} {formatNumber(result.ftsRank, 3)}
                  <span className="px-1.5">·</span>
                  {copy.vector} {formatNumber(result.vectorSimilarity, 3)}
                  <span className="px-1.5">·</span>
                  {copy.rrf} {formatNumber(result.rrfScore, 4)}
                </p>
                <p className="mt-1 text-sm">{copy.because[result.matchedBy]}</p>
              </li>
            ))}
          </ol>
        </section>

        <footer className="border-t border-line pt-4 text-sm text-muted">MIT License</footer>
      </main>
    </div>
  );
}
