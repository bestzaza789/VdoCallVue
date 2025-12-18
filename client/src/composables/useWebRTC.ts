import { ref, shallowRef, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'
// @ts-ignore - simple-peer has compatibility issues with ESM
import SimplePeer from 'simple-peer/simplepeer.min.js'
import type { Instance as SimplePeerInstance, SignalData } from 'simple-peer'

// Use environment variable for production, fallback to localhost for development
const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || 'http://localhost:3001'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'waiting' | 'in-queue' | 'connected' | 'in-call'

export function useWebRTC() {
    // State
    const socket = shallowRef<Socket | null>(null)
    const peer = shallowRef<SimplePeerInstance | null>(null)
    const localStream = shallowRef<MediaStream | null>(null)
    const remoteStream = shallowRef<MediaStream | null>(null)
    const screenStream = shallowRef<MediaStream | null>(null)

    const status = ref<ConnectionStatus>('disconnected')
    const roomId = ref<string>('')
    const queuePosition = ref<number>(0)
    const isAudioEnabled = ref<boolean>(true)
    const isVideoEnabled = ref<boolean>(true)
    const isScreenSharing = ref<boolean>(false)
    const error = ref<string>('')

    // Initialize socket connection
    function initSocket() {
        if (socket.value) return

        socket.value = io(SIGNALING_SERVER)

        socket.value.on('connect', () => {
            console.log('Connected to signaling server')
        })

        socket.value.on('joined-room', ({ roomId: id }) => {
            console.log('Joined room:', id)
            roomId.value = id
            status.value = 'waiting'
        })

        socket.value.on('added-to-queue', ({ position }) => {
            console.log('Added to queue, position:', position)
            status.value = 'in-queue'
            queuePosition.value = position
        })

        socket.value.on('queue-position', ({ position }) => {
            queuePosition.value = position
        })

        socket.value.on('initiate-call', async ({ peerId }) => {
            console.log('Initiating call with peer:', peerId)
            await createPeer(peerId, true)
        })

        socket.value.on('signal', async ({ from, signal }) => {
            console.log('Received signal from:', from)

            if (!peer.value) {
                // We're receiving a call
                await createPeer(from, false)
            }

            peer.value?.signal(signal)
        })

        socket.value.on('peer-left', () => {
            console.log('Peer left the call')
            destroyPeer()
            status.value = 'waiting'
        })

        socket.value.on('disconnect', () => {
            console.log('Disconnected from signaling server')
            status.value = 'disconnected'
        })
    }

    // Get user media
    async function startLocalStream() {
        try {
            localStream.value = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            })
            return localStream.value
        } catch (err) {
            error.value = 'ไม่สามารถเข้าถึงกล้องหรือไมค์ได้'
            console.error('Error accessing media devices:', err)
            throw err
        }
    }

    // Create peer connection
    async function createPeer(peerId: string, initiator: boolean) {
        if (!localStream.value) {
            await startLocalStream()
        }

        peer.value = new SimplePeer({
            initiator,
            trickle: true,
            stream: localStream.value!,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' }
                ]
            }
        })

        // Store reference to avoid null checks (we just created it above)
        const peerInstance = peer.value!

        peerInstance.on('signal', (signal: SignalData) => {
            socket.value?.emit('signal', { to: peerId, signal })
        })

        peerInstance.on('stream', (stream: MediaStream) => {
            console.log('Received remote stream')
            remoteStream.value = stream
            status.value = 'in-call'
        })

        peerInstance.on('connect', () => {
            console.log('Peer connected')
            status.value = 'connected'
        })

        peerInstance.on('close', () => {
            console.log('Peer connection closed')
            destroyPeer()
        })

        peerInstance.on('error', (err) => {
            console.error('Peer error:', err)
            error.value = 'เกิดข้อผิดพลาดในการเชื่อมต่อ'
            destroyPeer()
        })
    }

    // Destroy peer connection
    function destroyPeer() {
        if (peer.value) {
            peer.value.destroy()
            peer.value = null
        }
        remoteStream.value = null
        isScreenSharing.value = false

        // Stop screen sharing if active
        if (screenStream.value) {
            screenStream.value.getTracks().forEach(track => track.stop())
            screenStream.value = null
        }
    }

    // Join a room
    async function joinRoom(id: string) {
        // Set status immediately so UI updates
        roomId.value = id
        status.value = 'connecting'
        error.value = ''

        initSocket()

        try {
            await startLocalStream()
            // After getting media, emit join-room
            socket.value?.emit('join-room', id)
        } catch (err) {
            // If camera permission denied, still allow to wait
            // but show error message
            console.error('Failed to get media:', err)
            // Still try to join room without media (won't work for call, but shows UI)
            status.value = 'disconnected'
            error.value = 'กรุณาอนุญาตการใช้กล้องและไมค์เพื่อเข้าร่วมการโทร'
        }
    }

    // Leave room
    function leaveRoom() {
        socket.value?.emit('leave-room')
        destroyPeer()

        if (localStream.value) {
            localStream.value.getTracks().forEach(track => track.stop())
            localStream.value = null
        }

        status.value = 'disconnected'
        roomId.value = ''
        queuePosition.value = 0
    }

    // Toggle audio
    function toggleAudio() {
        if (localStream.value) {
            const audioTrack = localStream.value.getAudioTracks()[0]
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled
                isAudioEnabled.value = audioTrack.enabled
            }
        }
    }

    // Toggle video
    function toggleVideo() {
        if (localStream.value) {
            const videoTrack = localStream.value.getVideoTracks()[0]
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled
                isVideoEnabled.value = videoTrack.enabled
            }
        }
    }

    // Toggle screen sharing
    async function toggleScreenShare() {
        if (!peer.value || !localStream.value) return

        try {
            if (isScreenSharing.value) {
                // Stop screen sharing, switch back to camera
                if (screenStream.value) {
                    screenStream.value.getTracks().forEach(track => track.stop())
                    screenStream.value = null
                }

                const videoTrack = localStream.value.getVideoTracks()[0]
                const currentTrack = peer.value.streams[0]?.getVideoTracks()[0]
                if (videoTrack && currentTrack) {
                    peer.value.replaceTrack(
                        currentTrack,
                        videoTrack,
                        localStream.value
                    )
                }
                isScreenSharing.value = false
            } else {
                // Start screen sharing
                screenStream.value = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: false
                })

                const screenTrack = screenStream.value.getVideoTracks()[0]
                const currentTrack = peer.value.streams[0]?.getVideoTracks()[0]

                if (screenTrack && currentTrack) {
                    // Replace the video track with screen track
                    peer.value.replaceTrack(
                        currentTrack,
                        screenTrack,
                        localStream.value
                    )

                    // Handle when user stops sharing via browser UI
                    screenTrack.onended = () => {
                        toggleScreenShare()
                    }

                    isScreenSharing.value = true
                }
            }
        } catch (err) {
            console.error('Error toggling screen share:', err)
            error.value = 'ไม่สามารถแชร์หน้าจอได้'
        }
    }

    // Cleanup on unmount
    onUnmounted(() => {
        leaveRoom()
        socket.value?.disconnect()
    })

    return {
        // State
        localStream,
        remoteStream,
        status,
        roomId,
        queuePosition,
        isAudioEnabled,
        isVideoEnabled,
        isScreenSharing,
        error,

        // Methods
        joinRoom,
        leaveRoom,
        toggleAudio,
        toggleVideo,
        toggleScreenShare
    }
}
