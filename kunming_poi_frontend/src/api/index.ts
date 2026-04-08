import axios from 'axios'

const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

export interface FpiRankItem {
  pattern_id: number
  pattern_name: string
  fpi_score: number
}

export interface GlobalSummary {
  poi_total: number
  pattern_total: number
  instance_total: number
}

export interface CategoryStat {
  category_name: string
  category_code: string
  description: string
  poi_count: number
}

export interface PatternCoord {
  lng: number
  lat: number
}

export interface PoiDetail {
  poi_id: number
  poi_name: string
  category_name: string
  lng: number
  lat: number
}

export interface PatternInstance {
  instance_id: number
  center_lng: number
  center_lat: number
  pois: PoiDetail[]
}

export interface HeatmapPoint {
  lng: number
  lat: number
}

export interface DistrictSummary {
  district: string
  poi_count: number
  pattern_count: number
}

export interface WordCountItem {
  name: string
  value: number
}

export interface PoiData {
  id: number
  name: string
  category: string
  lng: number
  lat: number
}

export const fetchFpiRanking = (limit = 10) =>
  http.get<FpiRankItem[]>('/fpi-ranking', { params: { limit } })

export const fetchPatternCoords = (patternId: number) =>
  http.get<PatternCoord[]>(`/pattern-coordinates/${patternId}`)

export const fetchPatternInstances = (patternId: number) =>
  http.get<PatternInstance[]>(`/pattern-instances/${patternId}`)

export const fetchHeatmapData = (limit = 50000) =>
  http.get<HeatmapPoint[]>('/poi-heatmap-data', { params: { limit } })

export const fetchAllPoi = () => http.get<PoiData[]>('/all-pois')

export const fetchGlobalSummary = () => http.get<GlobalSummary>('/global-summary')

export const fetchCategoryStats = () => http.get<CategoryStat[]>('/category-stats')

export const fetchDistrictSummary = () => http.get<DistrictSummary[]>('/district-summary')

export const fetchPatternWordcloud = () => http.get<WordCountItem[]>('/pattern-wordcloud')

export default http