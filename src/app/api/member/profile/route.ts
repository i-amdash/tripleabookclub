import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey)
}

// GET - Fetch member profile for current user or by ID (admin only)
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')
    const profileId = searchParams.get('profileId')
    
    const supabase = getSupabaseAdmin()
    const isAdmin = session.user.role === 'super_admin' || session.user.role === 'admin'

    // If admin requesting specific member
    if (memberId && isAdmin) {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single()

      if (error) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 })
      }
      return NextResponse.json({ member: data })
    }

    // Get member by profile_id (for current user)
    const targetProfileId = profileId && isAdmin ? profileId : session.user.id
    
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('profile_id', targetProfileId)
      .single()

    if (error) {
      // No member linked yet - return null
      return NextResponse.json({ member: null })
    }

    return NextResponse.json({ member: data })
  } catch (error) {
    console.error('Get member profile error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

// PUT - Update member profile
export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const isAdmin = session.user.role === 'super_admin' || session.user.role === 'admin'
    const body = await request.json()
    const { memberId, name, role, bio, image_url, social_links, is_visible } = body

    // Get the member to check ownership
    const { data: member, error: fetchError } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single()

    if (fetchError || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Check permission: must be admin or own profile
    if (!isAdmin && member.profile_id !== session.user.id) {
      return NextResponse.json({ error: 'You can only edit your own profile' }, { status: 403 })
    }

    // Build update object
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    // Members can only update certain fields
    if (name !== undefined) updateData.name = name
    if (bio !== undefined) updateData.bio = bio
    if (image_url !== undefined) updateData.image_url = image_url
    if (social_links !== undefined) updateData.social_links = social_links

    // Only admins can update these fields
    if (isAdmin) {
      if (role !== undefined) updateData.role = role
      if (is_visible !== undefined) updateData.is_visible = is_visible
    }

    const { data, error } = await supabase
      .from('members')
      .update(updateData)
      .eq('id', memberId)
      .select()
      .single()

    if (error) {
      console.error('Failed to update member:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ member: data, message: 'Profile updated successfully' })
  } catch (error) {
    console.error('Update member profile error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

// POST - Link profile to member (or create new member for profile)
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const isAdmin = session.user.role === 'super_admin' || session.user.role === 'admin'
    const body = await request.json()
    const { profileId, memberId } = body

    // Only admins can link profiles to members
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can link profiles to members' }, { status: 403 })
    }

    if (memberId) {
      // Link existing member to profile
      const { data, error } = await supabase
        .from('members')
        .update({ profile_id: profileId })
        .eq('id', memberId)
        .select()
        .single()

      if (error) {
        console.error('Failed to link member:', error)
        return NextResponse.json({ error: 'Failed to link member to profile' }, { status: 500 })
      }

      return NextResponse.json({ member: data, message: 'Member linked to profile successfully' })
    } else {
      // Get profile info to create member
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', profileId)
        .single()

      if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      // Get max order_index
      const { data: members } = await supabase
        .from('members')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1)

      const maxOrder = members && members.length > 0 ? members[0].order_index : 0

      // Create new member linked to profile
      const { data, error } = await supabase
        .from('members')
        .insert({
          profile_id: profileId,
          name: profile.full_name || profile.email.split('@')[0],
          role: 'Member',
          is_visible: true,
          order_index: maxOrder + 1,
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to create member:', error)
        return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
      }

      return NextResponse.json({ member: data, message: 'Member created and linked successfully' })
    }
  } catch (error) {
    console.error('Link member profile error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
