'use client'

import { useState } from 'react'
import { Socket } from 'socket.io-client'
import UserList from './UserList'
import Chat from './Chat'

interface User {
  userId: string
  username: string
  color: string
  cursor?: {
    lineNumber: number
    column: number
  }
}

interface SidebarProps {
  users: User[]
  currentUserId: string | null
  socket: Socket | null
  roomId: string
  currentUser: { id: string, name: string, color: string } | null
}

export default function Sidebar({ users, currentUserId, socket, roomId, currentUser }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'chat'>('users')
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className={`bg-gray-800 border-l border-gray-700 flex flex-col transition-all duration-300 ${isExpanded ? 'w-80' : 'w-12'}`}>
      {/* Header with tabs */}
      <div className="bg-gray-900 px-2 py-2 flex items-center justify-between border-b border-gray-700">
        {isExpanded ? (
          <div className="flex-1 flex gap-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Users</span>
              <span className="text-xs bg-gray-600 px-1.5 py-0.5 rounded-full">{users.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Chat</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 w-full items-center">
            <button
              onClick={() => { setIsExpanded(true); setActiveTab('users'); }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
            <button
              onClick={() => { setIsExpanded(true); setActiveTab('chat'); }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>
        )}
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white transition-colors ml-2"
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

      {/* Content */}
      {isExpanded && (
        <div className="flex-1 overflow-hidden">
          {activeTab === 'users' ? (
            <UserList users={users} currentUserId={currentUserId} isInSidebar />
          ) : (
            <Chat socket={socket} roomId={roomId} currentUser={currentUser} isInSidebar />
          )}
        </div>
      )}
    </div>
  )
}
