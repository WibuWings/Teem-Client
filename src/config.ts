/**
 * @file Global config

 */

import type { SizeType } from 'antd/lib/config-provider/SizeContext'

export const PREFIX_VERSION = 'v'
export const DEFAULT_VERSION = '1.0'

export const APP_AUTH_HEADER_KEY = 'Authorization'
export const APP_SIDER_WIDTH = 240
export const APP_SIDER_COLLAPSED_WIDTH = 80
export const APP_LAYOUT_GUTTER_SIZE = 24
export const APP_LAYOUT_SPACE_SIZE: SizeType = 'large'
export const APP_CONTENT_SPACE_SIZE: SizeType = 'middle'
export const APP_COLOR_PRIMARY = '#177ddc'

export const VITE_ENV = import.meta.env
export const ENV = import.meta.env.MODE
export const isDev = ENV === 'development'
export const BASE_PATH = import.meta.env.BASE_URL as string
export const API_URL = import.meta.env.VITE_API_URL as string
export const ENABLED_AD = Boolean(import.meta.env.VITE_ENABLE_AD)
export const ENABLEd_HASH_ROUTER = Boolean(import.meta.env.VITE_ENABLE_HASH_ROUTER)

export const FILE = {
  MAX_MB_SIZE: 10,
  ACCEPT_EXTENSIONS: ['JPG', 'PNG', 'JPEG'],
}
