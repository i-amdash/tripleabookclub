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
    const { suggestion_id } = body

    if (!suggestion_id) {
      return NextResponse.json(
        { error: 'Suggestion ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Check if user already voted for this suggestion
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('suggestion_id', suggestion_id)
      .single()

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted for this book' },
        { status: 400 }
      )
    }

    // Create the vote
    const { error: voteError } = await supabase
      .from('votes')
      .insert({
        user_id: session.user.id,
        suggestion_id,
      })

    if (voteError) {
      console.error('Vote creation error:', voteError)
      return NextResponse.json(
        { error: 'Failed to record vote' },
        { status: 500 }
      )
    }

    // Wait for trigger to update vote_count, then fetch updated count
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const { data: updatedSuggestion } = await supabase
      .from('suggestions')
      .select('vote_count')
      .eq('id', suggestion_id)
      .single()

    return NextResponse.json({
      success: true,
      vote_count: updatedSuggestion?.vote_count || 0
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
