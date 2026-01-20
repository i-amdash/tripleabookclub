'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Profile, PortalStatus } from '@/types/database.types'

interface AuthState {
  user: Profile | null
  isLoading: boolean
  isInitialized: boolean
  lastFetchTime: number | null
  setUser: (user: Profile | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  reset: () => void
}

// Auth store with persistence to survive page refreshes
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      isInitialized: false,
      lastFetchTime: null,
      setUser: (user) => set({ user, lastFetchTime: Date.now() }),
      setLoading: (isLoading) => set({ isLoading }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      reset: () => set({ user: null, isLoading: false, isInitialized: false, lastFetchTime: null }),
    }),
    {
      name: 'tripleabc-auth-storage',
      storage: createJSONStorage(() => {
        // Only use localStorage on client
        if (typeof window !== 'undefined') {
          return localStorage
        }
        // Return a no-op storage for SSR
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      }),
      partialize: (state) => ({ 
        user: state.user,
        lastFetchTime: state.lastFetchTime,
      }),
    }
  )
)

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

