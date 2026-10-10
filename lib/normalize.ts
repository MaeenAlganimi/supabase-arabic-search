// Arabic orthographic folding shared by the SQL function and the demo ranker.
// Diacritics and tatweel are deleted (not turned into spaces) so a vocalised
// word stays one token. Punctuation becomes a space.

const DIACRITICS_AND_TATWEEL =
  /[\u0610-\u061A\u0640\u064B-\u065F\u0670\u06D6-\u06ED]/g;

const ALEF_VARIANTS = /[\u0622\u0623\u0625\u0671]/g;

const DISALLOWED = /[^\u0621-\u063A\u0641-\u064A\u0660-\u0669A-Za-z0-9\s]/g;

export function normalizeArabic(input: string): string {
  const folded = input
    .replace(DIACRITICS_AND_TATWEEL, "")
    .replace(ALEF_VARIANTS, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[A-Z]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 32));

  return folded.replace(DISALLOWED, " ").replace(/\s+/g, " ").trim();
}
