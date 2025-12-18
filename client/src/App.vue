<template>
  <div class="app">
    <!-- Home Screen - Enter Room -->
    <div v-if="status === 'disconnected'" class="home-screen">
      <div class="home-content">
        <div class="logo">
          <span class="logo-icon">📹</span>
          <h1>VdoCall</h1>
        </div>
        <p class="tagline">วิดีโอคอลแบบ 1:1 ง่ายๆ ไม่ต้องลงทะเบียน</p>
        
        <form @submit.prevent="handleJoinRoom" class="join-form">
          <div class="input-group">
            <input 
              v-model="roomInput"
              type="text"
              placeholder="ใส่รหัสห้อง หรือปล่อยว่างเพื่อสร้างห้องใหม่"
              class="room-input"
            />
          </div>
          <button type="submit" class="join-btn">
            <span class="btn-icon">🚀</span>
            <span>{{ roomInput ? 'เข้าร่วมห้อง' : 'สร้างห้องใหม่' }}</span>
          </button>
        </form>

        <div class="features">
          <div class="feature">
            <span class="feature-icon">🔒</span>
            <span>ปลอดภัย</span>
          </div>
          <div class="feature">
            <span class="feature-icon">🖥️</span>
            <span>แชร์หน้าจอ</span>
          </div>
          <div class="feature">
            <span class="feature-icon">👥</span>
            <span>แค่ 2 คน</span>
          </div>
        </div>
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>

    <!-- Waiting Room -->
    <WaitingRoom
      v-else-if="status === 'waiting' || status === 'in-queue' || status === 'connecting'"
      :room-id="roomId"
      :queue-position="queuePosition"
      :local-stream="localStream"
      @cancel="handleLeaveRoom"
    />

    <!-- Video Call -->
    <VideoCall
      v-else-if="status === 'connected' || status === 'in-call'"
      :local-stream="localStream"
      :remote-stream="remoteStream"
      :is-audio-enabled="isAudioEnabled"
      :is-video-enabled="isVideoEnabled"
      :is-screen-sharing="isScreenSharing"
      @toggle-audio="toggleAudio"
      @toggle-video="toggleVideo"
      @toggle-screen-share="toggleScreenShare"
      @end-call="handleLeaveRoom"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useWebRTC } from './composables/useWebRTC'
import WaitingRoom from './components/WaitingRoom.vue'
import VideoCall from './components/VideoCall.vue'

const {
  localStream,
  remoteStream,
  status,
  roomId,
  queuePosition,
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  error,
  joinRoom,
  leaveRoom,
  toggleAudio,
  toggleVideo,
  toggleScreenShare
} = useWebRTC()

const roomInput = ref('')

// Generate random room ID
function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function handleJoinRoom() {
  const room = roomInput.value.trim() || generateRoomId()
  joinRoom(room)
  
  // Update URL
  window.history.pushState({}, '', `/room/${room}`)
}

function handleLeaveRoom() {
  leaveRoom()
  window.history.pushState({}, '', '/')
}

// Check URL for room ID on mount
onMounted(() => {
  const path = window.location.pathname
  const match = path.match(/^\/room\/(.+)$/)
  if (match) {
    const urlRoomId = match[1]
    roomInput.value = urlRoomId
    joinRoom(urlRoomId)
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #0a0a0f;
  color: white;
  min-height: 100vh;
}

.app {
  min-height: 100vh;
}

.home-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
  position: relative;
  overflow: hidden;
}

.home-screen::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 50%);
  animation: rotate 30s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.home-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 500px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.logo-icon {
  font-size: 3rem;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.logo h1 {
  font-size: 3rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tagline {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 2.5rem;
  font-size: 1.1rem;
}

.join-form {
  margin-bottom: 2rem;
}

.input-group {
  margin-bottom: 1rem;
}

.room-input {
  width: 100%;
  padding: 1rem 1.5rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;
  text-align: center;
}

.room-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.room-input:focus {
  outline: none;
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.2);
}

.join-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem 2rem;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.join-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.btn-icon {
  font-size: 1.25rem;
}

.features {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

.feature {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}

.feature-icon {
  font-size: 1.5rem;
}

.error-message {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 1rem 2rem;
  background: rgba(244, 67, 54, 0.9);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(244, 67, 54, 0.3);
  z-index: 100;
}

@media (max-width: 600px) {
  .logo h1 {
    font-size: 2rem;
  }
  
  .logo-icon {
    font-size: 2rem;
  }
  
  .features {
    gap: 1.5rem;
  }
}
</style>
