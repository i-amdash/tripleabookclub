import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey)
}

// GET - Fetch site content (public)
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('site_content')
      .select('*')

    if (error) {
      console.error('Content fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch content' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create or update content (admin only)
export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'super_admin' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { page, section, content, id } = body

    if (!page || !section) {
      return NextResponse.json(
        { error: 'Page and section are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // If id is provided, update existing
    if (id) {
      const { data, error } = await supabase
        .from('site_content')
        .update({ content })
        .eq('id', id)
        .select()

      if (error) {
        console.error('Content update error:', error)
        return NextResponse.json(
          { error: 'Failed to update content', details: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json(data?.[0] || data)
    }

    // Otherwise, insert new
    const { data, error } = await supabase
      .from('site_content')
      .insert({ page, section, content })
      .select()

    if (error) {
      console.error('Content creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create content', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data?.[0] || data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update content (admin only)
export async function PUT(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'super_admin' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('site_content')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Content update error:', error)
      return NextResponse.json(
        { error: 'Failed to update content', details: error.message },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
