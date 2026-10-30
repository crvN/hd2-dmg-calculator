function compact(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

/** Every typed word must appear in the name, ignoring case and punctuation, so "rs422" finds "RS-422 Railgun". */
export function matchesSearch(name: string, query: string): boolean {
  const compactName = compact(name);
  return query
    .split(/\s+/)
    .every((word) => compactName.includes(compact(word)));
}
