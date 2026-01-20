'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store'
import { Profile } from '@/types/database.types'

// Hook to detect if component has mounted (for hydration safety)
export function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  return hasMounted
}

export function useAuth() {
  const { user, isLoading, setUser, setLoading } = useAuthStore()
  const supabase = useMemo(() => createClient(), [])
  const hasMounted = useHasMounted()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (authUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single()
          
          setUser(profile)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        setUser(profile)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase, setUser, setLoading])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }, [supabase])

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })
    return { data, error }
  }, [supabase])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [supabase, setUser])

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const isSuperAdmin = user?.role === 'super_admin'

  return {
    user,
    // Only show loading state after mount to avoid hydration mismatch
    isLoading: hasMounted ? isLoading : false,
    isAdmin,
    isSuperAdmin,
    signIn,
    signUp,
    signOut,
    hasMounted,
  }
}

export function useBooks(category?: 'fiction' | 'non-fiction', month?: number, year?: number) {
  const [books, setBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const fetchBooks = async () => {
      let query = supabase.from('books').select('*').eq('is_selected', true)
      
      if (category) query = query.eq('category', category)
      if (month) query = query.eq('month', month)
      if (year) query = query.eq('year', year)
      
      query = query.order('year', { ascending: false }).order('month', { ascending: false })
      
      const { data } = await query
      setBooks(data || [])
      setLoading(false)
    }

    fetchBooks()
  }, [category, month, year, supabase])

  return { books, loading }
}

export function useSuggestions(month: number, year: number, category: 'fiction' | 'non-fiction') {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userSuggestionCount, setUserSuggestionCount] = useState(0)
  const { user } = useAuth()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const fetchSuggestions = async () => {
      const { data } = await supabase
        .from('suggestions')
        .select('*, profiles(full_name)')
        .eq('month', month)
        .eq('year', year)
        .eq('category', category)
        .order('vote_count', { ascending: false })
      
      setSuggestions(data || [])
      
      if (user) {
        const userSuggestions = (data || []).filter(s => s.user_id === user.id)
        setUserSuggestionCount(userSuggestions.length)
      }
      
      setLoading(false)
    }

    fetchSuggestions()
  }, [month, year, category, user, supabase])

  return { suggestions, loading, userSuggestionCount }
}

export function useGallery() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const fetchGallery = async () => {
      const { data } = await supabase
        .from('gallery')
        .select('*')
        .order('order_index', { ascending: true })
      
      setItems(data || [])
      setLoading(false)
    }

    fetchGallery()
  }, [supabase])

  return { items, loading }
}

export function useMembers() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('is_visible', true)
        .order('order_index', { ascending: true })
      
      setMembers(data || [])
      setLoading(false)
    }

    fetchMembers()
  }, [supabase])

  return { members, loading }
}

export function usePortalStatus(month: number, year: number, category: 'fiction' | 'non-fiction') {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const fetchStatus = async () => {
      const { data } = await supabase
        .from('portal_status')
        .select('*')
        .eq('month', month)
        .eq('year', year)
        .eq('category', category)
        .single()
      
      setStatus(data)
      setLoading(false)
    }

    fetchStatus()
  }, [month, year, category, supabase])

  return { status, loading }
}
