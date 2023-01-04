import { http } from '@/services/axiosHelper'
import { BaseQueryFn, createApi } from '@reduxjs/toolkit/query/react'
import { AxiosRequestConfig } from 'axios'
import { TAG_TYPES } from './tags'

export type ResponseError = {
  status: string
  data: any
  statusText: string
}

const axiosBaseQuery =
  (
    { baseUrl }: { baseUrl: string } = { baseUrl: '' }
  ): BaseQueryFn<
    {
      url: string
      method: AxiosRequestConfig['method']
      data?: AxiosRequestConfig['data']
      params?: AxiosRequestConfig['params']
    },
    unknown,
    ResponseError
  > =>
  async ({ url, method, data, params }) => {
    try {
      const result = await http.request({ url: baseUrl + url, method, data, params })
      return { data: result.data }
    } catch (axiosError: any) {
      return {
        error: {
          status: axiosError?.status,
          data: axiosError?.response?.data || axiosError?.data,
          statusText: `${axiosError?.status} ${axiosError?.statusText}`,
        },
      }
    }
  }
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery({
    baseUrl: '',
  }),
  keepUnusedDataFor: 5,
  tagTypes: Object.values(TAG_TYPES).filter((k) => typeof k === 'string'),
  endpoints: (builder) => ({}),
})

export const {} = apiSlice
