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

// GET - Fetch meetups (for authenticated users)
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()
    const isAdmin = session.user.role === 'super_admin' || session.user.role === 'admin'

    // Admins can see all meetups, members only see published
    const query = supabase
      .from('meetups')
      .select('*')
      .order('event_date', { ascending: false })

    if (!isAdmin) {
      query.eq('is_published', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Meetups fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch meetups' },
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

// POST - Create a new meetup (admin only)
export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      venue_name,
      address,
      city,
      latitude,
      longitude,
      google_maps_url,
      event_date,
      end_time,
      month,
      year,
      image_url,
      is_published
    } = body

    // Validate required fields
    if (!title || !venue_name || !address || !event_date || !month || !year) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('meetups')
      .insert({
        title,
        description: description || null,
        venue_name,
        address,
        city: city || 'Lagos',
        latitude: latitude || null,
        longitude: longitude || null,
        google_maps_url: google_maps_url || null,
        event_date,
        end_time: end_time || null,
        month,
        year,
        image_url: image_url || null,
        is_published: is_published || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Meetup creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create meetup' },
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

// PUT - Update a meetup (admin only)
export async function PUT(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Meetup ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('meetups')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Meetup update error:', error)
      return NextResponse.json(
        { error: 'Failed to update meetup' },
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

// DELETE - Delete a meetup (admin only)
export async function DELETE(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Meetup ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('meetups')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Meetup deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete meetup' },
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
