"use client"

import { useEffect } from "react"
import Lenis from "lenis"
import { useArchiveUI } from "@/store/ui-store"
import { getLenis, setLenisInstance, smoothScrollTo } from "@/lib/smooth-scroll"

/**
 * SmoothScroll — subtle inertial scrolling for the public Archive.
 *
 * Mounted inside ArchiveShell (public views only — the admin CMS keeps
 * native scrolling). Configuration targets a premium, weighted feel:
 *   - lerp 0.12 settles quickly: responsive, never floaty
 *   - wheelMultiplier 1: no acceleration, input latency stays low
 *   - syncTouch disabled: phones/tablets keep native touch scrolling
 *
 * The provider also owns in-page anchor navigation: clicks on
 * `a[href^="#..."]` (the Record Index, section links) are routed through
 * the active Lenis instance — or a native smooth scroll when Lenis is off —
 * with an offset that clears the sticky header. Reduced-motion users get
 * instant jumps. While the global Archive search overlay is open, Lenis is
 * paused so the page behind the dialog cannot drift.
 */
export function SmoothScroll() {
  const searchOpen = useArchiveUI((s) => s.searchOpen)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    let lenis: Lenis | null = null
    let rafId = 0
    let disposed = false

    const start = () => {
      if (lenis || disposed) return
      lenis = new Lenis({
        // Subtle premium inertia — fast settle, low latency, not cinematic.
        lerp: 0.12,
        smoothWheel: true,
        syncTouch: false, // preserve native touch scrolling on mobile
        touchMultiplier: 1,
        wheelMultiplier: 1,
        gestureOrientation: "vertical",
      })
      setLenisInstance(lenis)
      const raf = (time: number) => {
        lenis?.raf(time)
        rafId = requestAnimationFrame(raf)
      }
      rafId = requestAnimationFrame(raf)
    }

    const stop = () => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = 0
      lenis?.destroy()
      lenis = null
      setLenisInstance(null)
    }

    if (!media.matches) start()

    // Correct hash landings (initial load / refresh with #section): the
    // browser's own deferred anchor scroll ignores the sticky-header offset
    // and can fire after content renders. Retry until the section exists,
    // then re-assert the position a few times to win that race.
    const hash = window.location.hash
    if (hash && hash.length > 1) {
      let attempts = 0
      let landed = false
      const land = () => {
        if (disposed) return
        const element = document.getElementById(hash.slice(1))
        if (!element) {
          if (++attempts < 90) requestAnimationFrame(land) // ≈ 1.5s at 60fps
          return
        }
        const top = element.getBoundingClientRect().top
        // Re-assert while the browser's deferred anchor scroll misplaces it.
        if (!landed || Math.abs(top - 112) > 4) {
          landed = true
          smoothScrollTo(element, { offset: -112, immediate: true })
        }
        if (++attempts < 150) requestAnimationFrame(land) // keep watching ≈ 2.5s
      }
      requestAnimationFrame(land)
    }

    // Honour live changes of the OS-level motion preference.
    const onMediaChange = (event: MediaQueryListEvent) => {
      if (event.matches) stop()
      else start()
    }
    media.addEventListener("change", onMediaChange)

    // Smooth in-page anchor navigation (Record Index 01–09, section links).
    // Capture phase so it wins over any component-level handlers.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as HTMLElement | null)?.closest?.(
        'a[href^="#"]'
      ) as HTMLAnchorElement | null
      if (!anchor) return
      const hash = anchor.getAttribute("href") ?? ""
      if (hash.length < 2) return // bare "#"
      const element = document.getElementById(hash.slice(1))
      if (!element) return
      event.preventDefault()
      // Keep the URL shareable without polluting back/forward history.
      window.history.replaceState(null, "", hash)
      smoothScrollTo(element, { offset: -112 })
    }
    document.addEventListener("click", onClick, true)

    return () => {
      disposed = true
      document.removeEventListener("click", onClick, true)
      media.removeEventListener("change", onMediaChange)
      stop()
    }
  }, [])

  // Pause the virtual scroll while the Archive search dialog is open so the
  // page behind it cannot drift; resume on close.
  useEffect(() => {
    const lenis = getLenis()
    if (!lenis) return
    if (searchOpen) lenis.stop()
    else lenis.start()
  }, [searchOpen])

  return null
}
