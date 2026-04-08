<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useAMap } from '../composables/useAMap'
import { fetchHeatmapData, fetchPatternInstances } from '../api/index'
import type { PatternInstance, PoiDetail } from '../api/index'

const mapContainer = ref<HTMLDivElement | null>(null)
const currentStyleKey = ref(localStorage.getItem('mapStyleKey') || 'blue')
const hasPatternData = ref(false)
const loading = ref(false)
const loadingText = ref('')

const layerVisibility = ref({
  heatmap: true,
  scatter: true,
})

const categoryVisibility = ref<Record<string, boolean>>({})
const activeCategoriesLegend = ref<Array<{ name: string; color: string; count: number; visible: boolean }>>([])

let mapInstance: any = null
let locaInstance: any = null
let heatmapLayer: any = null
let scatterLayer: any = null
let satelliteLayer: any = null

let currentInstances: PatternInstance[] = []

const styleOptions = [
  { key: 'dark', label: '暗黑', style: 'amap://styles/dark' },
  { key: 'darkblue', label: '深蓝暗色', style: 'amap://styles/darkblue' },
  { key: 'blue', label: '深蓝科技', style: 'amap://styles/blue' },
  { key: 'normal', label: '标准', style: 'amap://styles/normal' },
  { key: 'satellite', label: '卫星图', style: 'satellite' },
]

const categoryColorMap: Record<string, string> = {
  '购物消费': '#FF6B6B',
  '科教文化': '#4ECDC4',
  '医疗保健': '#45B7D1',
  '汽车相关': '#FFA07A',
  '生活服务': '#98D8C8',
  '交通设施': '#F7DC6F',
  '餐饮美食': '#BB8FCE',
  '休闲娱乐': '#F8B739',
  '运动健身': '#52C41A',
}

onMounted(async () => {
  console.log('[MapView] 开始初始化地图')
  try {
    const AMap = await useAMap()
    console.log('[Amap] SDK 加载完成')

    satelliteLayer = new AMap.TileLayer.Satellite()

    mapInstance = new AMap.Map(mapContainer.value, {
      viewMode: '3D',
      zoom: 2,
      center: [102.7184, 25.0406],
      mapStyle: 'amap://styles/normal',
      pitch: 0,
      skyColor: '#000000',
      showLabel: true,
      showBuildingBlock: true,
      features: ['bg', 'building'],
      pitchEnable: true,
      rotateEnable: true,
      keyboardEnable: false,
      dragEnable: true,
      zoomEnable: true,
    })

    mapInstance.add(satelliteLayer)
    console.log('[Amap] 初始化完成，默认使用卫星底图')

    mapInstance.on('complete', () => {
      console.log('[Amap] 地图实例创建完成，等待看板展开')
      
      setTimeout(() => {
        const savedStyle = localStorage.getItem('mapStyleKey')
        console.log('[Amap] 检查底图缓存设置:', savedStyle || '无缓存')
        
        if (savedStyle) {
          const selected = styleOptions.find(o => o.key === savedStyle)
          if (selected) {
            if (selected.key === 'satellite') {
              console.log('[Amap] 使用缓存的卫星底图')
            } else {
              mapInstance.remove(satelliteLayer)
              mapInstance.setMapStyle(selected.style)
              console.log('[Amap] 切换到缓存底图:', selected.label)
            }
          }
        } else {
          mapInstance.remove(satelliteLayer)
          mapInstance.setMapStyle('amap://styles/blue')
          console.log('[Amap] 无缓存，切换到默认深蓝科技底图')
        }
        
        console.log('[Amap] 开始飞入动画')
        mapInstance.setZoomAndCenter(11, [102.7184, 25.0406], false, 4000)
        
        setTimeout(() => {
          mapInstance.setPitch(30, false, 1000)
        }, 4000)
      }, 1000)
    })

    await initHeatmapLayer(AMap)

    if (!(window as any).Loca) {
      throw new Error('Loca 可视化库未加载')
    }
    locaInstance = new (window as any).Loca.Container({ map: mapInstance })
    console.log('[Loca] 容器创建成功')

    initScatterLayer()

    locaInstance.animate.start()
    console.log('[MapView] 所有图层初始化完成')
    
  } catch (err) {
    console.error('[MapView] 初始化异常:', err)
  }
})

onBeforeUnmount(() => {
  if (locaInstance) {
    locaInstance.destroy()
  }
  if (mapInstance) {
    mapInstance.destroy()
  }
})

