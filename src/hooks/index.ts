import { useDispatch, useSelector } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'
import type { RootState, AppDispatch } from '@/store/index'
import { useOutletContext } from 'react-router-dom'
import React from 'react'
import { SocketContext } from '@/providers/Socket'
import { PeerContext } from '@/providers/Peer'
// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
// socker context
export const useSocketContext = () => React.useContext(SocketContext)
// peer context
export const usePeerContext = () => React.useContext(PeerContext)
