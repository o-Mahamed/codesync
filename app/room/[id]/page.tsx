import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Editor from '@/components/Editor'

export const revalidate = 0

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const room = await prisma.room.findUnique({ where: { id } })
  
  if (!room) notFound()

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">{room.name}</h1>
        <p className="text-sm text-gray-400">Room ID: {room.id}</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor roomId={room.id} initialCode={room.code} language={room.language} />
      </div>
    </div>
  )
}