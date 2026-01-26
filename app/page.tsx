'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [roomName, setRoomName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const createRoom = async () => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roomName || 'Untitled Room',
          ownerId: 'user-' + Math.random().toString(36).substr(2, 9)
        })
      })

      const room = await response.json()
      
      if (room.id) {
        router.push(`/room/${room.id}`)
      } else {
        alert('Failed to create room')
      }
    } catch (error) {
      console.error('Error creating room:', error)
      alert('Failed to create room')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-3">
            CodeSync
          </h1>
          <p className="text-gray-400 text-lg">
            Real-time collaborative code editor
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Room Name (Optional)
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g., Team Hackathon"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              onKeyPress={(e) => e.key === 'Enter' && !isCreating && createRoom()}
            />
          </div>

          <button
            onClick={createRoom}
            disabled={isCreating}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            {isCreating ? 'Creating...' : 'Create New Room'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Features:</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Real-time collaboration
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Multiple programming languages
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Live code execution
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Video chat & screen sharing
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}