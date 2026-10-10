import { SearchScreen } from "../components/search-screen";
import { hasSupabaseEnv, runSearch } from "../lib/run-search";
import type { Language } from "../lib/types";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const lang: Language = first(params.lang) === "en" ? "en" : "ar";
  const query = first(params.q).slice(0, 200);
  const response = query.trim() ? await runSearch(query) : null;

  return (
    <SearchScreen
      lang={lang}
      query={query}
      response={response}
      realMode={hasSupabaseEnv()}
    />
  );
}
