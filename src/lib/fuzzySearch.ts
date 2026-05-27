/**
 * Lightweight fuzzy search for Genshin characters.
 * Supports: substring match, abbreviation match, alias lookup, diacritics-insensitive.
 */

/** Common aliases and abbreviations → character slug */
const ALIASES: Record<string, string> = {
  // Shortened / nickname aliases
  "raid": "raiden-shogun",
  "raiden": "raiden-shogun",
  "ei": "raiden-shogun",
  "shogun": "raiden-shogun",
  "hutao": "hu-tao",
  "ht": "hu-tao",
  "walnut": "hu-tao",
  "kaz": "kaedehara-kazuha",
  "kazuha": "kaedehara-kazuha",
  "yae": "yae-miko",
  "miko": "yae-miko",
  "ayaka": "kamisato-ayaka",
  "ayato": "kamisato-ayato",
  "itto": "arataki-itto",
  "sara": "kujou-sara",
  "kokomi": "sangonomiya-kokomi",
  "shinobu": "kuki-shinobu",
  "kuki": "kuki-shinobu",
  "heizou": "shikanoin-heizou",
  "tao": "hu-tao",
  "childe": "tartaglia",
  "ajax": "tartaglia",
  "zhongli": "zhongli",
  "venti": "venti",
  "ganyu": "ganyu",
  "xiao": "xiao",
  "klee": "klee",
  "albedo": "albedo",
  "eula": "eula",
  "yelena": "yelan",
  "yelan": "yelan",
  "nahida": "nahida",
  "kusanali": "nahida",
  "cyno": "cyno",
  "nilou": "nilou",
  "tighnari": "tighnari",
  "alhaitham": "alhaitham",
  "al": "alhaitham",
  "haitham": "alhaitham",
  "dehya": "dehya",
  "wanderer": "wanderer",
  "scaramouche": "wanderer",
  "scara": "wanderer",
  "furina": "furina",
  "neuvillette": "neuvillette",
  "neuvi": "neuvillette",
  "neuve": "neuvillette",
  "wriothesley": "wriothesley",
  "wrio": "wriothesley",
  "navia": "navia",
  "clorinde": "clorinde",
  "sigewinne": "sigewinne",
  "emilie": "emilie",
  "chiori": "chiori",
  "xianyun": "xianyun",
  "gaming": "gaming",
  "chevreuse": "chevreuse",
  "chev": "chevreuse",
  "arlecchino": "arlecchino",
  "arle": "arlecchino",
  "knave": "arlecchino",
  "lyney": "lyney",
  "lynette": "lynette",
  "freminet": "freminet",
  "charlotte": "charlotte",
  "kinich": "kinich",
  "mualani": "mualani",
  "xilonen": "xilonen",
  "chasca": "chasca",
  "iansan": "iansan",
  "mavuika": "mavuika",
  "citlali": "citlali",
  "varesa": "varesa",
  "yumkasaur": "yumkasaur",
  "bennett": "bennett",
  "ben": "bennett",
  "xl": "xiangling",
  "xiangling": "xiangling",
  "xq": "xingqiu",
  "xingqiu": "xingqiu",
  "fischl": "fischl",
  "fish": "fischl",
  "beidou": "beidou",
  "ning": "ningguang",
  "ningguang": "ningguang",
  "zl": "zhongli",
  "qiqi": "qiqi",
  "keqing": "keqing",
  "kq": "keqing",
  "diluc": "diluc",
  "jean": "jean",
  "mona": "mona",
  "sucrose": "sucrose",
  "diona": "diona",
  "chongyun": "chongyun",
  "razor": "razor",
  "noelle": "noelle",
  "barbara": "barbara",
  "amber": "amber",
  "kaeya": "kaeya",
  "lisa": "lisa",
  "rosaria": "rosaria",
  "yanfei": "yanfei",
  "thoma": "thoma",
  "yoimiya": "yoimiya",
  "yoi": "yoimiya",
  "shenhe": "shenhe",
  "yun": "yun-jin",
  "yunjin": "yun-jin",
  "gorou": "gorou",
  "sayu": "sayu",
  "xinyan": "xinyan",
  "dori": "dori",
  "collei": "collei",
  "candace": "candace",
  "layla": "layla",
  "faruzan": "faruzan",
  "baizhu": "baizhu",
  "kaveh": "kaveh",
  "kirara": "kirara",
  "mika": "mika",
  "sethos": "sethos",
  "traveler": "traveler",
  "aether": "traveler",
  "lumine": "traveler",
  "mc": "traveler",
};

/** Normalize a string for fuzzy comparison */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9]/g, "");     // strip non-alphanumeric
}

/** Check if query chars appear in order within target (subsequence match) */
function isSubsequence(query: string, target: string): boolean {
  let qi = 0;
  for (let ti = 0; ti < target.length && qi < query.length; ti++) {
    if (query[qi] === target[ti]) qi++;
  }
  return qi === query.length;
}

/** Score a match — higher is better. Returns 0 if no match. */
function scoreMatch(query: string, name: string, id: string): number {
  const normQ = normalize(query);
  const normName = normalize(name);
  const normId = normalize(id);

  if (!normQ) return 1; // Empty query matches everything

  // Exact match on id or name
  if (normName === normQ || normId === normQ) return 100;

  // Starts with
  if (normName.startsWith(normQ)) return 90;
  if (normId.startsWith(normQ)) return 85;

  // Contains as substring
  if (normName.includes(normQ)) return 70;
  if (normId.includes(normQ)) return 65;

  // Word starts with (e.g., "kaz" matches "kaedehara-kazuha" on second word)
  const words = name.toLowerCase().split(/[\s\-]+/);
  for (const word of words) {
    if (normalize(word).startsWith(normQ)) return 75;
  }

  // Subsequence match (e.g., "rdn" matches "raiden")
  if (normQ.length >= 2 && isSubsequence(normQ, normName)) return 40;
  if (normQ.length >= 2 && isSubsequence(normQ, normId)) return 35;

  return 0;
}

export type FuzzyResult<T> = {
  item: T;
  score: number;
};

/**
 * Fuzzy search characters.
 * @returns Filtered and sorted results (highest relevance first)
 */
export function fuzzySearchCharacters<T extends { id: string; name: string }>(
  query: string,
  characters: T[],
): FuzzyResult<T>[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return characters.map((item) => ({ item, score: 1 }));
  }

  // Check alias first
  const aliasTarget = ALIASES[trimmed] ?? ALIASES[normalize(trimmed)];

  const results: FuzzyResult<T>[] = [];

  for (const character of characters) {
    // If query matches an alias, boost that character
    if (aliasTarget && character.id === aliasTarget) {
      results.push({ item: character, score: 95 });
      continue;
    }

    const score = scoreMatch(trimmed, character.name, character.id);
    if (score > 0) {
      results.push({ item: character, score });
    }
  }

  // Sort by score descending, then alphabetically
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.item.name.localeCompare(b.item.name);
  });

  return results;
}

/**
 * Simple search — returns just the filtered items (no scores).
 */
export function fuzzyFilter<T extends { id: string; name: string }>(
  query: string,
  characters: T[],
): T[] {
  return fuzzySearchCharacters(query, characters).map((r) => r.item);
}
