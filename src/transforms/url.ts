/**
 * @file 链接转换

 */

import { BASE_PATH } from '@/config'

export const getResourceUrl = (uri: string) => {
  const path = BASE_PATH.endsWith('/') ? BASE_PATH : `${BASE_PATH}/`
  return uri.startsWith('/') ? path + uri.substr(1, uri.length) : path + uri
}