async function initHeatmapLayer(AMap: any) {
  try {
    console.log('[Heatmap] 开始加载热力图数据')
    loading.value = true
    loadingText.value = '加载热力图数据...'

    const res = await fetchHeatmapData(50000)
    const heatmapData = res.data

    if (!Array.isArray(heatmapData) || heatmapData.length === 0) {
      throw new Error('后端返回空数据或格式错误')
    }

    const points = heatmapData.map(({ lng, lat }: { lng: number; lat: number }) => ({
      lng,
      lat,
      count: 1,
    }))

    await new Promise<void>((resolve, reject) => {
      mapInstance.plugin(['AMap.HeatMap'], () => {
        try {
          heatmapLayer = new AMap.HeatMap(mapInstance, {
            radius: 25,
            opacity: [0, 0.8],
            gradient: {
              0.1: 'rgba(0, 100, 255, 0.4)',
              0.3: 'rgba(0, 200, 255, 0.6)',
              0.5: 'rgba(0, 255, 200, 0.75)',
              0.7: 'rgba(255, 255, 0, 0.85)',
              1.0: 'rgba(255, 80, 0, 1)',
            },
            zooms: [3, 20],
            visible: true,
            zIndex: 130,
          })

          heatmapLayer.setDataSet({ data: points, max: 20 })

          console.log('[Heatmap] AMap.HeatMap 初始化完成，数据点数:', points.length)
          resolve()
        } catch (e) {
          reject(e)
        }
      })
    })

    loading.value = false

  } catch (err) {
    console.error('[Heatmap] 加载失败:', err)
    loading.value = false
  }
}

function initScatterLayer() {
  scatterLayer = new (window as any).Loca.ScatterLayer({
    zIndex: 10,
    opacity: 0.85,
    visible: true,
    zooms: [2, 22],
  })

  const emptyGeoData = { type: 'FeatureCollection', features: [] }
  scatterLayer.setSource(new (window as any).Loca.GeoJSONSource({ data: emptyGeoData }))

  scatterLayer.setStyle({
    unit: 'px',
    size: [12, 12],
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    color: (_: number, feature: any) => {
      const category = feature.properties.category
      return categoryColorMap[category] || '#00c8ff'
    },
  })
  
  locaInstance.add(scatterLayer)
  console.log('[Scatter] 散点图层已添加到容器')
}

function onStyleChange() {
  if (!mapInstance) return

  const selected = styleOptions.find(o => o.key === currentStyleKey.value)
  if (!selected) return

  localStorage.setItem('mapStyleKey', currentStyleKey.value)

  if (selected.key === 'satellite') {
    mapInstance.setMapStyle('amap://styles/normal')
    mapInstance.add(satelliteLayer)
  } else {
    mapInstance.remove(satelliteLayer)
    mapInstance.setMapStyle(selected.style)
  }
}

async function renderPattern(patternId: number) {
  try {
    console.log('[Pattern] 开始加载模式数据, patternId:', patternId)
    loading.value = true
    loadingText.value = '加载模式数据...'

    const res = await fetchPatternInstances(patternId)
    currentInstances = res.data

    if (!currentInstances.length) {
      console.warn('[Pattern] 该模式无实例数据')
      loading.value = false
      return
    }

    console.log('[Pattern] 模式数据加载完成，实例数:', currentInstances.length)

    hasPatternData.value = true

    renderScatterLayer(currentInstances)
    updateLegend(currentInstances)

    loading.value = false
    console.log('[Pattern] 模式渲染完成')
    
  } catch (err) {
    console.error('[Pattern] 渲染失败:', err)
    loading.value = false
  }
}

function renderScatterLayer(instances: PatternInstance[]) {
  if (!scatterLayer) return

  console.log('[Scatter] 开始渲染散点图')

  const allPois: PoiDetail[] = []
  instances.forEach(inst => {
    allPois.push(...inst.pois)
  })

  console.log('[Scatter] 总POI数量:', allPois.length)

  const geoData = {
    type: 'FeatureCollection',
    features: allPois
      .filter(poi => {
        const visible = categoryVisibility.value[poi.category_name]
        return visible === undefined || visible
      })
      .map(poi => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [poi.lng, poi.lat] },
        properties: {
          category: poi.category_name,
          name: poi.poi_name,
          poi_id: poi.poi_id,
        },
      })),
  }

  console.log('[Scatter] 渲染POI数量:', geoData.features.length)
  scatterLayer.setSource(new (window as any).Loca.GeoJSONSource({ data: geoData }))
}

function updateLegend(instances: PatternInstance[]) {
  const categoryCount: Record<string, number> = {}

  instances.forEach(inst => {
    inst.pois.forEach(poi => {
      categoryCount[poi.category_name] = (categoryCount[poi.category_name] || 0) + 1
    })
  })

  activeCategoriesLegend.value = Object.entries(categoryCount).map(([name, count]) => ({
    name,
    color: categoryColorMap[name] || '#00c8ff',
    count,
    visible: categoryVisibility.value[name] !== false,
  }))

  Object.keys(categoryCount).forEach(name => {
    if (categoryVisibility.value[name] === undefined) {
      categoryVisibility.value[name] = true
    }
  })
  
  console.log('[Legend] 图例更新完成，类别数:', activeCategoriesLegend.value.length)
}

function toggleHeatmap() {
  if (!heatmapLayer) return
  layerVisibility.value.heatmap ? heatmapLayer.show() : heatmapLayer.hide()
}

