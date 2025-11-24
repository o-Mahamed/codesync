'use client'

import { useState, useEffect, useRef } from 'react'
import { Socket } from 'socket.io-client'

interface Message {
  id: string
  userId: string
  username: string
  message: string
  timestamp: Date
  color: string
}

interface ChatProps {
  socket: Socket | null
  roomId: string
  currentUser: { id: string, name: string, color: string } | null
  isInSidebar?: boolean
}

export default function Chat({ socket, roomId, currentUser, isInSidebar = false }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!socket) return

    socket.on('chat-message', (message: Message) => {
      setMessages(prev => [...prev, message])
    })

    socket.on('chat-history', (history: Message[]) => {
      setMessages(history)
    })

    socket.emit('request-chat-history', roomId)

    return () => {
      socket.off('chat-message')
      socket.off('chat-history')
    }
  }, [socket, roomId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!inputMessage.trim() || !socket || !currentUser) return

    const message: Message = {
      id: `${Date.now()}-${Math.random()}`,
      userId: currentUser.id,
      username: currentUser.name,
      message: inputMessage.trim(),
      timestamp: new Date(),
      color: currentUser.color
    }

    socket.emit('chat-message', { roomId, message })
    setInputMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No messages yet</p>
            <p className="text-gray-600 text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-semibold"
                  style={{ color: msg.color }}
                >
                  {msg.username}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-gray-300 break-words">{msg.message}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim()}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
