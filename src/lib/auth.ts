import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

// Lazy-load Supabase client for server-side auth operations
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey)
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const email = credentials.email as string
        const password = credentials.password as string

        const supabase = getSupabaseAdmin()
        
        // Fetch user from profiles table
        const { data: user, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email.toLowerCase())
          .single()

        if (error || !user) {
          throw new Error('Invalid email or password')
        }

        // Check if user is active (only if field exists)
        if (user.is_active === false) {
          throw new Error('Your account has been deactivated')
        }

        // Check if user has a password set
        if (!user.password_hash) {
          throw new Error('Please set your password using the forgot password link')
        }

        // Verify password
        const isValidPassword = await compare(password, user.password_hash)

        if (!isValidPassword) {
          throw new Error('Invalid email or password')
        }

        // Return user object for session
        return {
          id: user.id,
          email: user.email,
          name: user.full_name,
          role: user.role,
          image: user.avatar_url,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
})
