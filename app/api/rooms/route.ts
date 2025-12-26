import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Create a new room
export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Received body:', body)

    const { name, ownerId } = body

    const { data, error } = await supabase
      .from('Room')
      .insert([
        {
          name: name || 'Untitled Room',
          ownerId: ownerId || 'anonymous',
          code: '// Start coding!\n',
          language: 'javascript'
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    console.log('Room created:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
}

// Get all rooms
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('Room')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(20)

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    )
  }
}