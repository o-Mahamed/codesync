'use client'

import { useState, useEffect, useRef } from 'react'
import { Socket } from 'socket.io-client'

interface VideoChatProps {
  socket: Socket | null
  roomId: string
  currentUser: { id: string, name: string, color: string } | null
}

interface PeerConnection {
  userId: string
  username: string
  connection: RTCPeerConnection
  stream?: MediaStream
}

export default function VideoChat({ socket, roomId, currentUser }: VideoChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [peers, setPeers] = useState<PeerConnection[]>([])
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map())

  // ICE servers for WebRTC connection
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  }

  useEffect(() => {
    if (!socket || !currentUser) return

    // Handle incoming WebRTC signals
    socket.on('webrtc-offer', async ({ from, offer, username }) => {
      await handleOffer(from, offer, username)
    })

    socket.on('webrtc-answer', async ({ from, answer }) => {
      await handleAnswer(from, answer)
    })

    socket.on('webrtc-ice-candidate', async ({ from, candidate }) => {
      await handleIceCandidate(from, candidate)
    })

    socket.on('user-left', ({ userId }) => {
      handleUserLeft(userId)
    })

    return () => {
      socket.off('webrtc-offer')
      socket.off('webrtc-answer')
      socket.off('webrtc-ice-candidate')
      socket.off('user-left')
    }
  }, [socket, currentUser])

  const startCall = async () => {
    try {
      // Always request camera initially
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })

      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Set initial states
      setIsCameraOn(true)
      setIsMicOn(true)

      // Notify others that we're ready for calls
      socket?.emit('webrtc-ready', { roomId, userId: currentUser?.id, username: currentUser?.name })

      setIsOpen(true)
    } catch (error) {
      console.error('Error accessing media devices:', error)
      alert('Could not access camera/microphone. Please check permissions.')
    }
  }

  const createPeerConnection = (userId: string, username: string) => {
    const pc = new RTCPeerConnection(iceServers)

    // Add local stream tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!)
      })
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit('webrtc-ice-candidate', {
          roomId,
          to: userId,
          candidate: event.candidate
        })
      }
    }

    // Handle incoming stream
    pc.ontrack = (event) => {
      setPeers(prev => {
        const existingPeer = prev.find(p => p.userId === userId)
        if (existingPeer) {
          return prev.map(p => 
            p.userId === userId 
              ? { ...p, stream: event.streams[0] }
              : p
          )
        }
        return [...prev, { userId, username, connection: pc, stream: event.streams[0] }]
      })
    }

    peersRef.current.set(userId, pc)
    return pc
  }

  const handleOffer = async (from: string, offer: RTCSessionDescriptionInit, username: string) => {
    const pc = createPeerConnection(from, username)
    
    await pc.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    socket?.emit('webrtc-answer', {
      roomId,
      to: from,
      answer
    })
  }

  const handleAnswer = async (from: string, answer: RTCSessionDescriptionInit) => {
    const pc = peersRef.current.get(from)
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer))
    }
  }

  const handleIceCandidate = async (from: string, candidate: RTCIceCandidateInit) => {
    const pc = peersRef.current.get(from)
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    }
  }

  const handleUserLeft = (userId: string) => {
    const pc = peersRef.current.get(userId)
    if (pc) {
      pc.close()
      peersRef.current.delete(userId)
    }
    setPeers(prev => prev.filter(p => p.userId !== userId))
  }

  const callUser = async (userId: string, username: string) => {
    const pc = createPeerConnection(userId, username)
    
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    socket?.emit('webrtc-offer', {
      roomId,
      to: userId,
      offer,
      username: currentUser?.name
    })
  }

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsCameraOn(videoTrack.enabled)
      }
    }
  }

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMicOn(audioTrack.enabled)
      }
    }
  }

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop())
        screenStreamRef.current = null
      }
      
      // Re-add camera stream
      if (localStreamRef.current && isCameraOn) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0]
        peersRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video')
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack)
          }
        })
      }
      
      setIsScreenSharing(false)
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        screenStreamRef.current = screenStream
        
        const screenTrack = screenStream.getVideoTracks()[0]
        
        // Replace video track in all peer connections
        peersRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video')
          if (sender) {
            sender.replaceTrack(screenTrack)
          }
        })
        
        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream
        }
        
        // Handle screen share stop
        screenTrack.onended = () => {
          toggleScreenShare()
        }
        
        setIsScreenSharing(true)
      } catch (error) {
        console.error('Error sharing screen:', error)
      }
    }
  }

  const endCall = () => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop())
      screenStreamRef.current = null
    }

    // Close all peer connections
    peersRef.current.forEach(pc => pc.close())
    peersRef.current.clear()
    setPeers([])

    setIsOpen(false)
    setIsCameraOn(false)
    setIsScreenSharing(false)
  }

  // Listen for other users ready for calls
  useEffect(() => {
    if (!socket || !isOpen) return

    socket.on('webrtc-user-ready', ({ userId, username }) => {
      if (userId !== currentUser?.id && localStreamRef.current) {
        callUser(userId, username)
      }
    })

    return () => {
      socket.off('webrtc-user-ready')
    }
  }, [socket, isOpen, currentUser])

  return (
    <>
      {/* Video call button */}
      <button
        onClick={startCall}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
        title="Start video call"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span>Call</span>
      </button>

      {/* Video chat modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="w-full h-full max-w-7xl max-h-screen flex flex-col">
            {/* Header */}
            <div className="bg-gray-900 px-4 py-3 flex items-center justify-between rounded-t-lg">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="3" />
                </svg>
                Video Call - {peers.length + 1} participant{peers.length !== 0 ? 's' : ''}
              </h2>
              <button
                onClick={endCall}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Video grid */}
            <div className="flex-1 bg-gray-800 p-4 grid grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
              {/* Local video */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 px-2 py-1 rounded text-white text-sm">
                  You {!isCameraOn && '(Camera Off)'}
                </div>
              </div>

              {/* Remote videos */}
              {peers.map(peer => (
                <RemoteVideo key={peer.userId} peer={peer} />
              ))}
            </div>

            {/* Controls */}
            <div className="bg-gray-900 px-4 py-4 flex items-center justify-center gap-4 rounded-b-lg">
              <button
                onClick={toggleMic}
                className={`p-4 rounded-full transition-colors ${
                  isMicOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
                }`}
                title={isMicOn ? 'Mute' : 'Unmute'}
              >
                {isMicOn ? (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                )}
              </button>

              <button
                onClick={toggleCamera}
                className={`p-4 rounded-full transition-colors ${
                  isCameraOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
                }`}
                title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
              >
                {isCameraOn ? (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                )}
              </button>

              <button
                onClick={toggleScreenShare}
                className={`p-4 rounded-full transition-colors ${
                  isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>

              <button
                onClick={endCall}
                className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
                title="End call"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Component for rendering remote video streams
function RemoteVideo({ peer }: { peer: PeerConnection }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream
    }
  }, [peer.stream])

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 px-2 py-1 rounded text-white text-sm">
        {peer.username}
      </div>
    </div>
  )
}