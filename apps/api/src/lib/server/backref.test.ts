import { describe, it, expect } from 'vitest';
import { parseWikiLinks, renderWikiLinks } from '@lifeos/core';

describe('parseWikiLinks', () => {
  it('extracts single link', () => {
    const links = parseWikiLinks('See [[Alice]] for context.');
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({ target: 'Alice', offset: 4 });
    expect(links[0].alias).toBeUndefined();
  });

  it('extracts alias', () => {
    const links = parseWikiLinks('Refs [[Project X|the thing]] here.');
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({ target: 'Project X', alias: 'the thing' });
  });

  it('handles multiple links in one string', () => {
    const links = parseWikiLinks('[[A]] and [[B]] and [[C|see-here]]');
    expect(links).toHaveLength(3);
    expect(links.map((l) => l.target)).toEqual(['A', 'B', 'C']);
  });

  it('ignores empty string and missing brackets', () => {
    expect(parseWikiLinks('')).toEqual([]);
    expect(parseWikiLinks('just normal text [no brackets]')).toEqual([]);
  });

  it('round-trips through renderWikiLinks', () => {
    const text = 'See [[Alice|the architect]] then [[Bob]] tomorrow.';
    const rendered = renderWikiLinks(text, (t, a) => `<a>${a ?? t}</a>`);
    expect(rendered).toBe('See <a>the architect</a> then <a>Bob</a> tomorrow.');
  });
});
