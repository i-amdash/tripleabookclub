'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient, resetClient } from '@/lib/supabase/client'
import { useAuthStore, useUIStore } from '@/lib/store'
import { Profile } from '@/types/database.types'

// Shared client instance - created once at module level for client components
let sharedClient: ReturnType<typeof createClient> | null = null

function getSharedClient() {
  if (!sharedClient) {
    sharedClient = createClient()
  }
  return sharedClient
}

// Hook to detect if component has mounted (for hydration safety)
export function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  return hasMounted
}

// Custom hook for Supabase client with connection monitoring
export function useSupabase() {
  const setConnectionStatus = useUIStore((state) => state.setConnectionStatus)
  const clientRef = useRef(getSharedClient())
  
  return clientRef.current
}

export function useAuth() {
  const { user, isLoading, isInitialized, setUser, setLoading, setInitialized, reset } = useAuthStore()
  const setConnectionStatus = useUIStore((state) => state.setConnectionStatus)
  const supabase = useSupabase()
  const hasMounted = useHasMounted()
  const initRef = useRef(false)
  const abortedRef = useRef(false)

  useEffect(() => {
    // Prevent multiple initializations
    if (initRef.current) return
    initRef.current = true
    abortedRef.current = false

    const getUser = async () => {
      // Check if aborted before starting
      if (abortedRef.current) return

      try {
        setConnectionStatus('connected')
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        // Check if aborted after async operation
        if (abortedRef.current) return
        
        if (authError) {
          // Ignore abort errors
          if (authError.name === 'AbortError' || authError.message?.includes('abort')) return
          
          console.error('Auth error:', authError)
          setUser(null)
          setLoading(false)
          setInitialized(true)
          return
        }
        
        if (authUser) {
          // Check if aborted before next async operation
          if (abortedRef.current) return
          
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single()
          
          // Check if aborted after async operation
          if (abortedRef.current) return
          
          if (profileError && profileError.name !== 'AbortError') {
            console.error('Profile fetch error:', profileError)
          }
          
          setUser(profile || null)
        } else {
          setUser(null)
        }
        
        setConnectionStatus('connected')
      } catch (error: any) {
        // Ignore abort errors
        if (error?.name === 'AbortError' || error?.message?.includes('abort')) return
        if (abortedRef.current) return
        
        console.error('Error fetching user:', error)
        setConnectionStatus('disconnected')
        setUser(null)
      } finally {
        if (!abortedRef.current) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (abortedRef.current) return
      
      if (event === 'SIGNED_OUT') {
        reset()
        resetClient()
        sharedClient = null
        return
      }

      if (event === 'TOKEN_REFRESHED') {
        setConnectionStatus('connected')
      }

      if (session?.user) {
        try {
          if (abortedRef.current) return
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (abortedRef.current) return
          setUser(profile || null)
        } catch (error: any) {
          if (error?.name !== 'AbortError') {
            console.error('Error fetching profile on auth change:', error)
          }
        }
      } else {
        setUser(null)
      }
      if (!abortedRef.current) {
        setLoading(false)
      }
    })

    return () => {
      abortedRef.current = true
      subscription.unsubscribe()
    }
  }, [supabase, setUser, setLoading, setInitialized, reset, setConnectionStatus])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }, [supabase])

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const redirectUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/callback`
      : 'https://tripleabookclub.com/auth/callback'
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: redirectUrl,
      },
    })
    return { data, error }
  }, [supabase])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    reset()
    resetClient()
    sharedClient = null
  }, [supabase, reset])

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const isSuperAdmin = user?.role === 'super_admin'

  return {
    user,
    // Only show loading state after mount and before initialization
    isLoading: hasMounted ? (isLoading && !isInitialized) : false,
    isAdmin,
    isSuperAdmin,
    signIn,
    signUp,
    signOut,
    hasMounted,
    isInitialized,
  }
}

export function useBooks(category?: 'fiction' | 'non-fiction', month?: number, year?: number) {
  const [books, setBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = useSupabase()

  useEffect(() => {
    let isMounted = true
    
    const fetchBooks = async () => {
      try {
        let query = supabase.from('books').select('*').eq('is_selected', true)
        
        if (category) query = query.eq('category', category)
        if (month) query = query.eq('month', month)
        if (year) query = query.eq('year', year)
        
        query = query.order('year', { ascending: false }).order('month', { ascending: false })
        
        const { data, error: fetchError } = await query
        
        if (!isMounted) return
        
        if (fetchError) {
          setError(new Error(fetchError.message))
          setBooks([])
        } else {
          setBooks(data || [])
          setError(null)
        }
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err : new Error('Failed to fetch books'))
        setBooks([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchBooks()
    
    return () => { isMounted = false }
  }, [category, month, year, supabase])

  return { books, loading, error }
}

export function useSuggestions(month: number, year: number, category: 'fiction' | 'non-fiction') {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userSuggestionCount, setUserSuggestionCount] = useState(0)
  const { user } = useAuth()
  const supabase = useSupabase()

  useEffect(() => {
    let isMounted = true
    
    const fetchSuggestions = async () => {
      try {
        const { data, error } = await supabase
          .from('suggestions')
          .select('*, profiles(full_name)')
          .eq('month', month)
          .eq('year', year)
          .eq('category', category)
          .order('vote_count', { ascending: false })
        
        if (!isMounted) return
        
        if (error) {
          console.error('Error fetching suggestions:', error)
          setSuggestions([])
        } else {
          setSuggestions(data || [])
          
          if (user) {
            const userSuggestions = (data || []).filter(s => s.user_id === user.id)
            setUserSuggestionCount(userSuggestions.length)
          }
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err)
        if (isMounted) setSuggestions([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchSuggestions()
    
    return () => { isMounted = false }
  }, [month, year, category, user, supabase])

  return { suggestions, loading, userSuggestionCount }
}

export function useGallery() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useSupabase()

  useEffect(() => {
    let isMounted = true
    
    const fetchGallery = async () => {
      try {
        const { data, error } = await supabase
          .from('gallery')
          .select('*')
          .order('order_index', { ascending: true })
        
        if (!isMounted) return
        
        if (error) {
          console.error('Error fetching gallery:', error)
          setItems([])
        } else {
          setItems(data || [])
        }
      } catch (err) {
        console.error('Error fetching gallery:', err)
        if (isMounted) setItems([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchGallery()
    
    return () => { isMounted = false }
  }, [supabase])

  return { items, loading }
}

export function useMembers() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useSupabase()

  useEffect(() => {
    let isMounted = true
    
    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('is_visible', true)
          .order('order_index', { ascending: true })
        
        if (!isMounted) return
        
        if (error) {
          console.error('Error fetching members:', error)
          setMembers([])
        } else {
          setMembers(data || [])
        }
      } catch (err) {
        console.error('Error fetching members:', err)
        if (isMounted) setMembers([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchMembers()
    
    return () => { isMounted = false }
  }, [supabase])

  return { members, loading }
}

export function usePortalStatus(month: number, year: number, category: 'fiction' | 'non-fiction') {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useSupabase()

  useEffect(() => {
    let isMounted = true
    
    const fetchStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('portal_status')
          .select('*')
          .eq('month', month)
          .eq('year', year)
          .eq('category', category)
          .maybeSingle()
        
        if (!isMounted) return
        
        if (error) {
          console.error('Error fetching portal status:', error)
          setStatus(null)
        } else {
          setStatus(data)
        }
      } catch (err) {
        console.error('Error fetching portal status:', err)
        if (isMounted) setStatus(null)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchStatus()
    
    return () => { isMounted = false }
  }, [month, year, category, supabase])

  return { status, loading }
}
