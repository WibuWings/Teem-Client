import { DEFAULT_VERSION, PREFIX_VERSION } from '@/config'

export type Endpoint = {
  endpoint: string
  version?: string
}
type Query = {
  pageSize: number
  currentPage: number
  keyword: string
  sortInfo?: {
    field: string | undefined
    order: string | number | undefined
  }
  [key: string]: any
}
type MappedQuery = {
  page: number
  page_size: number
  keyword: string
  field?: string
  order?: string | number
  [key: string]: any
}
export const mappingQueryToApiQuery = ({
  pageSize,
  currentPage,
  keyword,
  sortInfo,
  ...restQuery
}: Query): MappedQuery => {
  return {
    page: currentPage,
    page_size: pageSize,
    keyword: keyword,
    field: sortInfo?.order ? sortInfo?.field : undefined,
    order: sortInfo?.order,
    ...restQuery,
  }
}

export const generateEndpointVersionning = (endpoint: Endpoint): string => {
  return `/${PREFIX_VERSION}${endpoint.version ?? DEFAULT_VERSION}${endpoint.endpoint}`
}
