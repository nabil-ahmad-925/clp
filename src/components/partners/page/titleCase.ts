/** Short joining words kept small inside a heading. */
const SMALL_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'vs', 'with']);

/** A heading in Title Case ("Game Day", "Teams in Action"): each word capitalised, the short joining words kept small. */
export const titleCase = (text: string) =>
  text.replace(/\S+/g, (w, i: number) => (i > 0 && SMALL_WORDS.has(w.toLowerCase()) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1)));
