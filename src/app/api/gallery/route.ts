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

// GET - Fetch gallery items (public)
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Gallery fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch gallery' },
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

// POST - Create a new gallery item (authenticated users)
export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, url, title, description, month, year, order_index } = body

    // Validate required fields
    if (!type || !url || !title || !month || !year) {
      return NextResponse.json(
        { error: 'Missing required fields (type, url, title, month, year)' },
        { status: 400 }
      )
    }

    // Validate month is 1-12
    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Month must be between 1 and 12' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Get max order index if not provided
    let finalOrderIndex = order_index
    if (finalOrderIndex === undefined) {
      const { data: existingItems } = await supabase
        .from('gallery')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1)

      finalOrderIndex = (existingItems?.[0]?.order_index || 0) + 1
    }

    const { data, error } = await supabase
      .from('gallery')
      .insert({
        type,
        url: url.trim(),
        title: title.trim(),
        description: description?.trim() || null,
        month,
        year,
        order_index: finalOrderIndex,
      })
      .select()

    if (error) {
      console.error('Gallery creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create gallery item', details: error.message },
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

// PUT - Update a gallery item (admin only)
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
        { error: 'Gallery item ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('gallery')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Gallery update error:', error)
      return NextResponse.json(
        { error: 'Failed to update gallery item', details: error.message },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Gallery item not found' },
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

// DELETE - Delete a gallery item (admin only)
export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Gallery item ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('gallery')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Gallery deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete gallery item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
