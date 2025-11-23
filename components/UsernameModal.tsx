'use client'

import { useState } from 'react'

interface UsernameModalProps {
  onSubmit: (username: string) => void
}

export default function UsernameModal({ onSubmit }: UsernameModalProps) {
  const [username, setUsername] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim()) {
      onSubmit(username.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to CodeSync!</h2>
        <p className="text-gray-400 mb-6">Enter your name to start collaborating</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Your name..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            maxLength={20}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 mb-4"
          />
          
          <button
            type="submit"
            disabled={!username.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Join Room
          </button>
        </form>
        
        <p className="text-gray-500 text-sm mt-4 text-center">
          Your name will be visible to other users in this room
        </p>
      </div>
    </div>
  )
}
