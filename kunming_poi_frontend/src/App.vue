<template>
  <div class="screen">
    <section class="map-background">
      <MapView ref="mapView" />
      <div class="map-clock">
        <div class="map-clock__time">{{ currentTime.split(' ')[1] }}</div>
        <div class="map-clock__date">{{ currentTime.split(' ')[0] }}</div>
      </div>
    </section>

    <AutofitContainer>
      <div class="dot-bg"></div>
      <div class="border-bg"></div>

      <div class="perimeter-flow">
        <SvgAnimate class="flow-p top-line-l" :width="960" :height="78" color="#30DCFF" :stroke-width="3" path="M1 1L30.5 49.5H656L668 62H696.5L706.5 77H960" />
        <SvgAnimate class="flow-p top-line-r" :width="960" :height="78" color="#30DCFF" :stroke-width="3" path="M959 1L927 49.5H301.5L289.5 62H261L251 77H0" />
        
        <SvgAnimate class="flow-p left-side-line" :width="944" :height="1002" :duration="5" color="#30DCFF" :stroke-width="3" path="M639.162 1H26.4865L1 26.4364V969.08L26.4865 1001H945" />
        <SvgAnimate class="flow-p right-side-line" :width="944" :height="1002" :duration="5" color="#30DCFF" :stroke-width="3" path="M305.838 1H918.513L944 26.4364V969.08L918.513 1001H0" />

        <img class="bottom-decoration" src="@/assets/icon/bg-2.svg" alt="decoration">
      </div>

      <header class="float-header" :class="[isInit ? 'active' : '']">
        <div class="title">昆明空间高频模式态势感知</div>
      </header>

      <div class="ui-overlay">
        <ScreenContainer position="left" :is-init="isInit">
          <LeftTop :stats="overviewStats" :categoryCount="categoryCount" :districtCount="districtCount" />
          <LeftCenter :pieData="pieData" />
          <LeftBottom ref="leftBottom" />
        </ScreenContainer>

        <ScreenContainer position="right" :is-init="isInit">
          <RightTop @pattern-click="onPatternClick" />
          <RightBottom />
        </ScreenContainer>
      </div>
    </AutofitContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import MapView from './components/MapView.vue'
import LeftTop from './components/LeftTop.vue'
import LeftCenter from './components/LeftCenter.vue'
import LeftBottom from './components/LeftBottom.vue'
import RightTop from './components/RightTop.vue'
import RightBottom from './components/RightBottom.vue'
import ScreenContainer from './components/ScreenContainer.vue'
import SvgAnimate from './components/SvgAnimate.vue'
import AutofitContainer from './components/AutofitContainer.vue'
import { fetchGlobalSummary, fetchCategoryStats, fetchDistrictSummary } from './api/index'

const currentTime = ref('')
const isInit = ref(false)
let timer: ReturnType<typeof setInterval>

function updateTime() {
  const now = new Date()
  currentTime.value = `${now.toLocaleDateString('zh-CN')} ${now.toLocaleTimeString('zh-CN', { hour12: false })}`
}

const overviewStats = ref([
  { label: 'POI 总量', value: '—' },
  { label: '挖掘模式数', value: '—' },
  { label: '模式实例数', value: '—' },
])

const leftBottom = ref<InstanceType<typeof LeftBottom> | null>(null)
const pieData = ref<{ name: string; value: number }[]>([])
const categoryCount = ref(0)
const districtCount = ref(0)

const mapView = ref<InstanceType<typeof MapView> | null>(null)

async function onPatternClick(patternId: number) {
  mapView.value?.renderPattern(patternId)
}

onMounted(async () => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  
  setTimeout(() => {
    isInit.value = true
  }, 100)

  try {
    const [summaryRes, categoryRes, districtRes] = await Promise.all([
      fetchGlobalSummary(),
      fetchCategoryStats(),
      fetchDistrictSummary(),
    ])
    
    overviewStats.value = [
      { label: 'POI 总量', value: summaryRes.data.poi_total.toLocaleString() },
      { label: '挖掘模式数', value: summaryRes.data.pattern_total.toLocaleString() },
      { label: '模式实例数', value: summaryRes.data.instance_total.toLocaleString() },
    ]

    pieData.value = categoryRes.data.map(c => ({
      name: c.category_name,
      value: c.poi_count
    }))
    
    categoryCount.value = categoryRes.data.length
    districtCount.value = districtRes.data.length

    leftBottom.value?.renderDistrictStats(districtRes.data)
  } catch (err) {
    console.warn('后端总览接口请求失败', err)
  }
})

