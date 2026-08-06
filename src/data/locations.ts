import type { Location } from '../types/game'

export const LOCATION_NAMES: Record<Location, string> = {
  study: '書斎',
  library: '図書室',
  dining: '食堂',
  basement: '地下室',
  gallery: '絵画室',
  greenhouse: '温室',
  guest_room: '客室',
  secret_passage: '秘密通路',
  safe_room: '金庫室',
  hidden_room: '隠し部屋',
  master_bedroom: '主寝室',
}

export const CRIME_SCENE_LOCATIONS: Location[] = [
  'study',
  'library',
  'dining',
  'basement',
  'gallery',
  'greenhouse',
  'guest_room',
]

// 主寝室は当主の私室のため、一般プレイヤーのアリバイ地点プールには含めない
export const ALL_LOCATIONS: Location[] = (Object.keys(LOCATION_NAMES) as Location[])
  .filter(l => l !== 'master_bedroom')
