'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [roomName, setRoomName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const createRoom = async () => {
    if (!roomName.trim()) {
      setError('Please enter a room name')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      console.log('Creating room with name:', roomName)
      
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roomName })
      })
      
      console.log('Response status:', res.status)
      
      const data = await res.json()
      console.log('Response data:', data)
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room')
      }
      
      if (!data.roomId) {
        throw new Error('No room ID received')
      }
      
      console.log('Navigating to room:', data.roomId)
      router.push(`/room/${data.roomId}`)
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <h1 className="text-5xl font-bold text-white text-center mb-2">CodeSync</h1>
        <p className="text-gray-400 text-center mb-8">Real-time collaborative code editor</p>
        
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-200 text-sm">
              {error}
            </div>
          )}
          
          <input
            type="text"
            placeholder="Room name..."
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createRoom()}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={createRoom}
            disabled={loading || !roomName.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3 rounded font-semibold transition-colors"
          >
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </div>
    </div>
  )
}
