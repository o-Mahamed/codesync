'use client'

import { useState, useEffect, useRef } from 'react'
import MonacoEditor from '@monaco-editor/react'
import { io, Socket } from 'socket.io-client'
import type * as Monaco from 'monaco-editor'
import { getColorForUser } from '@/lib/colors'
import OutputPanel from './OutputPanel'

interface EditorProps {
  roomId: string
  initialCode: string
  language: string
}

interface User {
  userId: string
  username: string
  color: string
  cursor?: {
    lineNumber: number
    column: number
  }
}

// Declare global monaco
declare global {
  interface Window {
    monaco: typeof Monaco
  }
}

export default function Editor({ roomId, initialCode, language }: EditorProps) {
  const [code, setCode] = useState(initialCode)
  const [users, setUsers] = useState<User[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string, name: string, color: string } | null>(null)
  const [output, setOutput] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionError, setExecutionError] = useState<string | null>(null)
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof Monaco | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const isRemoteChange = useRef(false)
  const decorationsRef = useRef<string[]>([])

  // Initialize Socket.io connection
  useEffect(() => {
    const socketInstance = io('http://localhost:3000', {
      transports: ['websocket']
    })

    socketRef.current = socketInstance

    socketInstance.on('connect', () => {
      console.log('Connected to Socket.io server')
      setIsConnected(true)
      
      const username = `User${Math.floor(Math.random() * 1000)}`
      const color = getColorForUser(socketInstance.id)
      setCurrentUser({ id: socketInstance.id, name: username, color })
      
      socketInstance.emit('join-room', roomId, username)
    })

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from Socket.io server')
      setIsConnected(false)
    })

    socketInstance.on('code-update', (data: { code: string, userId: string }) => {
      isRemoteChange.current = true
      setCode(data.code)
    })

    socketInstance.on('room-users', (roomUsers: Array<{ userId: string, username: string }>) => {
      setUsers(roomUsers.map(u => ({
        ...u,
        color: getColorForUser(u.userId)
      })))
    })

    socketInstance.on('user-joined', (user: { userId: string, username: string }) => {
      setUsers(prev => [...prev, { ...user, color: getColorForUser(user.userId) }])
    })

    socketInstance.on('user-left', (user: { userId: string }) => {
      setUsers(prev => prev.filter(u => u.userId !== user.userId))
    })

    socketInstance.on('cursor-update', (data: { position: { lineNumber: number, column: number }, userId: string, username: string }) => {
      setUsers(prev => prev.map(u => 
        u.userId === data.userId 
          ? { ...u, cursor: data.position }
          : u
      ))
    })

    return () => {
      socketInstance.disconnect()
      socketRef.current = null
    }
  }, [roomId])

  // Update cursor decorations
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return

    const editor = editorRef.current
    const monaco = monacoRef.current
    const newDecorations: Monaco.editor.IModelDeltaDecoration[] = []

    users.forEach(user => {
      if (user.cursor && user.userId !== socketRef.current?.id) {
        newDecorations.push({
          range: new monaco.Range(
            user.cursor.lineNumber,
            user.cursor.column,
            user.cursor.lineNumber,
            user.cursor.column
          ),
          options: {
            className: 'remote-cursor',
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          }
        })

        newDecorations.push({
          range: new monaco.Range(
            user.cursor.lineNumber,
            1,
            user.cursor.lineNumber,
            1
          ),
          options: {
            isWholeLine: true,
            className: 'remote-cursor-line',
          }
        })
      }
    })

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations)
  }, [users])

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return

    if (isRemoteChange.current) {
      isRemoteChange.current = false
      return
    }

    setCode(value)

    if (socketRef.current && isConnected) {
      socketRef.current.emit('code-change', {
        roomId,
        code: value,
        userId: socketRef.current.id
      })
    }
  }

  const handleEditorDidMount = (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    editor.onDidChangeCursorPosition((e) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit('cursor-change', {
          roomId,
          position: {
            lineNumber: e.position.lineNumber,
            column: e.position.column
          },
          userId: socketRef.current.id
        })
      }
    })

    // Add keyboard shortcut for running code (Ctrl/Cmd + Enter)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleExecuteCode()
    })
  }

  const handleExecuteCode = async () => {
    setIsExecuting(true)
    setExecutionError(null)
    setOutput('Running code...\n\n')

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      })

      const data = await response.json()

      if (data.error) {
        setExecutionError(data.error)
      }

      setOutput(data.output || '(No output)')
    } catch (error) {
      console.error('Execution error:', error)
      setExecutionError('Failed to execute code')
      setOutput(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <style jsx global>{`
        .remote-cursor {
          background-color: transparent;
          border-left: 2px solid;
          position: relative;
        }

        .remote-cursor-line {
          background-color: rgba(78, 205, 196, 0.1);
        }
      `}</style>

      {/* Top bar */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-300">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {currentUser && (
            <span className="text-sm text-gray-400">
              • <span style={{ color: currentUser.color }} className="font-semibold">{currentUser.name}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{users.length} user{users.length !== 1 ? 's' : ''}</span>
          <div className="flex -space-x-2">
            {users.slice(0, 5).map((user) => (
              <div
                key={user.userId}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs border-2 border-gray-800 font-semibold"
                style={{ backgroundColor: user.color }}
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

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
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

      {/* Output Panel */}
      <OutputPanel
        onExecute={handleExecuteCode}
        output={output}
        isExecuting={isExecuting}
        error={executionError}
      />
    </div>
  )
}
