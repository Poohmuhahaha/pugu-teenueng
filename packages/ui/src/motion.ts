/**
 * @lifeos/ui — animation utilities built on Motion One.
 *
 * Design goals:
 *   - Reduced-motion safe by default. If the OS reports prefers-reduced-motion,
 *     all helpers degrade to instant state changes (no transforms, no opacity).
 *   - Zero-cost when not used — Motion One is tree-shaken; helpers are pure
 *     functions, callers opt in per surface.
 *   - SvelteKit / SSR safe — every helper short-circuits when `window` is
 *     undefined so server-side rendering doesn't break.
 *
 * Public API:
 *   reveal(node, opts?)               — Svelte action: fade-up when scrolled into view
 *   stagger(selector, opts?)          — animate matching children with a stagger delay
 *   animate(node|selector, kf, opts?) — one-shot animation (motion passthrough)
 *   inView(node, callback)            — IntersectionObserver wrapper (motion passthrough)
 *   springPress(node)                 — Svelte action: spring scale on pointerdown
 *   countUp(node, to, opts?)          — animate a numeric textContent from 0 → to
 *   prefersReducedMotion()            — boolean
 *   pageTransition(direction?)        — Svelte transition function for {in:|out:}
 *
 * EASING tokens — keep movement coherent across surfaces:
 *   EASING.standard  — generic UI motion
 *   EASING.entrance  — out-cubic, things appearing
 *   EASING.exit      — in-cubic, things leaving
 *   EASING.spring    — soft spring for pressables
 */

import { animate as motionAnimate, inView as motionInView, stagger as motionStagger } from 'motion';

export const EASING = {
  standard: [0.4, 0, 0.2, 1] as const,
  entrance: [0.16, 1, 0.3, 1] as const, // ease-out-quint feel
  exit: [0.7, 0, 0.84, 0] as const,
  spring: 'spring(1, 100, 10, 0)' as const,
};

export const DURATIONS = {
  fast: 0.18,
  base: 0.32,
  slow: 0.5,
  hero: 0.7,
};

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true; // no DOM → no animation
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Re-exports for callers that want raw Motion access. */
export const animate = motionAnimate;
export const inView = motionInView;
export const stagger = motionStagger;

/**
 * Svelte action — fades a node up from below as it scrolls into the viewport.
 *
 *   <div use:reveal>…</div>
 *   <div use:reveal={{ delay: 0.1, y: 24 }}>…</div>
 *
 * Once-only by default; set `repeat: true` to re-animate on every entry.
 */
export interface RevealOpts {
  delay?: number;
  duration?: number;
  y?: number;
  scale?: number;
  /** Re-trigger every time the element re-enters the viewport. */
  repeat?: boolean;
  /** Margin around the root; e.g. "0px 0px -80px 0px" fires earlier from the bottom. */
  margin?: string;
}

export function reveal(node: HTMLElement, opts: RevealOpts = {}): { destroy(): void } {
  if (typeof window === 'undefined') return { destroy() {} };

  const reduced = prefersReducedMotion();
  const y = opts.y ?? 16;
  const duration = opts.duration ?? DURATIONS.base;
  const delay = opts.delay ?? 0;
  const margin = opts.margin ?? '0px 0px -10% 0px';

  // Initial state — applied immediately so the element doesn't flash visible
  // before the IO callback fires.
  if (!reduced) {
    node.style.opacity = '0';
    node.style.transform = opts.scale
      ? `translateY(${y}px) scale(${opts.scale})`
      : `translateY(${y}px)`;
    node.style.willChange = 'opacity, transform';
  }

  let cleanup: (() => void) | undefined;
  cleanup = motionInView(
    node,
    () => {
      if (reduced) {
        node.style.opacity = '';
        node.style.transform = '';
        node.style.willChange = '';
      } else {
        motionAnimate(
          node,
          {
            opacity: [0, 1],
            transform: opts.scale
              ? [`translateY(${y}px) scale(${opts.scale})`, 'translateY(0) scale(1)']
              : [`translateY(${y}px)`, 'translateY(0)'],
          },
          { duration, delay, easing: EASING.entrance },
        ).finished.then(() => {
          // Clear hints once the animation lands so we don't pin GPU layers.
          node.style.willChange = '';
        });
      }
      if (!opts.repeat) return undefined;
      // For repeat: return a leave handler that resets the node when it exits view.
      return () => {
        if (!reduced) {
          motionAnimate(node, { opacity: [1, 0] }, { duration: 0.2 });
        }
      };
    },
    { margin },
  );

  return {
    destroy() {
      cleanup?.();
    },
  };
}

