import React, { ReactChildren, ReactElement, useMemo } from 'react'
import { io, Socket } from 'socket.io-client'
const socket = io('http://localhost:5000')
export const SocketContext = React.createContext<{ socket: Socket<any, any> }>({
  socket: socket,
})

type Props = {
  children: ReactElement
}

export const SocketProvider = (props: Props) => {
  return <SocketContext.Provider value={{ socket }}>{props.children}</SocketContext.Provider>
}

export const SOCKET_EVENT = {
  ON: {
    JOINED_ROOM: 'JOINED_ROOM',
    USER_CONNECTED: 'USER_CONNECTED',
    RECEIVE_MESSAGE: 'RECEIVE_MESSAGE',
    USER_DISCONNECTED: 'USER_DISCONNECTED',
  },
  EMIT: {
    JOIN_ROOM: 'JOIN_ROOM',
    SEND_MESSAGE: 'SEND_MESSAGE',
  },
}
