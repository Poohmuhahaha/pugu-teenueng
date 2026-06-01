import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { findPage, findNeighbours, FLAT_PAGES } from '$lib/sections';
import { renderMarkdown } from '$lib/markdown';
import type { PageServerLoad } from './$types';

export const prerender = true;

/** Tell the static adapter every slug to prerender. */
export function entries() {
  return FLAT_PAGES.map((p) => ({ slug: p.slug }));
}

/**
 * Repo's `docs/` directory, resolved relative to the app's cwd at build/dev time.
 * Vite/SvelteKit both run from apps/docs, so two levels up reaches the repo root.
 */
const DOCS_ROOT = resolve(process.cwd(), '../../docs');

export const load: PageServerLoad = async ({ params }) => {
  const page = findPage(params.slug);
  if (!page) throw error(404, `No doc page for "${params.slug}"`);

  let markdown: string;
  try {
    markdown = await readFile(resolve(DOCS_ROOT, page.file), 'utf-8');
  } catch {
    throw error(500, `Could not load ${page.file} from ${DOCS_ROOT}`);
  }

  const { html, toc, excerpt } = renderMarkdown(markdown);
  const neighbours = findNeighbours(params.slug);

  return {
    page,
    html,
    toc,
    excerpt,
    prev: neighbours.prev,
    next: neighbours.next,
  };
};
