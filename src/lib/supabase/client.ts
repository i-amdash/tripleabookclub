'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton pattern for database operations (auth is handled by NextAuth)
let supabaseClient: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient
  }

  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false, // Auth handled by NextAuth
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'x-client-info': 'tripleabookclub-web',
        },
      },
      db: {
        schema: 'public',
      },
    }
  )

  return supabaseClient
}

export function getClient(): SupabaseClient {
  if (!supabaseClient) {
    return createClient()
  }
  return supabaseClient
}
