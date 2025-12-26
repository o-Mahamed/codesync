import { notFound } from 'next/navigation'
import Editor from '@/components/Editor'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RoomPage({ params }: PageProps) {
  const { id } = await params

  if (!id) {
    notFound()
  }

  const { data: room, error } = await supabase
    .from('Room')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !room) {
    console.error('Error fetching room:', error)
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