function toggleScatter() {
  if (scatterLayer) {
    scatterLayer.visible = layerVisibility.value.scatter
  }
}

function toggleCategory(categoryName: string) {
  categoryVisibility.value[categoryName] = !categoryVisibility.value[categoryName]
  
  const item = activeCategoriesLegend.value.find(c => c.name === categoryName)
  if (item) {
    item.visible = categoryVisibility.value[categoryName]
  }

  if (currentInstances.length) {
    renderScatterLayer(currentInstances)
  }
}

defineExpose({ renderPattern })
</script>

<template>
  <div class="map-container">
    <div ref="mapContainer" class="map-inner-container" style="width: 100%; height: 100%;" />

    <div class="map-style-selector">
      <span class="selector-label">底图样式</span>
      <div class="selector-wrapper">
        <select v-model="currentStyleKey" @change="onStyleChange" class="style-select">
          <option v-for="opt in styleOptions" :key="opt.key" :value="opt.key">
            {{ opt.label }}
          </option>
        </select>
        <span class="selector-arrow">▾</span>
      </div>
    </div>

    <div v-if="loading" class="loading-indicator">
      <div class="spinner"></div>
      <div class="loading-text">{{ loadingText }}</div>
    </div>

    <div class="layer-control-panel" v-if="hasPatternData">
      <div class="panel-title">图层控制</div>
      
      <div class="control-item">
        <label class="control-label">
          <input type="checkbox" v-model="layerVisibility.heatmap" @change="toggleHeatmap">
          <span>热力图底图</span>
        </label>
      </div>
      
      <div class="control-item">
        <label class="control-label">
          <input type="checkbox" v-model="layerVisibility.scatter" @change="toggleScatter">
          <span>类别散点图</span>
        </label>
      </div>

      <div class="category-legend" v-if="layerVisibility.scatter">
        <div class="legend-title">类别图例</div>
        <div 
          v-for="cat in activeCategoriesLegend" 
          :key="cat.name"
          class="legend-item"
          @click="toggleCategory(cat.name)"
          :class="{ disabled: !cat.visible }"
        >
          <span class="legend-color" :style="{ backgroundColor: cat.color }"></span>
          <span class="legend-name">{{ cat.name }}</span>
          <span class="legend-count">({{ cat.count }})</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-style-selector {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 18, 40, 0.82);
  border: 1px solid rgba(0, 200, 255, 0.3);
  border-radius: 4px;
  padding: 5px 10px;
  backdrop-filter: blur(6px);
  box-shadow: 0 0 10px rgba(0, 200, 255, 0.15);
}

.selector-label {
  font-size: 12px;
  color: rgba(0, 200, 255, 0.75);
  white-space: nowrap;
  letter-spacing: 0.05em;
}

.selector-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.style-select {
  appearance: none;
  background: transparent;
  border: none;
  color: #e0f4ff;
  font-size: 12px;
  padding: 2px 20px 2px 4px;
  cursor: pointer;
  outline: none;
  letter-spacing: 0.04em;
}

.style-select option {
  background: #011428;
  color: #e0f4ff;
}

.selector-arrow {
  position: absolute;
  right: 0;
  font-size: 10px;
  color: rgba(0, 200, 255, 0.7);
  pointer-events: none;
}

.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  background: rgba(0, 18, 40, 0.9);
  padding: 24px 32px;
  border-radius: 8px;
  border: 1px solid rgba(0, 200, 255, 0.3);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 200, 255, 0.1);
  border-top-color: #00c8ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 14px;
  color: #e0f4ff;
  letter-spacing: 1px;
}

.layer-control-panel {
  position: absolute;
  top: 60px;
  right: 12px;
  z-index: 100;
  background: rgba(0, 18, 40, 0.9);
  border: 1px solid rgba(0, 200, 255, 0.3);
  border-radius: 6px;
  padding: 12px;
  backdrop-filter: blur(8px);
  box-shadow: 0 0 15px rgba(0, 200, 255, 0.2);
  min-width: 180px;
  max-width: 220px;
}

.panel-title {
  font-size: 13px;
  color: #00c8ff;
  font-weight: 600;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 200, 255, 0.2);
}

.control-item {
  margin-bottom: 8px;
}

.control-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #e0f4ff;
  cursor: pointer;
  user-select: none;
}

.control-label input[type="checkbox"] {
  cursor: pointer;
  accent-color: #00c8ff;
}

.category-legend {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 200, 255, 0.2);
}

.legend-title {
  font-size: 12px;
  color: #00c8ff;
  font-weight: 600;
  margin-bottom: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #e0f4ff;
  margin-bottom: 6px;
  cursor: pointer;
  padding: 3px 4px;
  border-radius: 3px;
  transition: all 0.2s;
}

.legend-item:hover {
  background: rgba(0, 200, 255, 0.1);
}

.legend-item.disabled {
  opacity: 0.4;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
}

.legend-name {
  flex: 1;
}

.legend-count {
  font-size: 10px;
  color: rgba(0, 200, 255, 0.6);
}
</style>