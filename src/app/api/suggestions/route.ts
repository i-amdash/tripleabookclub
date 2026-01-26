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
