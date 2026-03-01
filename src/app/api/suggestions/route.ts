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

// GET - Fetch suggestions (admin only for full list)
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

    const { data, error } = await supabase
      .from('suggestions')
      .select('*, profiles(full_name, email)')
      .order('vote_count', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Suggestions fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch suggestions' },
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
    const { title, author, synopsis, image_url, category, month, year } = body

    // Validate required fields
    if (!title || !author || !synopsis || !category || !month || !year) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Check user's suggestion count for this period
    const { count } = await supabase
      .from('suggestions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('month', month)
      .eq('year', year)
      .eq('category', category)

    if (count !== null && count >= 3) {
      return NextResponse.json(
        { error: 'You can only suggest 3 books per month' },
        { status: 400 }
      )
    }

    // Create the suggestion
    const { data, error } = await supabase
      .from('suggestions')
      .insert({
        user_id: session.user.id,
        title: title.trim(),
        author: author.trim(),
        synopsis: synopsis.trim(),
        image_url: image_url?.trim() || null,
        category,
        month,
        year,
      })
      .select()
      .single()

    if (error) {
      console.error('Suggestion creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create suggestion' },
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

// PUT - Select suggestion as winner (admin only)
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
    const { suggestion_id, action } = body

    if (!suggestion_id) {
      return NextResponse.json(
        { error: 'Suggestion ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Handle select winner action
    if (action === 'select_winner') {
      // Get the suggestion
      const { data: suggestion, error: fetchError } = await supabase
        .from('suggestions')
        .select('*')
        .eq('id', suggestion_id)
        .single()

      if (fetchError || !suggestion) {
        return NextResponse.json(
          { error: 'Suggestion not found' },
          { status: 404 }
        )
      }

      // Add as a book
      const { error: bookError } = await supabase
        .from('books')
        .insert({
          title: suggestion.title,
          author: suggestion.author,
          synopsis: suggestion.synopsis,
          image_url: suggestion.image_url,
          category: suggestion.category,
          month: suggestion.month,
          year: suggestion.year,
          is_selected: true,
        })

      if (bookError) {
        console.error('Book creation error:', bookError)
        return NextResponse.json(
          { error: 'Failed to create book from suggestion', details: bookError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, message: 'Winner selected' })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a suggestion (admin only)
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
        { error: 'Suggestion ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('suggestions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Suggestion deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete suggestion' },
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
