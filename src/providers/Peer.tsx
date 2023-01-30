import React, {
  ReactChildren,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

const peerElements: PeerElement[] = []

// add new peer
const pushNewPeer = (socketId: string) => {
  const peer = new RTCPeerConnection({
    iceServers: [
      // {
      //   urls: ['stun:stun.l.google.com:19302'],
      // },
      {
        urls: 'turn:relay.metered.ca:80',
        username: 'e6fea73d882f966b44419395',
        credential: '/xt2mBIUSF+xByHl',
      },
    ],
  })
  let remoteStream = undefined
  const handleTrackEvent = (e: RTCTrackEvent, peerElement: PeerElement) => {
    console.log('received stream')
    peerElement.remoteStream = e.streams[0]
  }

  const newPeerElement = {
    peer,
    socketId,
    remoteStream,
  }
  newPeerElement.peer.addEventListener('track', (e) => handleTrackEvent(e, newPeerElement))
  peerElements.push(newPeerElement)
  return newPeerElement
}

// init offet
const createOffer = async (peer: RTCPeerConnection) => {
  const offer = await peer.createOffer()
  await peer.setLocalDescription(offer)
  return offer
}
//init answer
const createAnswer = async (peer: RTCPeerConnection, offer: RTCSessionDescriptionInit) => {
  await peer.setRemoteDescription(offer)
  const answer = await peer.createAnswer()
  await peer.setLocalDescription(answer)
  return answer
}
// set remote answer
const setRemoteAnswer = async (peer: RTCPeerConnection, ans: RTCSessionDescriptionInit) => {
  await peer.setRemoteDescription(ans)
}
// send stream
const sendStream = (peer: RTCPeerConnection, stream: MediaStream) => {
  const tracks = stream.getTracks()
  const sender = peer.getSenders()?.[0]
  if (sender) {
    peer.removeTrack(sender)
  }
  for (const track of tracks) {
    peer.addTrack(track, stream)
  }
}

type Props = {
  children: ReactElement
}

type PeerElement = {
  peer: RTCPeerConnection
  socketId: string
  remoteStream: MediaStream | undefined
}

type PeerManager = {
  pushNewPeer: (socketId: string) => PeerElement
  createOffer: (peer: RTCPeerConnection) => Promise<RTCSessionDescriptionInit>
  createAnswer: (
    peer: RTCPeerConnection,
    offer: RTCSessionDescriptionInit
  ) => Promise<RTCSessionDescriptionInit>
  setRemoteAnswer: (peer: RTCPeerConnection, ans: RTCSessionDescriptionInit) => Promise<void>
  sendStream: (peer: RTCPeerConnection, stream: MediaStream) => void
}

//init context
export const PeerContext = React.createContext<{
  peerManager: PeerManager
  peerElements: PeerElement[]
}>({
  peerManager: {
    pushNewPeer,
    createOffer,
    createAnswer,
    setRemoteAnswer,
    sendStream,
  },
  peerElements,
})

export const PeerProvider = (props: Props) => {
  const [peerManager] = useState<PeerManager>({
    pushNewPeer,
    createOffer,
    createAnswer,
    setRemoteAnswer,
    sendStream,
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
