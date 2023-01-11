/**
 * @file App route config

 */

import React from 'react'
import { generatePath } from 'react-router-dom'

export enum RouteKey {
  JoinRoom,
  Room,
}

export interface RouteConfig {
  id: RouteKey
  name: string
  path: string
  subPath?: string
  icon?: React.ReactElement
  pather?(...args: Array<any>): string
}
export const routeMap: ReadonlyMap<RouteKey, RouteConfig> = new Map(
  [
    {
      id: RouteKey.JoinRoom,
      name: 'join-room',
      path: '/join-room',
    },
    {
      id: RouteKey.Room,
      name: 'room',
      path: '/room',
    },
  ].map((route) => [route.id, route])
)

export const rc = (routeKey: RouteKey): RouteConfig => {
  return routeMap.get(routeKey)!
}
export const rcByPath = (routePath: string) => {
  return Array.from(routeMap.values()).find((route) => route.path === routePath)
}
export const isRoute = (routePath: string, routeKey: RouteKey) => {
  return routeMap.get(routeKey)?.path === routePath
}
export const getRouteNameBySubpath = (subpath: string) => {
  const routeArray = Array.from(routeMap.values())
  return routeArray.find((route) =>
    route.subPath ? route.subPath === subpath : route.path === subpath
  )
}
