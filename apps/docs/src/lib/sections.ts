/**
 * Documentation information architecture.
 *
 * Order in `pages[]` controls the sidebar order and prev/next navigation.
 * Each `slug` maps to a markdown file: docs/<slug>.md.
 *
 * Keep groups small and roughly task-shaped — readers should be able to
 * predict where a given topic lives without searching.
 */

export interface DocPage {
  slug: string;
  title: string;
  description: string;
  /** Filename inside the repo's `docs/` directory. */
  file: string;
}

export interface DocSection {
  id: string;
  title: string;
  description: string;
  pages: DocPage[];
}

export const SECTIONS: DocSection[] = [
  {
    id: 'get-started',
    title: 'Get started',
    description: 'Stand LifeOS up and ship your first content type.',
    pages: [
      {
        slug: 'quickstart',
        title: 'Quickstart',
        description: 'Get a working LifeOS in 10 minutes — Docker, Node, or Kubernetes.',
        file: 'quickstart.md',
      },
      {
        slug: 'cli',
        title: 'Life Command (CLI)',
        description: 'Install life, authenticate, capture notes, drive the API from your terminal.',
        file: 'cli.md',
      },
    ],
  },
  {
    id: 'self-host',
    title: 'Self-host',
    description: 'Production deployment, hardening, and scale.',
    pages: [
      {
        slug: 'self-host',
        title: 'Self-host guide',
        description: 'TLS, secrets, backups, hardening checklist.',
        file: 'self-host.md',
      },
      {
        slug: 'scaling',
        title: 'Scaling beyond one node',
        description: 'Redis pub/sub, rate limiting, sync bus.',
        file: 'scaling.md',
      },
    ],
  },
  {
    id: 'api',
    title: 'API',
    description: 'REST surface for collections, auth, and admin.',
    pages: [
      {
        slug: 'api',
        title: 'REST API reference',
        description: 'Collections, filters, sort, pagination, auth.',
        file: 'api.md',
      },
      {
        slug: 'webhooks',
        title: 'Webhooks',
        description: 'HMAC-signed events, retry semantics, recipes.',
        file: 'webhooks.md',
      },
    ],
  },
  {
    id: 'operations',
    title: 'Operations',
    description: 'Day-2 concerns and roadmap.',
    pages: [
      {
        slug: 'migration-notes',
        title: 'Migration notes',
        description: 'Done, deferred, and remaining technical debt.',
        file: 'migration-notes.md',
      },
    ],
  },
  {
    id: 'legal',
    title: 'Legal',
    description: 'Policies for the hosted product.',
    pages: [
      {
        slug: 'privacy-policy',
        title: 'Privacy policy',
        description: 'Data handling, retention, GDPR/PDPA.',
        file: 'privacy-policy.md',
      },
      {
        slug: 'terms-of-service',
        title: 'Terms of service',
        description: 'Account, AGPL, billing, liability.',
        file: 'terms-of-service.md',
      },
    ],
  },
];

/** Flat ordered list — used for prev/next + slug lookup. */
export const FLAT_PAGES: Array<DocPage & { section: DocSection }> = SECTIONS.flatMap((s) =>
  s.pages.map((p) => ({ ...p, section: s })),
);

export function findPage(slug: string): (DocPage & { section: DocSection }) | undefined {
  return FLAT_PAGES.find((p) => p.slug === slug);
}

export function findNeighbours(slug: string): {
  prev: (DocPage & { section: DocSection }) | null;
  next: (DocPage & { section: DocSection }) | null;
} {
  const idx = FLAT_PAGES.findIndex((p) => p.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? FLAT_PAGES[idx - 1] : null,
    next: idx < FLAT_PAGES.length - 1 ? FLAT_PAGES[idx + 1] : null,
  };
}
