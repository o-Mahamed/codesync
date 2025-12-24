import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Create a new room
export async function POST(request: Request) {
  try {
    const { name, ownerId } = await request.json()

    const room = await prisma.room.create({
      data: {
        name: name || 'Untitled Room',
        ownerId: ownerId || 'anonymous',
        code: '// Start coding!\n',
        language: 'javascript'
      }
    })

    return NextResponse.json(room)
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
}

// Get all rooms (optional)
export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    return NextResponse.json(rooms)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    )
  }
}