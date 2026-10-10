import { runSearch } from "../../../lib/run-search";
import { clampMatchCount } from "../../../lib/search";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const matchCount = clampMatchCount(Number(url.searchParams.get("limit") ?? "8"));
  const payload = await runSearch(query, matchCount);
  return Response.json(payload, { status: payload.error ? 502 : 200 });
}
