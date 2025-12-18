<template>
  <div class="waiting-room">
    <div class="waiting-content">
      <div class="waiting-animation">
        <div class="pulse-ring"></div>
        <div class="pulse-ring delay-1"></div>
        <div class="pulse-ring delay-2"></div>
        <div class="waiting-icon">⏳</div>
      </div>
      
      <h2 v-if="inQueue">คุณอยู่ในคิว</h2>
      <h2 v-else>รอผู้เข้าร่วม...</h2>
      
      <p v-if="inQueue" class="queue-info">
        ลำดับที่ <span class="position">{{ queuePosition }}</span>
      </p>
      <p v-else class="waiting-text">
        แชร์ลิงก์ด้านล่างเพื่อเชิญเข้าร่วม
      </p>
      
      <div class="room-link">
        <input 
          type="text" 
          :value="roomUrl" 
          readonly 
          ref="linkInput"
          class="link-input"
        />
        <button @click="copyLink" class="copy-btn" :class="{ 'copied': copied }">
          {{ copied ? '✓ คัดลอกแล้ว' : '📋 คัดลอก' }}
        </button>
      </div>
      
      <button @click="$emit('cancel')" class="cancel-btn">
        ยกเลิก
      </button>
    </div>
    
    <!-- Local video preview -->
    <div class="local-preview">
      <video 
        ref="localVideo" 
        autoplay 
        muted 
        playsinline
      ></video>
      <span class="preview-label">ตัวอย่างกล้องของคุณ</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps<{
  roomId: string
  queuePosition: number
  localStream: MediaStream | null
}>()

defineEmits<{
  'cancel': []
}>()

const copied = ref(false)
const linkInput = ref<HTMLInputElement | null>(null)
const localVideo = ref<HTMLVideoElement | null>(null)

const inQueue = computed(() => props.queuePosition > 0)
const roomUrl = computed(() => `${window.location.origin}/room/${props.roomId}`)

function copyLink() {
  navigator.clipboard.writeText(roomUrl.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

// Attach local stream to video element
watch(() => props.localStream, (stream) => {
  if (localVideo.value && stream) {
    localVideo.value.srcObject = stream
  }
}, { immediate: true })

onMounted(() => {
  if (localVideo.value && props.localStream) {
    localVideo.value.srcObject = props.localStream
  }
})
</script>

<style scoped>
.waiting-room {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: white;
}

.waiting-content {
  text-align: center;
  max-width: 500px;
}

.waiting-animation {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 2rem;
}

.pulse-ring {
  position: absolute;
  inset: 0;
  border: 2px solid rgba(100, 200, 255, 0.4);
  border-radius: 50%;
  animation: pulse-out 2s ease-out infinite;
}

.pulse-ring.delay-1 {
  animation-delay: 0.5s;
}

.pulse-ring.delay-2 {
  animation-delay: 1s;
}

.waiting-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 3rem;
  animation: bounce 1.5s ease-in-out infinite;
}

@keyframes pulse-out {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -55%) scale(1.1);
  }
}

h2 {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.queue-info {
  font-size: 1.25rem;
  margin-bottom: 2rem;
}

.position {
  display: inline-block;
  background: linear-gradient(135deg, #667eea, #764ba2);
  padding: 0.25rem 1rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 1.5rem;
}

.waiting-text {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1.5rem;
}

.room-link {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.link-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.9rem;
}

.copy-btn {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.copy-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.copy-btn.copied {
  background: linear-gradient(135deg, #4caf50, #45a049);
}

.cancel-btn {
  padding: 0.75rem 2rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 25px;
  background: transparent;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.local-preview {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 200px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.local-preview video {
  width: 100%;
  display: block;
  transform: scaleX(-1);
  background: #000;
}

.preview-label {
  display: block;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.7);
  text-align: center;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
}

@media (max-width: 600px) {
  .room-link {
    flex-direction: column;
  }
  
  .local-preview {
    width: 120px;
    bottom: 1rem;
    right: 1rem;
  }
}
</style>
