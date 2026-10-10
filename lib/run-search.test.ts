import { afterEach, describe, expect, it } from "vitest";
import { runSearch } from "./run-search";

const previous = {
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_ANON_KEY,
};

afterEach(() => {
  if (previous.url === undefined) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = previous.url;
  if (previous.key === undefined) delete process.env.SUPABASE_ANON_KEY;
  else process.env.SUPABASE_ANON_KEY = previous.key;
});

describe("runSearch", () => {
  it("uses the in-memory ranker when no keys are set", async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    const response = await runSearch("قَهْوَة");
    expect(response.mode).toBe("demo");
    expect(response.normalizedQuery).toBe("قهوه");
    expect(response.error).toBeUndefined();
    expect(response.results.some((result) => result.id === "coffee-yemen-ar")).toBe(true);
  });
});
