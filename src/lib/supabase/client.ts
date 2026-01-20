'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton pattern with proper initialization guard
let supabaseClient: SupabaseClient | null = null
let isInitializing = false

export function createClient(): SupabaseClient {
  // Return existing client if available
  if (supabaseClient) {
    return supabaseClient
  }

  // Prevent multiple simultaneous initializations
  if (isInitializing) {
    // Wait for initialization - this is a fallback, shouldn't normally happen
    throw new Error('Supabase client is still initializing')
  }

  isInitializing = true

  try {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
        global: {
          headers: {
            'x-client-info': 'tripleabookclub-web',
          },
        },
        // Add retry logic for network issues
        db: {
          schema: 'public',
        },
      }
    )

    return supabaseClient
  } finally {
    isInitializing = false
  }
}

// Helper to get the client (throws if not ready)
export function getClient(): SupabaseClient {
  if (!supabaseClient) {
    return createClient()
  }
  return supabaseClient
}

// Reset client (useful for logout or error recovery)
export function resetClient(): void {
  supabaseClient = null
  isInitializing = false
}
