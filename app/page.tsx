import { notFound } from 'next/navigation'
import Editor from '@/components/Editor'
import { prisma } from '@/lib/prisma'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RoomPage({ params }: PageProps) {
  // Await params in Next.js 15
  const { id } = await params

  if (!id) {
    notFound()
  }

  try {
    const room = await prisma.room.findUnique({
      where: { id }
    })

    if (!room) {
      notFound()
    }

    return (
      <div className="h-screen flex flex-col">
        <div className="flex-1 overflow-hidden">
          <Editor roomId={room.id} />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error fetching room:', error)
    notFound()
  }
}