import type Lenis from "lenis"

/**
 * Smooth scrolling — shared singleton access for the public Archive.
 *
 * The ArchiveShell mounts a Lenis instance (see
 * components/archive/smooth-scroll.tsx) that adds a subtle, weighted inertia
 * to mouse-wheel and trackpad scrolling. The instance is deliberately kept
 * in this module (not React context) so ANY code — view routers, record
 * indexes, future features — can route programmatic scrolling through the
 * active Lenis without prop drilling:
 *
 *   - `smoothScrollTo(target)`   → premium smooth scroll (anchors, sections)
 *   - `scrollToTopImmediate()`   → instant reset (view transitions)
 *
 * Users who request `prefers-reduced-motion` never get Lenis; every helper
 * degrades to native scrolling (instant for reduced motion, smooth for the
 * rare no-Lenis path). Touch scrolling is never hijacked — Lenis runs with
 * syncTouch disabled, so phones and tablets keep their native feel.
 */

let lenisInstance: Lenis | null = null

/** Set by the SmoothScroll provider on mount; cleared on unmount/destroy. */
export function setLenisInstance(lenis: Lenis | null) {
  lenisInstance = lenis
}

/** The active Lenis instance, or null when disabled (admin, reduced motion). */
export function getLenis(): Lenis | null {
  return lenisInstance
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export interface SmoothScrollOptions {
  /** Vertical pixel offset applied to the target position (negative = stop above). */
  offset?: number
  /** Skip animation entirely (used for view-change resets). */
  immediate?: boolean
}

/**
 * Smoothly scroll to a target — an element, an id selector ("#overview"),
 * or an absolute pixel position. Routes through the active Lenis instance
 * when available; otherwise falls back to native scrolling (instant under
 * prefers-reduced-motion, smooth otherwise).
 */
export function smoothScrollTo(
  target: HTMLElement | string | number,
  options: SmoothScrollOptions = {}
) {
  if (typeof window === "undefined") return

  const { offset = 0, immediate = false } = options

  // Resolve string selectors to elements (ids only — archive anchors).
  if (typeof target === "string") {
    const id = target.startsWith("#") ? target.slice(1) : target
    const el = document.getElementById(id)
    if (!el) return
    target = el
  }

  const lenis = getLenis()
  if (lenis) {
    lenis.scrollTo(target, { offset, immediate, force: true })
    return
  }

  // Native fallback.
  if (immediate || prefersReducedMotion()) {
    const top =
      typeof target === "number"
        ? target
        : target.getBoundingClientRect().top + window.scrollY + offset
    window.scrollTo({ top: Math.max(0, top), behavior: "auto" })
    return
  }

  if (typeof target === "number") {
    window.scrollTo({ top: target, behavior: "smooth" })
  } else {
    // scrollIntoView respects CSS scroll-margin-top (set on archive sections).
    target.scrollIntoView({ behavior: "smooth", block: "start" })
  }
}

/**
 * Instant top-of-page reset used when switching archive views. With Lenis
 * active this must go through the instance — a raw window.scrollTo would
 * fight the virtual scroll position.
 */
export function scrollToTopImmediate() {
  const lenis = getLenis()
  if (lenis) {
    lenis.scrollTo(0, { immediate: true, force: true })
    return
  }
  window.scrollTo({ top: 0 })
}
