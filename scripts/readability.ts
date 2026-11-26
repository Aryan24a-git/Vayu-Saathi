import fs from 'node:fs';

const locale = JSON.parse(fs.readFileSync('src/i18n/en.json', 'utf8')) as object;
const strings = collectStrings(locale);
const offenders = strings.filter((text) => grade(text) > 9);

for (const text of strings) {
  console.log(JSON.stringify({ grade: Number(grade(text).toFixed(2)), text }));
}
if (offenders.length) {
  console.error(`Readability failures: ${offenders.length} strings above grade 9`);
  process.exit(1);
}
console.log(JSON.stringify({ checked: strings.length, maxGrade: 9, pass: true }));

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}

function grade(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 5) return 0;
  const sentences = Math.max(1, text.split(/[.!?]+/).filter((part) => part.trim()).length);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  return 0.39 * (words.length / sentences) + 11.8 * (syllables / Math.max(1, words.length)) - 15.59;
}

function countSyllables(word: string): number {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!normalized) return 0;
  const groups = normalized.match(/[aeiouy]+/g);
  return Math.max(1, (groups?.length ?? 1) - (/e$/.test(normalized) ? 1 : 0));
}
