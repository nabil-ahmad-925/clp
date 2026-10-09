/**
 * An album's name as the photo pages show it: without the sport in front ("Fútbol (Soccer) - ADVANCEMENT & WORKSHOPS"
 * -> "Advancement & Workshops"; "Baseball - Leagues / Social Clubs " -> "Leagues / Social Clubs"), all-caps names in
 * title case.
 */
export function albumName(title: string) {
  const name = (title.includes(' - ') ? title.slice(title.indexOf(' - ') + 3) : title).trim();
  if (name !== name.toUpperCase()) return name;
  return name.toLowerCase().replace(/(^|[\s/(&-])(\p{L})/gu, (_, sep: string, c: string) => sep + c.toUpperCase());
}

/** The line under the photo pages' heading. */
export const PHOTOS_BLURB = 'Photos from CLP events, camps and experiences. Find your moments, download them in HD and share them.';
