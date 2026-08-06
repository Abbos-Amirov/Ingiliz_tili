/** Picks a random word, avoiding an immediate repeat of `previous` when possible. */
export function pickMotivationWord(words: string[], previous: string | null): string | null {
  if (words.length === 0) return null;
  let word = words[Math.floor(Math.random() * words.length)];
  while (word === previous && words.length > 1) {
    word = words[Math.floor(Math.random() * words.length)];
  }
  return word;
}
