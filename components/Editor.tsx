'use client'

import { useEffect, useRef, useState } from 'react'
import { Editor } from '@monaco-editor/react'
import { Socket, io } from 'socket.io-client'
import LanguageSelector from './LanguageSelector'
import CopyLinkButton from './CopyLinkButton'
import GitPanel from './GitPanel'
import VideoChat from './VideoChat'
import Sidebar from './Sidebar'
import UsernameModal from './UsernameModal'
import FileManager, { FileData } from './FileManager'
import FileTabs from './FileTabs'
import OutputPanel from './OutputPanel'
import Toast from './Toast'

interface User {
  userId: string
  username: string
  color: string
  cursor?: {
    lineNumber: number
    column: number
  }
}

interface CollaborativeEditorProps {
  roomId: string
}

export default function CollaborativeEditor({ roomId }: CollaborativeEditorProps) {
  // File management
  const [files, setFiles] = useState<FileData[]>([
    {
      id: 'file-1',
      name: 'main.js',
      language: 'javascript',
      code: '// Start coding!\n'
    }
  ])
  const [activeFileId, setActiveFileId] = useState('file-1')
  
  // Get active file
  const activeFile = files.find(f => f.id === activeFileId) || files[0]

  // User and socket management
  const [currentUser, setCurrentUser] = useState<{ id: string, name: string, color: string } | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const socketRef = useRef<Socket | null>(null)
  const editorRef = useRef<any>(null)

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Output panel
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type })
  }

  // Initialize socket connection
  useEffect(() => {
    const socket = io('http://localhost:3000')
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Connected to socket server')
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from socket server')
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  // Handle room state and events
  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !currentUser) return

    // Join room
    socket.emit('join-room', roomId, currentUser.name)

    // Listen for room state
    socket.on('room-state', ({ files: serverFiles, activeFileId: serverActiveFileId }) => {
      if (serverFiles && serverFiles.length > 0) {
        setFiles(serverFiles)
        setActiveFileId(serverActiveFileId)
      }
    })

    // Listen for user list updates
    socket.on('user-list', (userList: User[]) => {
      setUsers(userList)
    })

    // Listen for user joined
    socket.on('user-joined', ({ username }) => {
      showToast(`${username} joined the room`, 'success')
    })

    // Listen for user left
    socket.on('user-left', ({ username }) => {
      showToast(`${username} left the room`, 'info')
    })

    // Listen for code updates
    socket.on('code-update', ({ fileId, code: newCode }) => {
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, code: newCode } : f
      ))
    })

    // Listen for cursor updates
    socket.on('cursor-update', ({ userId, cursor }) => {
      setUsers(prev => prev.map(user =>
        user.userId === userId ? { ...user, cursor } : user
      ))
    })

    // Listen for language updates
    socket.on('language-update', ({ fileId, language }) => {
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, language } : f
      ))
    })

    // File management events
    socket.on('file-created', (newFile: FileData) => {
      setFiles(prev => [...prev, newFile])
      setActiveFileId(newFile.id)
      showToast(`File "${newFile.name}" created`, 'success')
    })

    socket.on('file-renamed', ({ fileId, newName }) => {
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, name: newName } : f
      ))
      showToast(`File renamed to "${newName}"`, 'success')
    })

    socket.on('file-deleted', ({ fileId, newActiveFileId }) => {
      setFiles(prev => prev.filter(f => f.id !== fileId))
      setActiveFileId(newActiveFileId)
      showToast('File deleted', 'info')
    })

    socket.on('file-selected', ({ fileId }) => {
      setActiveFileId(fileId)
    })

    return () => {
      socket.off('room-state')
      socket.off('user-list')
      socket.off('user-joined')
      socket.off('user-left')
      socket.off('code-update')
      socket.off('cursor-update')
      socket.off('language-update')
      socket.off('file-created')
      socket.off('file-renamed')
      socket.off('file-deleted')
      socket.off('file-selected')
    }
  }, [currentUser, roomId])

  const handleUsernameSubmit = (username: string) => {
    const color = '#' + Math.floor(Math.random() * 16777215).toString(16)
    const user = {
      id: Math.random().toString(36).substr(2, 9),
      name: username,
      color
    }
    setCurrentUser(user)
  }

  const handleCodeChange = (value: string | undefined) => {
    if (value === undefined) return

    // Update local state
    setFiles(prev => prev.map(f => 
      f.id === activeFileId ? { ...f, code: value } : f
    ))

    // Emit to socket
    socketRef.current?.emit('code-change', {
      roomId,
      fileId: activeFileId,
      code: value,
      userId: currentUser?.id
    })
  }

  const handleLanguageChange = (language: string) => {
    // Update local state
    setFiles(prev => prev.map(f => 
      f.id === activeFileId ? { ...f, language } : f
    ))

    // Emit to socket
    socketRef.current?.emit('language-change', {
      roomId,
      fileId: activeFileId,
      language
    })
  }

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor

    // Listen for cursor position changes
    editor.onDidChangeCursorPosition((e: any) => {
      const position = e.position
      socketRef.current?.emit('cursor-change', {
        roomId,
        cursor: {
          lineNumber: position.lineNumber,
          column: position.column
        },
        userId: currentUser?.id
      })
    })
  }

  // File management handlers
  const handleFileCreate = (name: string, language: string) => {
    socketRef.current?.emit('file-create', { roomId, name, language })
  }

  const handleFileRename = (fileId: string, newName: string) => {
    socketRef.current?.emit('file-rename', { roomId, fileId, newName })
  }

  const handleFileDelete = (fileId: string) => {
    if (files.length > 1) {
      socketRef.current?.emit('file-delete', { roomId, fileId })
    } else {
      showToast('Cannot delete the last file', 'error')
    }
  }

  const handleFileSelect = (fileId: string) => {
    setActiveFileId(fileId)
    socketRef.current?.emit('file-select', { roomId, fileId, userId: currentUser?.id })
  }

  // Code execution
  const handleRunCode = async () => {
    setIsRunning(true)
    setOutput('Running...')

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: activeFile.code,
          language: activeFile.language,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setOutput(data.output || 'Program executed successfully with no output.')
      } else {
        setOutput(`Error: ${data.error || 'Unknown error occurred'}`)
      }
    } catch (error) {
      console.error('Code execution error:', error)
      setOutput(`Error: Failed to execute code. Make sure the /api/execute endpoint exists.`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Username Modal */}
      {!currentUser && <UsernameModal onSubmit={handleUsernameSubmit} />}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Top bar */}
      <div className="bg-gray-900 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-semibold">CodeSync</h1>
          <span className="text-gray-400 text-sm">Room: {roomId}</span>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSelector
            currentLanguage={activeFile.language}
            onLanguageChange={handleLanguageChange}
          />
          <CopyLinkButton roomId={roomId} />
          <GitPanel roomId={roomId} code={activeFile.code} language={activeFile.language} />
          <VideoChat socket={socketRef.current} roomId={roomId} currentUser={currentUser} />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* File Manager Sidebar */}
        <FileManager
          files={files}
          activeFileId={activeFileId}
          onFileSelect={handleFileSelect}
          onFileCreate={handleFileCreate}
          onFileRename={handleFileRename}
          onFileDelete={handleFileDelete}
        />

        {/* Main editor area */}
        <div className="flex-1 flex flex-col">
          {/* File Tabs */}
          <FileTabs
            files={files}
            activeFileId={activeFileId}
            onFileSelect={handleFileSelect}
            onFileClose={handleFileDelete}
          />

          {/* Editor and Output */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Editor */}
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                language={activeFile.language}
                value={activeFile.code}
                onChange={handleCodeChange}
                onMount={handleEditorMount}
                theme="vs-dark"
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                }}
              />
            </div>

            {/* Output Panel */}
            <OutputPanel
              output={output}
              isRunning={isRunning}
              onRun={handleRunCode}
              onClear={() => setOutput('')}
            />
          </div>
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
    </div>
  )
}