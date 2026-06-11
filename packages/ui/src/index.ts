/**
 * @questpage/ui — shared design system.
 *
 * Apps should `import '@questpage/ui/design.css';` exactly once in their layout.
 * This file only exists so the package has a JS entrypoint for tooling
 * (TypeScript module resolution, etc.). It re-exports a small set of token
 * names so non-CSS consumers can reference them programmatically if needed.
 */

export const TOKENS = {
  primary: '#3A2616',
  ink: '#3A2616',
  brandAccent: '#F7B35A',
  surfaceDark: '#3A2616',
  hairline: '#B97A3A',
} as const;

export type DesignToken = keyof typeof TOKENS;

export {
  EASING,
  DURATIONS,
  prefersReducedMotion,
  animate,
  inView,
  stagger,
  reveal,
  staggerChildren,
  countUp,
  pageTransition,
  type RevealOpts,
  type CountUpOpts,
} from './motion.js';

// Note: springPress is intentionally not re-exported. Buttons should not
// animate on press in this design system — use CSS :active for feedback
// instead. The function still exists in motion.ts if anyone wants it back
// for non-button surfaces.
