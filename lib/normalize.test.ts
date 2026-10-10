import { describe, expect, it } from "vitest";
import { normalizeArabic } from "./normalize";

describe("normalizeArabic", () => {
  it("strips tashkeel and tatweel without splitting the word", () => {
    expect(normalizeArabic("القَهْوَةُ")).toBe("القهوه");
    expect(normalizeArabic("مَكْتَبَة")).toBe("مكتبه");
    expect(normalizeArabic("عَلَى")).toBe("علي");
    expect(normalizeArabic("مجلــــس")).toBe("مجلس");
    expect(normalizeArabic("قهــــوة")).toBe("قهوه");
    expect(normalizeArabic("ًٌٍَُِّْـ")).toBe("");
  });

  it("folds alef variants, alef maksura, and teh marbuta", () => {
    expect(normalizeArabic("أحمد")).toBe("احمد");
    expect(normalizeArabic("أَحْمَد")).toBe("احمد");
    expect(normalizeArabic("إسلام")).toBe("اسلام");
    expect(normalizeArabic("آداب")).toBe("اداب");
    expect(normalizeArabic("ٱلعلم")).toBe("العلم");
    expect(normalizeArabic("على")).toBe("علي");
    expect(normalizeArabic("مكتبة")).toBe("مكتبه");
  });

  it("keeps hamza carriers that are not alef", () => {
    expect(normalizeArabic("مُؤَلِّف")).toBe("مؤلف");
    expect(normalizeArabic("هيئة")).toBe("هيئه");
  });

  it("lowercases ASCII, drops punctuation, and collapses space", () => {
    expect(normalizeArabic("  The   BOOK  ")).toBe("the book");
    expect(normalizeArabic("مرحبا، عالم!")).toBe("مرحبا عالم");
  });

  it("is idempotent", () => {
    const once = normalizeArabic("قَهْوَةُ أَحْمَد في المَكْتَبَةِ، على مجلــــس!");
    expect(once).toBe("قهوه احمد في المكتبه علي مجلس");
    expect(normalizeArabic(once)).toBe(once);
  });
});
