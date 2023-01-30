import React, { ReactElement, useState } from 'react'

import Peer from 'peerjs'

const peerElements: PeerElement[] = []

// add new peer
const pushNewPeer = (selfSocketId: string, ortherSocketId: string) => {
  const peer = new Peer(selfSocketId + ortherSocketId)
  peer.on('open', (id) => {
    console.log(`peer ${id} opened`)
  })
  const newPeerElement: PeerElement = {
    peer,
    socketId: ortherSocketId,
  }
  newPeerElement.peer.on('call', (call) => {
    console.log('on call')
    call.answer(undefined) // Answer the call with an A/V stream.
    call.on('stream', (remoteStream) => {
      // Show stream in some <video> element.
      newPeerElement.remoteStream = remoteStream
    })
  })
  peerElements.push(newPeerElement)
  return newPeerElement
}

type Props = {
  children: ReactElement
}

type PeerElement = {
  peer: Peer
  socketId: string
  remoteStream?: MediaStream
}

type PeerManager = {
  pushNewPeer: (selfSocketId: string, ortherSocketId: string) => PeerElement
}

//init context
export const PeerContext = React.createContext<{
  peerManager: PeerManager
  peerElements: PeerElement[]
}>({
  peerManager: {
    pushNewPeer,
  },
  peerElements,
})

export const PeerProvider = (props: Props) => {
  const [peerManager] = useState<PeerManager>({
    pushNewPeer,
  })

  return (
    <PeerContext.Provider
      value={{
        peerManager,
        peerElements,
      }}
    >
      {props.children}
    </PeerContext.Provider>
  )
}
