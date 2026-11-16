/* Turns free text or a voice transcript into a list of foods with counts.
   Example: "2 eggs, a slice of toast with butter and a cup of coffee" ->
   [{eggs,2},{toast,1},{butter,1},{coffee,1}] */
export interface ParsedFood { name: string; count: number; /** true when a number or "a/an" was given */ explicit: boolean }

const NUMS: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, some: 1, half: 0.5 };

export function parseFoods(text: string): ParsedFood[] {
  return text
    .toLowerCase()
    .replace(/\b(i had|i ate|i've had|i have had|i'm having|for (breakfast|lunch|dinner|a snack|snack))\b/g, ',')
    .split(/,|\band\b|\bwith\b|\bplus\b|\+|;|\n/)
    .map(s => s.replace(/[.!?"]/g, '').trim())
    .filter(Boolean)
    .map(s => {
      let count = 1;
      let explicit = false;
      const m = s.match(/^(\d+(?:\.\d+)?|a|an|one|two|three|four|five|six|some|half)\s+/);
      if (m) { count = NUMS[m[1]] ?? parseFloat(m[1]); explicit = m[1] !== 'some'; s = s.slice(m[0].length); }
      s = s.replace(/^(cups?|glass(es)?|bowls?|slices?|pieces?|plates?|servings?|handfuls?|mugs?|bottles?|cans?|tablespoons?|tbsp|teaspoons?|tsp)\s+(of\s+)?/, '')
        .replace(/^(of|the|my|some)\s+/, '')
        .trim();
      return s.length > 1 ? { name: s, count, explicit } : null;
    })
    .filter((x): x is ParsedFood => x !== null)
    .slice(0, 10);
}
