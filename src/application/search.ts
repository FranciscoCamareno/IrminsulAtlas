// Search text is normalized identically when indexing and when querying, so
// accents, case and apostrophes never decide whether something is found.
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('es')
    .replace(/['’‘`]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function queryTokens(query: string): string[] {
  const normalized = normalizeText(query);
  return normalized ? normalized.split(' ') : [];
}

// Every token must appear; order is irrelevant.
export function matchesTokens(
  normalizedText: string,
  tokens: readonly string[],
): boolean {
  return tokens.every((token) => normalizedText.includes(token));
}

// Prose is indexed without Markdown link syntax or URLs.
export function plainText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[*_`>#|]/g, ' ');
}
