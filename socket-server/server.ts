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

  // Store active rooms and their users
  const rooms = new Map<string, Set<string>>()

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Join a room
    socket.on('join-room', (roomId: string, username: string) => {
      socket.join(roomId)
      
      // Track users in room
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set())
      }
      rooms.get(roomId)?.add(socket.id)

      // Store user info
      socket.data.roomId = roomId
      socket.data.username = username || 'Anonymous'

      console.log(`User ${socket.data.username} joined room ${roomId}`)

      // Notify others in room
      socket.to(roomId).emit('user-joined', {
        userId: socket.id,
        username: socket.data.username
      })

      // Send current users to new user
      const roomUsers = Array.from(rooms.get(roomId) || [])
        .map(id => {
          const userSocket = io.sockets.sockets.get(id)
          return {
            userId: id,
            username: userSocket?.data.username || 'Anonymous'
          }
        })
      
      socket.emit('room-users', roomUsers)
    })

    // Handle code changes
    socket.on('code-change', (data: { roomId: string, code: string, userId: string }) => {
      // Broadcast to everyone in room except sender
      socket.to(data.roomId).emit('code-update', {
        code: data.code,
        userId: data.userId
      })
    })

    // Handle cursor position changes
    socket.on('cursor-change', (data: { roomId: string, position: any, userId: string }) => {
      socket.to(data.roomId).emit('cursor-update', {
        position: data.position,
        userId: data.userId,
        username: socket.data.username
      })
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      const roomId = socket.data.roomId
      
      if (roomId && rooms.has(roomId)) {
        rooms.get(roomId)?.delete(socket.id)
        
        // Clean up empty rooms
        if (rooms.get(roomId)?.size === 0) {
          rooms.delete(roomId)
        }

        // Notify others
        socket.to(roomId).emit('user-left', {
          userId: socket.id,
          username: socket.data.username
        })
      }

      console.log('Client disconnected:', socket.id)
    })
  })

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})
