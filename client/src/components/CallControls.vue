<template>
  <div class="call-controls">
    <button 
      class="control-btn" 
      :class="{ 'active': isAudioEnabled, 'muted': !isAudioEnabled }"
      @click="$emit('toggle-audio')"
      :title="isAudioEnabled ? 'ปิดไมค์' : 'เปิดไมค์'"
    >
      <span class="icon">{{ isAudioEnabled ? '🎤' : '🔇' }}</span>
      <span class="label">{{ isAudioEnabled ? 'ไมค์เปิด' : 'ไมค์ปิด' }}</span>
    </button>

    <button 
      class="control-btn" 
      :class="{ 'active': isVideoEnabled, 'muted': !isVideoEnabled }"
      @click="$emit('toggle-video')"
      :title="isVideoEnabled ? 'ปิดกล้อง' : 'เปิดกล้อง'"
    >
      <span class="icon">{{ isVideoEnabled ? '📹' : '📷' }}</span>
      <span class="label">{{ isVideoEnabled ? 'กล้องเปิด' : 'กล้องปิด' }}</span>
    </button>

    <button 
      class="control-btn screen-share" 
      :class="{ 'sharing': isScreenSharing }"
      @click="$emit('toggle-screen-share')"
      :disabled="!canScreenShare"
      :title="isScreenSharing ? 'หยุดแชร์หน้าจอ' : 'แชร์หน้าจอ'"
    >
      <span class="icon">🖥️</span>
      <span class="label">{{ isScreenSharing ? 'หยุดแชร์' : 'แชร์หน้าจอ' }}</span>
    </button>

    <button 
      class="control-btn end-call"
      @click="$emit('end-call')"
      title="วางสาย"
    >
      <span class="icon">📞</span>
      <span class="label">วางสาย</span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isScreenSharing: boolean
  canScreenShare: boolean
}>()

defineEmits<{
  'toggle-audio': []
  'toggle-video': []
  'toggle-screen-share': []
  'end-call': []
}>()
</script>

<style scoped>
.call-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 50px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.control-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
}

.control-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn.active {
  background: rgba(76, 175, 80, 0.3);
}

.control-btn.muted {
  background: rgba(244, 67, 54, 0.3);
}

.control-btn.screen-share.sharing {
  background: rgba(33, 150, 243, 0.4);
  animation: pulse 2s infinite;
}

.control-btn.end-call {
  background: linear-gradient(135deg, #f44336, #d32f2f);
}

.control-btn.end-call:hover {
  background: linear-gradient(135deg, #d32f2f, #b71c1c);
  transform: translateY(-2px) scale(1.05);
}

.icon {
  font-size: 1.5rem;
}

.label {
  font-size: 0.7rem;
  opacity: 0.9;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.4);
  }
  50% {
    box-shadow: 0 0 20px 5px rgba(33, 150, 243, 0.2);
  }
}

@media (max-width: 600px) {
  .call-controls {
    padding: 0.75rem 1rem;
    gap: 0.5rem;
  }
  
  .control-btn {
    padding: 0.5rem 0.75rem;
    min-width: 60px;
  }
  
  .label {
    display: none;
  }
}
</style>
