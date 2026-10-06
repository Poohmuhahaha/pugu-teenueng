/**
 * @pugu/ui — animation utilities (DISABLED).
 *
 * Animations have been intentionally removed from the project. All helpers
 * here are kept as no-op shims so existing import sites continue to compile,
 * but they perform no DOM mutation and no scheduling. countUp writes the
 * final value directly so numeric displays show the real number instead of 0.
 *
 * If animations are ever re-introduced, restore implementations against
 * `motion` (https://motion.dev) — see git history for the previous version.
 */

export const EASING = {
  standard: [0.4, 0, 0.2, 1] as const,
  entrance: [0.16, 1, 0.3, 1] as const,
  exit: [0.7, 0, 0.84, 0] as const,
  spring: 'spring(1, 100, 10, 0)' as const,
};

export const DURATIONS = {
  fast: 0,
  base: 0,
  slow: 0,
  hero: 0,
};

export function prefersReducedMotion(): boolean {
  // Project-wide: treat motion as disabled regardless of OS setting.
  return true;
}

type NoopHandle = { destroy(): void };

// Generic no-op shims preserving the previous public surface.
export function animate(..._args: unknown[]): { finished: Promise<void>; stop(): void } {
  return { finished: Promise.resolve(), stop() {} };
}

export function inView(_node: Element, callback: () => unknown, _opts?: unknown): () => void {
  // Fire the visibility callback immediately, since we no longer wait for IO.
  try { callback(); } catch { /* swallow */ }
  return () => {};
}

export function stagger(_gap?: number, _opts?: unknown): number {
  return 0;
}

export interface RevealOpts {
  delay?: number;
  duration?: number;
  y?: number;
  scale?: number;
  repeat?: boolean;
  margin?: string;
}

export function reveal(_node: HTMLElement, _opts: RevealOpts = {}): NoopHandle {
  return { destroy() {} };
}

export function staggerChildren(
  _root: HTMLElement,
  _selector: string,
  _opts: { duration?: number; gap?: number; y?: number } = {},
): void {
  /* no-op */
}

export function springPress(_node: HTMLElement): NoopHandle {
  return { destroy() {} };
}

export interface CountUpOpts {
  to: number;
  duration?: number;
  format?: (n: number) => string;
}

export function countUp(
  node: HTMLElement,
  opts: CountUpOpts,
): { destroy(): void; update(o: CountUpOpts): void } {
  const write = (o: CountUpOpts) => {
    const fmt = o.format ?? ((n: number) => String(n));
    node.textContent = fmt(o.to);
  };
  write(opts);
  return {
    destroy() {},
    update(o: CountUpOpts) { write(o); },
  };
}

export function pageTransition(
  _node: Element,
  _params: { duration?: number; direction?: 1 | -1 } = {},
): { duration: number; easing: (t: number) => number; css: (t: number, u: number) => string } {
  return { duration: 0, easing: (t) => t, css: () => '' };
}
