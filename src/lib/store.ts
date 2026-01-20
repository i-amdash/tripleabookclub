'use client'

import { create } from 'zustand'
import { PortalStatus } from '@/types/database.types'

interface PortalState {
  status: PortalStatus[]
  lastFetchTime: number | null
  setStatus: (status: PortalStatus[]) => void
  getStatusForMonth: (month: number, year: number, category: 'fiction' | 'non-fiction') => PortalStatus | undefined
  reset: () => void
}

export const usePortalStore = create<PortalState>((set, get) => ({
  status: [],
  lastFetchTime: null,
  setStatus: (status) => set({ status, lastFetchTime: Date.now() }),
  getStatusForMonth: (month, year, category) => {
    return get().status.find(
      (s) => s.month === month && s.year === year && s.category === category
    )
  },
  reset: () => set({ status: [], lastFetchTime: null }),
}))

interface UIState {
  isMobileMenuOpen: boolean
  isScrolled: boolean
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
  toggleMobileMenu: () => void
  closeMobileMenu: () => void
  setScrolled: (scrolled: boolean) => void
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'reconnecting') => void
}

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  isScrolled: false,
  connectionStatus: 'connected',
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  setScrolled: (isScrolled) => set({ isScrolled }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
}))

