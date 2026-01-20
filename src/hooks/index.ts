'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/lib/store'
import { Profile } from '@/types/database.types'

// Shared Supabase client instance - for database operations (not auth)
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

// Custom hook for Supabase client (for database operations)
export function useSupabase() {
  const clientRef = useRef(getSharedClient())
  return clientRef.current
}

// Auth hook using NextAuth
export function useAuth() {
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const supabase = useSupabase()
  const hasMounted = useHasMounted()
  const fetchedRef = useRef(false)

  // Fetch full profile from Supabase when session changes
  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null)
      setIsLoadingProfile(false)
      fetchedRef.current = false
      return
    }

    // Prevent duplicate fetches
    if (fetchedRef.current) return
    fetchedRef.current = true

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.error('Profile fetch error:', error)
          setProfile(null)
        } else {
          setProfile(data)
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
        setProfile(null)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    fetchProfile()
  }, [session?.user?.id, supabase])

  const signOut = useCallback(async () => {
    await nextAuthSignOut({ callbackUrl: '/' })
  }, [])

  const isLoading = status === 'loading' || isLoadingProfile
  const user = profile
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
  const isSuperAdmin = profile?.role === 'super_admin'
  const isInitialized = status !== 'loading'

  return {
    user,
    isLoading: hasMounted ? isLoading : false,
    isAdmin,
    isSuperAdmin,
    signOut,
    hasMounted,
    isInitialized,
    session,
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
