'use client'

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
  isInSidebar?: boolean
}

export default function UserList({ users, currentUserId, isInSidebar = false }: UserListProps) {
  return (
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
  )
}
