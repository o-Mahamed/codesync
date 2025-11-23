'use client'

import { useState } from 'react'

interface User {
  userId: string
  username: string
  color: string
  cursor?: {
    lineNumber: number
    column: number
  }
}

interface UserListProps {
  users: User[]
  currentUserId: string | null
}

export default function UserList({ users, currentUserId }: UserListProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className={`bg-gray-800 border-l border-gray-700 flex flex-col transition-all duration-300 ${isExpanded ? 'w-64' : 'w-12'}`}>
      {/* Header */}
      <div className="bg-gray-900 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        {isExpanded && (
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-sm font-semibold text-gray-300">Users ({users.length})</span>
          </div>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? '' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* User list */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {users.map((user) => (
            <div
              key={user.userId}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                user.userId === currentUserId ? 'bg-blue-500/20 border border-blue-500/50' : 'hover:bg-gray-700/50'
              }`}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                style={{ backgroundColor: user.color }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {user.username}
                  {user.userId === currentUserId && (
                    <span className="text-blue-400 ml-1">(You)</span>
                  )}
                </p>
                {user.cursor && (
                  <p className="text-gray-400 text-xs">
                    Line {user.cursor.lineNumber}
                  </p>
                )}
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
            </div>
          ))}
          
          {users.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No users online</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
