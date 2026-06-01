import { marked, Renderer } from 'marked';
import type { Tokens } from 'marked';

/**
 * Render markdown to HTML + extract a table of contents.
 *
 * Built against marked v14. Customisations:
 *   - Heading IDs (slugified) so anchors work; collected for the TOC
 *   - <a class="doc-anchor"> for hover-target heading anchors
 *   - Code blocks carry the language as a data attribute
 *   - External links open in a new tab with rel=noopener
 *   - Blockquotes leading with emoji become typed callouts (info / warn / ok)
 *   - Tables wrapped in a scrollable container
 */

export interface TocEntry {
  depth: number;
  id: string;
  text: string;
}

export interface RenderResult {
  html: string;
  toc: TocEntry[];
  /** First non-empty paragraph — used as og:description fallback. */
  excerpt: string;
}

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);

/**
 * Translate raw-doc-folder links into docs-site routes so existing markdown
 * (with relative `.md` references) keeps working unchanged.
 *
 *   "quickstart.md"            → "/quickstart"
 *   "../docs/api.md"           → "/api"
 *   "../docs/api.md#auth"      → "/api#auth"
 *   "https://x.com/foo"        → unchanged
 *   "#section"                 → unchanged
 */
function rewriteHref(href: string): string {
  if (!href) return href;
  if (/^https?:\/\//i.test(href)) return href;
  if (href.startsWith('mailto:') || href.startsWith('#')) return href;

  // Strip any leading path segments like "../docs/" or "docs/"
  const match = href.match(/(?:^|\/)([^\/]+)\.md(#.*)?$/i);
  if (match) {
    const slug = match[1];
    const hash = match[2] ?? '';
    return `/${slug}${hash}`;
  }
  return href;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );
}

export function renderMarkdown(md: string): RenderResult {
  const toc: TocEntry[] = [];
  const usedIds = new Set<string>();

  // Build a fresh renderer. Each override receives the token + a `this`
  // bound to the parser, exposing `parseInline()` for nested rendering.
  class DocsRenderer extends Renderer {
    heading(this: Renderer, token: Tokens.Heading): string {
      const text = token.text;
      let id = slugify(text);
      if (!id) id = `section-${toc.length}`;
      let dedup = id;
      let n = 1;
      while (usedIds.has(dedup)) dedup = `${id}-${++n}`;
      usedIds.add(dedup);
      toc.push({ depth: token.depth, id: dedup, text });
      const inner = this.parser.parseInline(token.tokens);
      return `<h${token.depth} id="${dedup}"><a class="doc-anchor" href="#${dedup}" aria-label="Link to ${escapeHtml(text)}">#</a>${inner}</h${token.depth}>\n`;
    }

    code(this: Renderer, { text, lang }: Tokens.Code): string {
      const language = (lang ?? '').trim() || 'plain';
      return `<pre class="doc-codeblock" data-lang="${escapeHtml(language)}"><code class="lang-${escapeHtml(language)}">${escapeHtml(text)}</code></pre>\n`;
    }

    codespan(_: Renderer extends never ? never : { text: string } | Tokens.Codespan): string {
      const t = (_ as Tokens.Codespan).text;
      return `<code class="doc-code">${escapeHtml(t)}</code>`;
    }

    link(this: Renderer, { href, title, tokens }: Tokens.Link): string {
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      const inner = this.parser.parseInline(tokens);
      const resolvedHref = rewriteHref(href ?? '');
      const external = /^https?:\/\//i.test(resolvedHref) && !resolvedHref.startsWith('https://lifeos.app');
      const extra = external ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${escapeHtml(resolvedHref)}"${titleAttr}${extra}>${inner}</a>`;
    }

    table(this: Renderer, { header, align, rows }: Tokens.Table): string {
      const headHtml =
        '<thead><tr>' +
        header
          .map((cell, i) => {
            const a = align[i] ? ` style="text-align:${align[i]}"` : '';
            return `<th${a}>${this.parser.parseInline(cell.tokens)}</th>`;
          })
          .join('') +
        '</tr></thead>';
      const bodyHtml =
        '<tbody>' +
        rows
          .map(
            (row) =>
              '<tr>' +
              row
                .map((cell, i) => {
                  const a = align[i] ? ` style="text-align:${align[i]}"` : '';
                  return `<td${a}>${this.parser.parseInline(cell.tokens)}</td>`;
                })
                .join('') +
              '</tr>',
          )
          .join('') +
        '</tbody>';
      return `<div class="doc-tablewrap"><table class="doc-table">${headHtml}${bodyHtml}</table></div>\n`;
    }

    blockquote(this: Renderer, { tokens }: Tokens.Blockquote): string {
      const inner = this.parser.parse(tokens);
      if (/^<p>(ℹ️|💡|📝)/.test(inner)) {
        return `<blockquote class="doc-callout doc-callout-info">${inner}</blockquote>\n`;
      }
      if (/^<p>(⚠️|🚨)/.test(inner)) {
        return `<blockquote class="doc-callout doc-callout-warn">${inner}</blockquote>\n`;
      }
      if (/^<p>(✅|🎯)/.test(inner)) {
        return `<blockquote class="doc-callout doc-callout-ok">${inner}</blockquote>\n`;
      }
      return `<blockquote class="doc-callout">${inner}</blockquote>\n`;
    }
  }

  const html = marked.parse(md, {
    gfm: true,
    breaks: false,
    renderer: new DocsRenderer(),
  }) as string;

  const firstParaMatch = html.match(/<p>([^<]+)<\/p>/);
  const excerpt = firstParaMatch ? firstParaMatch[1].trim().slice(0, 200) : '';

  return { html, toc, excerpt };
}