onBeforeUnmount(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.screen {
  width: 100vw;
  height: 100vh;
  background: #060d18;
  overflow: hidden;
  position: relative;
}

.map-background {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.perimeter-flow {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}
.flow-p { position: absolute; }
.top-line-l { top: 24px; left: 0; }
.top-line-r { top: 24px; right: 0; }
.left-side-line { left: 14px; top: 64px; height: calc(100% - 68px); width: 50%; }
.right-side-line { right: 14px; top: 64px; height: calc(100% - 68px); width: 50%; text-align: right; }

.bottom-decoration {
  position: absolute;
  bottom: 16px;
  opacity: .6;
  width: 1400px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

.dot-bg {
    pointer-events: none;
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    background: url('@/assets/icon/bg-dot.png');
    background-size: 20px 20px;
    opacity: 0.15;
    z-index: 1;
}

.border-bg {
    position: absolute;
    inset: 0;
    padding: 64px 15px 4px 15px;
    pointer-events: none;
    z-index: 30;
    &::before {
        content: '';
        display: block;
        width: 100%;
        height: 100%;
        background: url('@/assets/icon/border-bg.png') no-repeat;
        background-size: 100% 100%;
        opacity: 0.6;
    }
}

.float-header {
  position: absolute;
  top: -105px;
  left: 0;
  width: 100%;
  height: 105px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  pointer-events: none;
  transition: all 0.5s linear;
  background: url('@/assets/icon/header-bg.png') no-repeat;
  background-size: 100% 100%;
}

.float-header.active {
  top: -20px;
}

.title {
  font-family: 'YouShe', serif;
  letter-spacing: 4px;
  background: linear-gradient(180deg, #E3FFFE 27%, #ACFFFD 75%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
  font-size: 44px;
  position: relative;
  top: 2px;
  text-shadow: 0 0 20px rgba(62, 229, 255, 0.4);
}

.map-clock {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: clamp(4px, 0.5vh, 8px) clamp(8px, 0.8vw, 14px);
  padding-left: clamp(8px, 0.7vw, 12px);
  background: rgba(0, 12, 30, 0.72);
  border: 1px solid rgba(0, 200, 255, 0.35);
  border-left: 3px solid rgba(0, 200, 255, 0.8);
  border-radius: 4px;
  backdrop-filter: blur(8px);
  box-shadow: 0 0 16px rgba(0, 200, 255, 0.1), inset 0 0 20px rgba(0, 200, 255, 0.04);
  pointer-events: none;
  max-height: 69px;
  overflow: hidden;
}

.map-clock__time {
  font-family: 'MiSans-Demibold', 'Courier New', monospace;
  font-size: clamp(16px, 1.6vw, 24px);
  line-height: 1;
  letter-spacing: clamp(1px, 0.15vw, 3px);
  background: linear-gradient(180deg, #E3FFFE 0%, #30DCFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-variant-numeric: tabular-nums;
}

.map-clock__date {
  margin-top: clamp(2px, 0.3vh, 4px);
  font-family: 'MiSans-Normal', sans-serif;
  font-size: clamp(9px, 0.7vw, 11px);
  letter-spacing: 1.5px;
  color: rgba(0, 200, 255, 0.65);
}

.ui-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 1920px;
  height: 1080px;
  z-index: 5;
  pointer-events: none;
}

.stat-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: radial-gradient(50% 57% at 50% 100%, rgba(76, 153, 191, 0.3) 0%, rgba(50, 88, 108, 0.1) 99%);
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(166, 255, 255, 0.15);
  transition: all 0.3s ease;
}

.stat-item:hover {
  border-color: rgba(166, 255, 255, 0.3);
  background: radial-gradient(50% 57% at 50% 100%, rgba(76, 153, 191, 0.4) 0%, rgba(50, 88, 108, 0.15) 99%);
}

.stat-value {
  font-size: 22px;
  font-family: 'MiSans-Demibold', serif;
  background: linear-gradient(180deg, #D2FEFF 0%, #95F1F7 53%, #DFFFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 12px;
  color: #E3FFFE;
  opacity: 0.85;
}

.chart-container {
  width: 100%;
}
</style>