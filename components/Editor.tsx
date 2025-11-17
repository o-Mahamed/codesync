'use client'

import { useState, useEffect, useRef } from 'react'
import MonacoEditor from '@monaco-editor/react'
import { io, Socket } from 'socket.io-client'
import type { editor } from 'monaco-editor'

interface EditorProps {
  roomId: string
  initialCode: string
  language: string
}

export default function Editor({ roomId, initialCode, language }: EditorProps) {
  const [code, setCode] = useState(initialCode)
  const [users, setUsers] = useState<Array<{ userId: string, username: string }>>([])
  const [isConnected, setIsConnected] = useState(false)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const isRemoteChange = useRef(false)

  // Initialize Socket.io connection
  useEffect(() => {
    const socketInstance = io('http://localhost:3000', {
      transports: ['websocket']
    })

    socketRef.current = socketInstance

    socketInstance.on('connect', () => {
      console.log('Connected to Socket.io server')
      setIsConnected(true)
      
      // Join room
      const username = `User${Math.floor(Math.random() * 1000)}`
      socketInstance.emit('join-room', roomId, username)
    })

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from Socket.io server')
      setIsConnected(false)
    })

    // Listen for code updates from other users
    socketInstance.on('code-update', (data: { code: string, userId: string }) => {
      console.log('Received code update from', data.userId)
      isRemoteChange.current = true
      setCode(data.code)
    })

    // Listen for room users
    socketInstance.on('room-users', (roomUsers: Array<{ userId: string, username: string }>) => {
      console.log('Room users:', roomUsers)
      setUsers(roomUsers)
    })

    // Listen for user joined
    socketInstance.on('user-joined', (user: { userId: string, username: string }) => {
      console.log('User joined:', user)
      setUsers(prev => [...prev, user])
    })

    // Listen for user left
    socketInstance.on('user-left', (user: { userId: string, username: string }) => {
      console.log('User left:', user)
      setUsers(prev => prev.filter(u => u.userId !== user.userId))
    })

    return () => {
      socketInstance.disconnect()
      socketRef.current = null
    }
  }, [roomId])

  // Handle code changes
  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return

    // If this is a remote change, don't broadcast it back
    if (isRemoteChange.current) {
      isRemoteChange.current = false
      return
    }

    setCode(value)

    // Broadcast to other users
    if (socketRef.current && isConnected) {
      socketRef.current.emit('code-change', {
        roomId,
        code: value,
        userId: socketRef.current.id
      })
    }
  }

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
  }

  return (
    <div className="h-full flex flex-col">
      {/* Connection status and users */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-300">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{users.length} user{users.length !== 1 ? 's' : ''} in room</span>
          <div className="flex -space-x-2">
            {users.slice(0, 5).map((user, idx) => (
              <div
                key={user.userId}
                className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs border-2 border-gray-800"
                title={user.username}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
            ))}
            {users.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs border-2 border-gray-800">
                +{users.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <MonacoEditor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 14,
            minimap: { enabled: true },
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  )
}
