import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { parse } from 'url'
import next from 'next'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handler = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handler(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  const rooms = new Map<string, Set<string>>()

  console.log('🚀 Socket.io server initialized')

  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id)

    socket.on('join-room', (roomId: string, username: string) => {
      console.log(`👤 User "${username}" (${socket.id}) joining room "${roomId}"`)
      
      socket.join(roomId)
      
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set())
      }
      rooms.get(roomId)?.add(socket.id)

      socket.data.roomId = roomId
      socket.data.username = username

      console.log(`📢 Broadcasting user-joined to room "${roomId}"`)
      socket.to(roomId).emit('user-joined', {
        userId: socket.id,
        username: socket.data.username
      })

      const roomUsers = Array.from(rooms.get(roomId) || [])
        .map(id => {
          const userSocket = io.sockets.sockets.get(id)
          return {
            userId: id,
            username: userSocket?.data.username || 'Anonymous'
          }
        })
      
      socket.emit('room-users', roomUsers)
      console.log(`✨ Total users in room "${roomId}":`, rooms.get(roomId)?.size)
    })

    socket.on('code-change', (data: { roomId: string, code: string, userId: string }) => {
      socket.to(data.roomId).emit('code-update', {
        code: data.code,
        userId: data.userId
      })
    })

    socket.on('language-change', (data: { roomId: string, language: string, userId: string }) => {
      console.log(`🔄 Language changed to ${data.language} by ${data.userId}`)
      socket.to(data.roomId).emit('language-change', {
        language: data.language,
        userId: data.userId
      })
    })

    socket.on('cursor-change', (data: { roomId: string, position: any, userId: string }) => {
      socket.to(data.roomId).emit('cursor-update', {
        position: data.position,
        userId: data.userId,
        username: socket.data.username
      })
    })

    socket.on('disconnect', () => {
      const roomId = socket.data.roomId
      
      console.log(`❌ Client disconnected: ${socket.id}`)
      
      if (roomId && rooms.has(roomId)) {
        rooms.get(roomId)?.delete(socket.id)
        
        if (rooms.get(roomId)?.size === 0) {
          rooms.delete(roomId)
        }

        socket.to(roomId).emit('user-left', {
          userId: socket.id,
          username: socket.data.username
        })
      }
    })
  })

  httpServer
    .once('error', (err) => {
      console.error('❌ Server error:', err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> Socket.io server running`)
    })
})
