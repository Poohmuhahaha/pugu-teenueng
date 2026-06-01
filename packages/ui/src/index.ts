/**
 * @lifeos/ui — shared design system.
 *
 * Apps should `import '@lifeos/ui/design.css';` exactly once in their layout.
 * This file only exists so the package has a JS entrypoint for tooling
 * (TypeScript module resolution, etc.). It re-exports a small set of token
 * names so non-CSS consumers can reference them programmatically if needed.
 */

export const TOKENS = {
  primary: '#111111',
  ink: '#111111',
  brandAccent: '#3b82f6',
  surfaceDark: '#101010',
  hairline: '#e5e7eb',
} as const;

export type DesignToken = keyof typeof TOKENS;
