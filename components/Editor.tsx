'use client'

import { useState, useEffect, useRef } from 'react'
import MonacoEditor from '@monaco-editor/react'
import { io, Socket } from 'socket.io-client'
import type * as Monaco from 'monaco-editor'
import { getColorForUser } from '@/lib/colors'
import OutputPanel from './OutputPanel'
import UsernameModal from './UsernameModal'
import Sidebar from './Sidebar'
import CopyLinkButton from './CopyLinkButton'
import LanguageSelector from './LanguageSelector'
import Toast from './Toast'
import Chat from './Chat'
import GitPanel from './GitPanel'
import VideoChat from './VideoChat'
import FileManager, { FileData } from './FileManager'
import FileTabs from './FileTabs'

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

declare global {
  interface Window {
    monaco: typeof Monaco
  }
}

export default function Editor({ roomId, initialCode, language: initialLanguage }: EditorProps) {
const [files, setFiles] = useState<FileData[]>([
  {
    id: 'file-1',
    name: 'main.js',
    language: 'javascript',
    code: '// Start coding!\n'
  }
])
const [activeFileId, setActiveFileId] = useState('file-1')

// Helper to get active file
const activeFile = files.find(f => f.id === activeFileId) || files[0]  const [language, setLanguage] = useState(initialLanguage)
  const [users, setUsers] = useState<User[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string, name: string, color: string } | null>(null)
  const [showUsernameModal, setShowUsernameModal] = useState(true)
  const [output, setOutput] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionError, setExecutionError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string, type: 'info' | 'success' | 'error' } | null>(null)
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof Monaco | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const isRemoteChange = useRef(false)
  const decorationsRef = useRef<string[]>([])
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [executionTime, setExecutionTime] = useState<number | undefined>(undefined)

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleUsernameSubmit = (username: string) => {
    setShowUsernameModal(false)
    initializeSocket(username)
  }

  const initializeSocket = (username: string) => {
    if (socketRef.current) {
      socketRef.current.disconnect()
    }

    const socketInstance = io('http://localhost:3000', {
      transports: ['websocket'],
      forceNew: true
    })

    socketRef.current = socketInstance

    socketInstance.on('connect', () => {
      console.log('Connected to Socket.io server with ID:', socketInstance.id)
      setIsConnected(true)
      
      const color = getColorForUser(socketInstance.id)
      setCurrentUser({ id: socketInstance.id, name: username, color })
      
      socketInstance.emit('join-room', roomId, username)
    })

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from Socket.io server')
      setIsConnected(false)
      showToast('Disconnected from server', 'error')
    })

    socketInstance.on('code-update', (data: { code: string, userId: string }) => {
      isRemoteChange.current = true
      setCode(data.code)
    })

    socketInstance.on('language-change', (data: { language: string, userId: string }) => {
      setLanguage(data.language)
      showToast(`Language changed to ${data.language}`, 'info')
    })

    socketInstance.on('room-users', (roomUsers: Array<{ userId: string, username: string }>) => {
      setUsers(roomUsers.map(u => ({
        ...u,
        color: getColorForUser(u.userId)
      })))
    })

    socketInstance.on('user-joined', (user: { userId: string, username: string }) => {
      setUsers(prev => {
        if (prev.some(u => u.userId === user.userId)) {
          return prev
        }
        return [...prev, { ...user, color: getColorForUser(user.userId) }]
      })
      showToast(`${user.username} joined the room`, 'success')
    })

    socketInstance.on('user-left', (user: { userId: string, username: string }) => {
      setUsers(prev => prev.filter(u => u.userId !== user.userId))
      showToast(`${user.username} left the room`, 'info')
    })

    socketInstance.on('cursor-update', (data: { position: { lineNumber: number, column: number }, userId: string, username: string }) => {
      setUsers(prev => prev.map(u => 
        u.userId === data.userId 
          ? { ...u, cursor: data.position }
          : u
      ))
    })
  }

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

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

  // Auto-save code to database
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/rooms/${roomId}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, language })
        })
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }, 2000) // Save 2 seconds after last change

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [code, language, roomId])

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

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)

    if (socketRef.current && isConnected) {
      socketRef.current.emit('language-change', {
        roomId,
        language: newLanguage,
        userId: socketRef.current.id
      })
    }

    showToast(`Language changed to ${newLanguage}`, 'success')
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

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        setExecutionError(data.error)
      }

      setOutput(data.output || '(No output)')
      setExecutionTime(data.executionTime)

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
    <>
      {showUsernameModal && <UsernameModal onSubmit={handleUsernameSubmit} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="h-full flex">
        <div className="flex-1 flex flex-col">
          <style jsx global>{`
            .remote-cursor {
              background-color: transparent;
              border-left: 2px solid;
              position: relative;
            }

            .remote-cursor-line {
              background-color: rgba(78, 205, 196, 0.1);
            }

            @keyframes slide-up {
              from {
                transform: translateY(100%);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }

            .animate-slide-up {
              animation: slide-up 0.3s ease-out;
            }
          `}</style>

          {/* Top bar */}
          <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-300">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {currentUser && (
                <span className="text-sm text-gray-400">
                  <span style={{ color: currentUser.color }} className="font-semibold">{currentUser.name}</span>
                </span>
              )}
              <div className="h-4 w-px bg-gray-600"></div>
              <span className="text-sm text-gray-400">
                {users.length} user{users.length !== 1 ? 's' : ''} online
              </span>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSelector currentLanguage={language} onLanguageChange={handleLanguageChange} />
              <CopyLinkButton roomId={roomId} />
              <GitPanel roomId={roomId} code={code} language={language} />
              <VideoChat socket={socketRef.current} roomId={roomId} currentUser={currentUser} />
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
            executionTime={executionTime}
/>
        </div>

        {/* Sidebar with Users and Chat */}
        <Sidebar 
          users={users} 
          currentUserId={currentUser?.id || null}
          socket={socketRef.current}
          roomId={roomId}
          currentUser={currentUser}
/>
      </div>
    </>
  )
}
