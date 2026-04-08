import AMapLoader from '@amap/amap-jsapi-loader'
import { AMAP_KEY, AMAP_SECRET, AMAP_VERSION } from '../config/amap'

let amapLoadPromise: Promise<any> | null = null

export function useAMap(): Promise<any> {
  if (amapLoadPromise) return amapLoadPromise

  ;(window as any)._AMapSecurityConfig = {
    securityJsCode: AMAP_SECRET,
  }

  amapLoadPromise = AMapLoader.load({
    key: AMAP_KEY,
    version: AMAP_VERSION,
    plugins: ['AMap.Scale', 'AMap.ToolBar', 'AMap.HeatMap'],
    Loca: { version: '2.0' },
  })

  return amapLoadPromise
}