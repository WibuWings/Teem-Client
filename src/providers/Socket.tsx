import { API_URL } from '@/config'
import React, { ReactElement, useMemo } from 'react'
import { io, Socket } from 'socket.io-client'
export const SocketContext = React.createContext<{ socket: Socket<any, any> | undefined }>({
  socket: undefined,
})

type Props = {
  children: ReactElement
}

export const SocketProvider = (props: Props) => {
  const socket = useMemo(() => io(API_URL), [])
  return <SocketContext.Provider value={{ socket }}>{props.children}</SocketContext.Provider>
}

export const SOCKET_EVENT = {
  ON: {
    JOINED_ROOM: 'JOINED_ROOM',
    USER_CONNECTED: 'USER_CONNECTED',
    RECEIVE_MESSAGE: 'RECEIVE_MESSAGE',
    USER_DISCONNECTED: 'USER_DISCONNECTED',
    INCOMMING_CALL: 'INCOMMING_CALL',
    CALL_ACCEPTED: 'CALL_ACCEPTED',
  },
  EMIT: {
    JOIN_ROOM: 'JOIN_ROOM',
    SEND_MESSAGE: 'SEND_MESSAGE',
    CALL_USER: 'CALL_USER',
    CALL_ACCEPTED: 'CALL_ACCEPTED',
  },
}
