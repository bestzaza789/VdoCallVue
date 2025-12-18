<template>
  <div class="video-call">
    <!-- Remote Video (Full Screen) -->
    <div class="remote-video-container">
      <video 
        ref="remoteVideo" 
        autoplay 
        playsinline
        class="remote-video"
      ></video>
      <div v-if="!remoteStream" class="no-video">
        <span class="icon">👤</span>
        <span>รอการเชื่อมต่อ...</span>
      </div>
    </div>

    <!-- Local Video (Picture-in-Picture) -->
    <div class="local-video-container" :class="{ 'screen-sharing': isScreenSharing }">
      <video 
        ref="localVideo" 
        autoplay 
        muted 
        playsinline
        class="local-video"
      ></video>
      <div v-if="isScreenSharing" class="sharing-indicator">
        🖥️ กำลังแชร์หน้าจอ
      </div>
    </div>

    <!-- Call Controls -->
    <div class="controls-container">
      <CallControls
        :is-audio-enabled="isAudioEnabled"
        :is-video-enabled="isVideoEnabled"
        :is-screen-sharing="isScreenSharing"
        :can-screen-share="canScreenShare"
        @toggle-audio="$emit('toggle-audio')"
        @toggle-video="$emit('toggle-video')"
        @toggle-screen-share="$emit('toggle-screen-share')"
        @end-call="$emit('end-call')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import CallControls from './CallControls.vue'

const props = defineProps<{
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isScreenSharing: boolean
}>()

defineEmits<{
  'toggle-audio': []
  'toggle-video': []
  'toggle-screen-share': []
  'end-call': []
}>()

const localVideo = ref<HTMLVideoElement | null>(null)
const remoteVideo = ref<HTMLVideoElement | null>(null)

const canScreenShare = computed(() => props.remoteStream !== null)

// Attach streams to video elements
watch(() => props.localStream, (stream) => {
  if (localVideo.value && stream) {
    localVideo.value.srcObject = stream
  }
}, { immediate: true })

watch(() => props.remoteStream, (stream) => {
  if (remoteVideo.value && stream) {
    remoteVideo.value.srcObject = stream
  }
}, { immediate: true })

onMounted(() => {
  if (localVideo.value && props.localStream) {
    localVideo.value.srcObject = props.localStream
  }
  if (remoteVideo.value && props.remoteStream) {
    remoteVideo.value.srcObject = props.remoteStream
  }
})
</script>

<style scoped>
.video-call {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #0a0a0f;
  overflow: hidden;
}

.remote-video-container {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remote-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-video {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.5);
}

.no-video .icon {
  font-size: 5rem;
  opacity: 0.3;
}

.local-video-container {
  position: absolute;
  bottom: 120px;
  right: 20px;
  width: 240px;
  aspect-ratio: 16/9;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 3px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  z-index: 10;
}

.local-video-container:hover {
  transform: scale(1.05);
  border-color: rgba(255, 255, 255, 0.3);
}

.local-video-container.screen-sharing {
  border-color: #2196f3;
  box-shadow: 0 8px 32px rgba(33, 150, 243, 0.3);
}

.local-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
  background: #1a1a2e;
}

.sharing-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.5rem;
  background: rgba(33, 150, 243, 0.9);
  color: white;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 500;
}

.controls-container {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
}

@media (max-width: 768px) {
  .local-video-container {
    width: 120px;
    right: 10px;
    bottom: 100px;
  }
  
  .controls-container {
    bottom: 10px;
    width: calc(100% - 20px);
  }
}
</style>
