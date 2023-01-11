// http.ts

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosRequestHeaders,
} from 'axios'
import { API_URL, APP_AUTH_HEADER_KEY } from '@/config'
import token, { removeToken } from './token'
import { rc, RouteKey } from '@/routes'
import { waitApi } from '@/utils/async'
import { notification } from 'antd'

export enum HTTP_METHOD {
  POST = 'POST',
  GET = 'GET',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

export type ResponseMessage = string
export enum ResponseStatus {
  Error = 'error',
  Success = 'success',
}

export interface HttpResponseBase {
  status?: ResponseStatus
  message?: ResponseMessage
}

export type ExceptionInfo =
  | ResponseMessage
  | {
      message: ResponseMessage
      error?: any
    }

// paginate data
export interface HttpPaginateResult<T> {
  data: T[] | []
  pagination: {
    total: number
    current_page: number
    total_page: number
    page_size: number
  }
}

// HTTP error
export type HttpResponseError = HttpResponseBase & {
  error: any
  debug?: string
}

export type HttpResponseSuccessList<T> = HttpResponseBase & {
  params?: any
  result: HttpPaginateResult<T>
}

export type HttpResponseSuccessOne<T> = HttpResponseBase & {
  params?: any
  result: T
}

// HTTP response
export type HttpResponse<T> =
  | HttpResponseError
  | HttpResponseSuccessList<T>
  | HttpResponseSuccessOne<T>

enum StatusCode {
  Unauthorized = 401,
  Forbidden = 403,
  TooManyRequests = 429,
  InternalServerError = 500,
  NotImplemented = 502,
  NotFound = 404,
}

const headers: AxiosRequestHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json; charset=utf-8',
}

// We can use the following function to inject the JWT token through an interceptor
// We get the `accessToken` from the localStorage that we set when we authenticate
const injectToken = (config: AxiosRequestConfig): AxiosRequestConfig => {
  try {
    // if (token.isTokenValid()) {
    //   if (config.headers !== undefined) {
    //     config.headers[APP_AUTH_HEADER_KEY] = `Bearer ${token.getToken()}`
    //   }
    // }
    return config
  } catch (error: any) {
    throw new Error(error)
  }
}

class Http {
  private instance: AxiosInstance | null = null

  private get http(): AxiosInstance {
    return this.instance != null ? this.instance : this.initHttp()
  }

  initHttp() {
    const http = axios.create({
      baseURL: API_URL,
      headers,
      withCredentials: false,
      timeout: 1000,
    })

    http.interceptors.request.use(injectToken, (error) => Promise.reject(error))

    http.interceptors.response.use(
      (response) => response,
      (error) => {
        const { response } = error
        return this.handleError(response)
      }
    )

    this.instance = http
    return http
  }

  request<T = any, R = AxiosResponse<T>>(config: AxiosRequestConfig): Promise<R> {
    return waitApi(1000).then(() => this.http.request(config))
  }

  get<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R> {
    return this.http.get<T, R>(url, config)
  }

  post<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: T,
    config?: AxiosRequestConfig
  ): Promise<R> {
    return this.http.post<T, R>(url, data, config)
  }

  postWithForm<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: T,
    config?: AxiosRequestConfig
  ): Promise<R> {
    const defaultConfig = config || {
      headers: {
        'content-type': 'multipart/form-data',
      },
    }

    return this.http.post<T, R>(url, data, defaultConfig)
  }

  put<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: T,
    config?: AxiosRequestConfig
  ): Promise<R> {
    return this.http.put<T, R>(url, data, config)
  }

  putWithForm<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: T,
    config?: AxiosRequestConfig
  ): Promise<R> {
    const defaultConfig = config || {
      headers: {
        'content-type': 'multipart/form-data',
      },
    }

    return this.http.put<T, R>(url, data, defaultConfig)
  }

  patch<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: T,
    config?: AxiosRequestConfig
  ): Promise<R> {
    return this.http.patch<T, R>(url, data, config)
  }

  delete<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R> {
    return this.http.delete<T, R>(url, config)
  }

  cancel() {
    try {
      const controller = new AbortController()
      controller.abort()
    } catch (err) {
      console.log(err)
    }
  }

  // Handle global app errors
  // We can handle generic app errors depending on the status code
  private async handleError(error: any) {
    const { status } = error
    console.log(error)
    this.cancel()
    switch (status) {
      case StatusCode.InternalServerError: {
        // Handle InternalServerError
        break
      }
      case StatusCode.Forbidden: {
        // Handle Forbidden
        break
      }
      case StatusCode.Unauthorized: {
        // Handle Unauthorized
        removeToken()
        if (
          typeof window !== 'undefined' &&
          window.location.pathname !== rc(RouteKey.Login).path
        ) {
          window.location.replace(rc(RouteKey.Login).path)
        }
        break
      }
      case StatusCode.TooManyRequests: {
        // Handle TooManyRequests
        break
      }
      case StatusCode.NotFound: {
        break
      }
      //
    }

    return Promise.reject(error)
  }
}

export const http = new Http()
export const buildQueryFromObject: any = (search: string, prefix = '') =>
  Object.entries(search)
    .map(([key, value]) =>
      typeof value === 'object'
        ? buildQueryFromObject(value, key)
        : `${prefix ? `${prefix}[${key}]` : `${key}`}=${value}`
    )
    .join('&')
export const removeNullish = (obj: { [s: string]: unknown } | ArrayLike<unknown>) =>
  Object.entries(obj).reduce(
    (a: { [s: string]: unknown }, [k, v]) => (v ? ((a[k] = v), a) : a),
    {}
  )
