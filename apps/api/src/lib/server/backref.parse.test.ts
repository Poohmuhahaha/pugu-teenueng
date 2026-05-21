import { describe, it, expect } from 'vitest';
import { parseWikiLinks, renderWikiLinks } from '@lifeos/core';

describe('parseWikiLinks edge cases', () => {
  it('extracts simple links', () => {
    const r = parseWikiLinks('See [[Alice]] and [[Bob]] today.');
    expect(r.length).toBe(2);
    expect(r[0].target).toBe('Alice');
    expect(r[1].target).toBe('Bob');
  });

  it('extracts alias variant', () => {
    const r = parseWikiLinks('Hi [[Alice|the architect]].');
    expect(r.length).toBe(1);
    expect(r[0].target).toBe('Alice');
    expect(r[0].alias).toBe('the architect');
  });

  it('captures offsets that match the source string', () => {
    const text = 'leading [[Alice]] trailing';
    const r = parseWikiLinks(text);
    expect(text.slice(r[0].offset, r[0].offset + '[[Alice]]'.length)).toBe('[[Alice]]');
  });

  it('ignores nested or broken brackets', () => {
    expect(parseWikiLinks('[[]]').length).toBe(0); // empty target rejected by [^\[\]\|]+? (non-empty)
    expect(parseWikiLinks('[[unclosed').length).toBe(0);
    expect(parseWikiLinks('text [single] only').length).toBe(0);
  });

  it('returns an empty array for empty input', () => {
    expect(parseWikiLinks('')).toEqual([]);
  });

  it('renderWikiLinks replaces with callback output', () => {
    const out = renderWikiLinks('A [[X]] and [[Y|why]] B', (t, alias) => `<a>${alias ?? t}</a>`);
    expect(out).toBe('A <a>X</a> and <a>why</a> B');
  });

  it('renderWikiLinks does not double-process when callback returns links', () => {
    // Idempotent on a single pass — callback output is not re-scanned
    const out = renderWikiLinks('[[A]]', (t) => `[[${t}_again]]`);
    expect(out).toBe('[[A_again]]');
  });
});