/**
 * Animate matching children of `root` with a stagger delay between them.
 *
 *   onMount(() => staggerChildren(node, '> *', { duration: 0.4, gap: 0.06 }));
 */
export function staggerChildren(
  root: HTMLElement,
  selector: string,
  opts: { duration?: number; gap?: number; y?: number } = {},
): void {
  if (typeof window === 'undefined' || prefersReducedMotion()) return;
  const targets = Array.from(root.querySelectorAll<HTMLElement>(selector));
  if (targets.length === 0) return;

  const y = opts.y ?? 16;
  motionAnimate(
    targets,
    {
      opacity: [0, 1],
      transform: [`translateY(${y}px)`, 'translateY(0)'],
    },
    {
      duration: opts.duration ?? DURATIONS.base,
      easing: EASING.entrance,
      delay: motionStagger(opts.gap ?? 0.06),
    },
  );
}

/**
 * Svelte action — pointerdown spring shrink, release back to 1.
 * Layer on top of any clickable: <button use:springPress>…</button>
 */
export function springPress(node: HTMLElement): { destroy(): void } {
  if (typeof window === 'undefined' || prefersReducedMotion()) return { destroy() {} };

  const down = () => {
    motionAnimate(node, { transform: 'scale(0.97)' }, { duration: 0.08 });
  };
  const up = () => {
    motionAnimate(node, { transform: 'scale(1)' }, { duration: 0.18, easing: EASING.spring });
  };
  node.addEventListener('pointerdown', down);
  node.addEventListener('pointerup', up);
  node.addEventListener('pointerleave', up);

  return {
    destroy() {
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointerleave', up);
    },
  };
}

/**
 * Animates the textContent of a node from 0 to `to`. Only fires once.
 *
 *   <div use:countUp={{ to: 1247 }}>0</div>
 */
export interface CountUpOpts {
  to: number;
  duration?: number;
  /** Reapply formatting after each tick — e.g. toLocaleString. */
  format?: (n: number) => string;
}

export function countUp(node: HTMLElement, opts: CountUpOpts): { destroy(): void; update(o: CountUpOpts): void } {
  let finished = false;
  let cleanup: (() => void) | undefined;

  const run = (target: number, duration: number, format: (n: number) => string) => {
    if (typeof window === 'undefined') return;
    if (prefersReducedMotion()) {
      node.textContent = format(target);
      return;
    }
    const controls = motionAnimate(0, target, {
      duration,
      easing: EASING.standard,
      onUpdate(value) {
        node.textContent = format(Math.round(value));
      },
    });
    cleanup = () => controls.stop();
  };

  // Fire when the node enters view, once
  if (typeof window !== 'undefined') {
    const fireOnce = motionInView(node, () => {
      if (finished) return undefined;
      finished = true;
      run(opts.to, opts.duration ?? 1.2, opts.format ?? ((n) => String(n)));
      return undefined;
    });
    cleanup = () => fireOnce();
  }

  return {
    destroy() {
      cleanup?.();
    },
    update(o: CountUpOpts) {
      // Live-update: re-run if `to` changes
      if (o.to !== opts.to) {
        finished = false;
        opts = o;
        run(o.to, o.duration ?? 1.2, o.format ?? ((n) => String(n)));
      }
    },
  };
}

/**
 * Svelte `{in:|out:}` transition — soft crossfade-up.
 *
 *   {#key path} <div in:pageTransition>…</div> {/key}
 */
export function pageTransition(
  _node: Element,
  _params: { duration?: number; direction?: 1 | -1 } = {},
): {
  duration: number;
  easing: (t: number) => number;
  css: (t: number, u: number) => string;
} {
  const duration = (_params.duration ?? DURATIONS.base) * 1000;
  const direction = _params.direction ?? 1;
  if (prefersReducedMotion()) {
    return { duration: 0, easing: (t) => t, css: () => '' };
  }
  return {
    duration,
    // Out-quint
    easing: (t) => 1 - Math.pow(1 - t, 5),
    css: (t, u) => `opacity: ${t}; transform: translateY(${u * 8 * direction}px);`,
  };
}
