import { create } from "zustand"

/**
 * Public archive UI state (Zustand):
 *  - the global Archive search overlay (opened from the header, "/" or ⌘K)
 *  - the record-comparison selection (max 3 records, FIFO eviction)
 */

interface ArchiveUIState {
  searchOpen: boolean
  openSearch: () => void
  closeSearch: () => void
  toggleSearch: () => void
}

export const useArchiveUI = create<ArchiveUIState>((set) => ({
  searchOpen: false,
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
  toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen })),
}))

/** Maximum records allowed in a side-by-side comparison. */
export const COMPARE_LIMIT = 3

interface CompareState {
  /** Slugs of the records selected for comparison (insertion order). */
  compareSlugs: string[]
  toggleCompare: (slug: string) => void
  removeCompare: (slug: string) => void
  setCompare: (slugs: string[]) => void
  clearCompare: () => void
}

export const useCompare = create<CompareState>((set) => ({
  compareSlugs: [],
  toggleCompare: (slug) =>
    set((s) => {
      if (s.compareSlugs.includes(slug)) {
        return { compareSlugs: s.compareSlugs.filter((x) => x !== slug) }
      }
      // FIFO eviction: adding a 4th record drops the oldest selection.
      const next = [...s.compareSlugs, slug]
      return { compareSlugs: next.slice(next.length - COMPARE_LIMIT) }
    }),
  removeCompare: (slug) =>
    set((s) => ({ compareSlugs: s.compareSlugs.filter((x) => x !== slug) })),
  setCompare: (slugs) =>
    set(() => ({ compareSlugs: slugs.filter(Boolean).slice(0, COMPARE_LIMIT) })),
  clearCompare: () => set({ compareSlugs: [] }),
}))
