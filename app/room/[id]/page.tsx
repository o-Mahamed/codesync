import { notFound } from 'next/navigation'
import Editor from '@/components/Editor'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RoomPage({ params }: PageProps) {
  const { id } = await params

  if (!id) {
    notFound()
  }

  // Handle database fetch outside JSX
  const room = await prisma.room.findUnique({
    where: { id }
  }).catch((error) => {
    console.error('Error fetching room:', error)
    return null
  })

  if (!room) {
    notFound()
  }

  // Now it's safe to return JSX - no try/catch wrapping it
  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-hidden">
        <Editor roomId={room.id} />
      </div>
    </div>
  )
}