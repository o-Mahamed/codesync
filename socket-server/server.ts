import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

const port = parseInt(process.env.PORT || '3001', 10)

console.log('Starting socket server...')
console.log('Environment:', process.env.NODE_ENV)
console.log('Port:', port)

// Create HTTP server
const httpServer = createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }))
    return
  }

  // Default response
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('CodeSync Socket Server is running!')
})

// Initialize Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

// Store room data
interface User {
  userId: string
  username: string
  color: string
  cursor?: {
    lineNumber: number
    column: number
  }
}

interface Message {
  id: string
  userId: string
  username: string
  message: string
  timestamp: Date
  color: string
}

interface FileData {
  id: string
  name: string
  language: string
  code: string
}

const rooms = new Map<string, {
  files: Map<string, FileData>
  activeFileId: string
  users: Map<string, User>
  messages: Message[]
}>()

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('join-room', (roomId, username) => {
    try {
      if (!roomId || !username) {
        console.error('Invalid join-room data:', { roomId, username })
        return
      }

      const color = '#' + Math.floor(Math.random()*16777215).toString(16)
      
      const user = {
        userId: socket.id,
        username: username,
        color: color
      }

      socket.join(roomId)

      if (!rooms.has(roomId)) {
        const defaultFile: FileData = {
          id: 'file-1',
          name: 'main.js',
          language: 'javascript',
          code: '// Start coding!\n'
        }
        
        rooms.set(roomId, {
          files: new Map([[defaultFile.id, defaultFile]]),
          activeFileId: defaultFile.id,
          users: new Map(),
          messages: []
        })
      }

      const room = rooms.get(roomId)!
      room.users.set(socket.id, user)

      const filesArray = Array.from(room.files.values())
      socket.emit('room-state', {
        files: filesArray,
        activeFileId: room.activeFileId
      })

      const userList = Array.from(room.users.values())
      io.to(roomId).emit('user-list', userList)

      socket.to(roomId).emit('user-joined', {
        userId: socket.id,
        username: user.username,
        color: user.color
      })

      console.log(`User ${username} joined room ${roomId}`)
    } catch (error) {
      console.error('Error in join-room:', error)
    }
  })

  socket.on('code-change', ({ roomId, fileId, code, userId }) => {
    try {
      const room = rooms.get(roomId)
      if (room && fileId) {
        const file = room.files.get(fileId)
        if (file) {
          file.code = code
          socket.to(roomId).emit('code-update', { fileId, code, userId })
        }
      }
    } catch (error) {
      console.error('Error in code-change:', error)
    }
  })

  socket.on('file-create', ({ roomId, name, language }) => {
    try {
      const room = rooms.get(roomId)
      if (room) {
        const newFile: FileData = {
          id: `file-${Date.now()}`,
          name,
          language,
          code: ''
        }
        room.files.set(newFile.id, newFile)
        io.to(roomId).emit('file-created', newFile)
      }
    } catch (error) {
      console.error('Error in file-create:', error)
    }
  })

  socket.on('file-rename', ({ roomId, fileId, newName }) => {
    try {
      const room = rooms.get(roomId)
      if (room) {
        const file = room.files.get(fileId)
        if (file) {
          file.name = newName
          io.to(roomId).emit('file-renamed', { fileId, newName })
        }
      }
    } catch (error) {
      console.error('Error in file-rename:', error)
    }
  })

  socket.on('file-delete', ({ roomId, fileId }) => {
    try {
      const room = rooms.get(roomId)
      if (room && room.files.size > 1) {
        room.files.delete(fileId)
        
        if (room.activeFileId === fileId) {
          room.activeFileId = Array.from(room.files.keys())[0]
        }
        
        io.to(roomId).emit('file-deleted', { fileId, newActiveFileId: room.activeFileId })
      }
    } catch (error) {
      console.error('Error in file-delete:', error)
    }
  })

  socket.on('file-select', ({ roomId, fileId, userId }) => {
    try {
      const room = rooms.get(roomId)
      if (room && room.files.has(fileId)) {
        room.activeFileId = fileId
        socket.to(roomId).emit('file-selected', { fileId, userId })
      }
    } catch (error) {
      console.error('Error in file-select:', error)
    }
  })

  socket.on('cursor-change', ({ roomId, cursor, userId }) => {
    try {
      const room = rooms.get(roomId)
      if (room) {
        const user = room.users.get(socket.id)
        if (user) {
          user.cursor = cursor
          socket.to(roomId).emit('cursor-update', {
            userId,
            cursor
          })
        }
      }
    } catch (error) {
      console.error('Error in cursor-change:', error)
    }
  })

  socket.on('language-change', ({ roomId, fileId, language }) => {
    try {
      const room = rooms.get(roomId)
      if (room && fileId) {
        const file = room.files.get(fileId)
        if (file) {
          file.language = language
          io.to(roomId).emit('language-update', { fileId, language })
        }
      }
    } catch (error) {
      console.error('Error in language-change:', error)
    }
  })

  socket.on('chat-message', ({ roomId, message }) => {
    try {
      const room = rooms.get(roomId)
      if (room && message) {
        room.messages.push(message)
        io.to(roomId).emit('chat-message', message)
      }
    } catch (error) {
      console.error('Error in chat-message:', error)
    }
  })

  socket.on('request-chat-history', (roomId) => {
    try {
      const room = rooms.get(roomId)
      if (room) {
        socket.emit('chat-history', room.messages)
      } else {
        socket.emit('chat-history', [])
      }
    } catch (error) {
      console.error('Error in request-chat-history:', error)
      socket.emit('chat-history', [])
    }
  })

  // WebRTC signaling
  socket.on('webrtc-ready', ({ roomId, userId, username }) => {
    try {
      socket.to(roomId).emit('webrtc-user-ready', { userId, username })
    } catch (error) {
      console.error('Error in webrtc-ready:', error)
    }
  })

  socket.on('webrtc-offer', ({ roomId, to, offer, username }) => {
    try {
      io.to(to).emit('webrtc-offer', {
        from: socket.id,
        offer,
        username
      })
    } catch (error) {
      console.error('Error in webrtc-offer:', error)
    }
  })

  socket.on('webrtc-answer', ({ roomId, to, answer }) => {
    try {
      io.to(to).emit('webrtc-answer', {
        from: socket.id,
        answer
      })
    } catch (error) {
      console.error('Error in webrtc-answer:', error)
    }
  })

  socket.on('webrtc-ice-candidate', ({ roomId, to, candidate }) => {
    try {
      io.to(to).emit('webrtc-ice-candidate', {
        from: socket.id,
        candidate
      })
    } catch (error) {
      console.error('Error in webrtc-ice-candidate:', error)
    }
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)

    try {
      rooms.forEach((room, roomId) => {
        if (room.users.has(socket.id)) {
          const user = room.users.get(socket.id)
          room.users.delete(socket.id)

          const userList = Array.from(room.users.values())
          io.to(roomId).emit('user-list', userList)

          if (user && user.username) {
            io.to(roomId).emit('user-left', {
              userId: socket.id,
              username: user.username
            })
            console.log(`User ${user.username} left room ${roomId}`)
          }

          if (room.users.size === 0) {
            rooms.delete(roomId)
            console.log(`Room ${roomId} deleted (empty)`)
          }
        }
      })
    } catch (error) {
      console.error('Error in disconnect:', error)
    }
  })
})

// Start server
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`✅ Socket server ready on port ${port}`)
  console.log(`Health check: http://localhost:${port}/health`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...')
  httpServer.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})