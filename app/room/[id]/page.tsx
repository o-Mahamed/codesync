import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Editor from '@/components/Editor'

export const revalidate = 0

export default async function RoomPage({ params }: { params: { id: string } }) {
  const room = await prisma.room.findUnique({
    where: { id: params.id }
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
}