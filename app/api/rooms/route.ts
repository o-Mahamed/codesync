import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('Received body:', body)
    
    const { name } = body
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      )
    }
    
    console.log('Creating room with name:', name)
    
    const room = await prisma.room.create({
      data: {
        name: name.trim(),
        owner: {
          connectOrCreate: {
            where: { email: 'anonymous@codesync.dev' },
            create: { email: 'anonymous@codesync.dev', name: 'Anonymous' }
          }
        }
      }
    })
    
    console.log('Room created:', room)
    
    return NextResponse.json({ roomId: room.id })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      { error: 'Failed to create room', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
