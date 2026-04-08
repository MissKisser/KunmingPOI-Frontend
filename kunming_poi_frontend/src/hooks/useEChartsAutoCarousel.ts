import { ref, onBeforeUnmount } from 'vue'
import type { ECharts } from 'echarts'

interface AutoCarouselOptions {
  interval?: number
}

export function useEChartsAutoCarousel(options: AutoCarouselOptions = {}) {
  const { interval = 3000 } = options
  const timer = ref<ReturnType<typeof setInterval> | null>(null)
  const currentIndex = ref(-1)
  let chartRef: ECharts | null = null
  let dataLenRef = 0

  const startRotation = (chart: ECharts | null, dataLen: number) => {
    if (!chart || dataLen <= 0) return

    chartRef = chart
    dataLenRef = dataLen

    stopRotation()

    timer.value = setInterval(() => {
      if (currentIndex.value >= 0) {
        chart.dispatchAction({
          type: 'downplay',
          seriesIndex: 0,
          dataIndex: currentIndex.value
        })
      }

      currentIndex.value = (currentIndex.value + 1) % dataLen

      chart.dispatchAction({
        type: 'highlight',
        seriesIndex: 0,
        dataIndex: currentIndex.value
      })
      chart.dispatchAction({
        type: 'showTip',
        seriesIndex: 0,
        dataIndex: currentIndex.value
      })
    }, interval)

    chart.off('mouseover', stopRotation)
    chart.on('mouseover', stopRotation)
    chart.off('globalout', _onGlobalOut)
    chart.on('globalout', _onGlobalOut)
  }

  const stopRotation = () => {
    if (timer.value) {
      clearInterval(timer.value)
      timer.value = null
    }
  }

  const _onGlobalOut = () => {
    startRotation(chartRef, dataLenRef)
  }

  onBeforeUnmount(stopRotation)

  return {
    startRotation,
    stopRotation
  }
}