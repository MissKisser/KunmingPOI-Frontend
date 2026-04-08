<template>
  <div class="autofit-wrapper">
    <div id="autofit-content" class="autofit-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import Autofit from '../utils/autofit'

let autofitInstance: Autofit | null = null

onMounted(() => {
  autofitInstance = new Autofit({
    width: 1920,
    height: 1080,
    el: '#autofit-content'
  })
})

onBeforeUnmount(() => {
  autofitInstance?.destroy()
})
</script>

<style scoped>
.autofit-wrapper {
  position: absolute;
  inset: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  z-index: 10;
  pointer-events: none;
}

.autofit-content {
  pointer-events: none;
}
</style>