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
      {
        urls: ['stun:stun.l.google.com:19302'],
      },
    ],
  })
  let remoteStream = undefined
  const handleTrackEvent = (e: RTCTrackEvent) => {
    console.log('track')
    const streams = e.streams
    remoteStream = streams[0]
  }
  peer.addEventListener('track', handleTrackEvent)
  console.log(peerElements)
  peerElements.push({
    peer,
    socketId,
    remoteStream,
  })
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
  console.log(tracks)
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
  pushNewPeer: (socketId: string) => void
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
  peer?: RTCPeerConnection
  createOffer?: () => Promise<RTCSessionDescriptionInit>
  createAnswer?: (offer: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit>
  setRemoteAnswer?: (ans: RTCSessionDescriptionInit) => Promise<void>
  sendStream?: (stream: MediaStream) => void
  remoteStream?: MediaStream
  peerManager: PeerManager
  peerElements: PeerElement[]
}>({
  peer: undefined,
  createOffer: undefined,
  createAnswer: undefined,
  setRemoteAnswer: undefined,
  sendStream: undefined,
  remoteStream: undefined,
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
  const [remoteStream, setRemoteStream] = useState<MediaStream | undefined>()

  const peer = useMemo(
    () =>
      new RTCPeerConnection({
        iceServers: [
          {
            urls: ['stun:stun.l.google.com:19302'],
          },
        ],
      }),
    []
  )

  // init offet
  const createOffer2 = async () => {
    const offer = await peer.createOffer()
    await peer.setLocalDescription(offer)
    return offer
  }
  //init answer
  const createAnswer2 = async (offer: RTCSessionDescriptionInit) => {
    await peer.setRemoteDescription(offer)
    const answer = await peer.createAnswer()
    await peer.setLocalDescription(answer)
    return answer
  }
  // set remote answer
  const setRemoteAnswer2 = async (ans: RTCSessionDescriptionInit) => {
    await peer.setRemoteDescription(ans)
  }
  // send stream
  const sendStream2 = useCallback(
    (stream: MediaStream) => {
      const tracks = stream.getTracks()
      console.log(tracks)
      peer.getSenders().forEach((sender) => {
        peer.removeTrack(sender)
      })
      for (const track of tracks) {
        peer.addTrack(track, stream)
      }
    },
    [peer]
  )

  const handleTrackEvent = useCallback((e: RTCTrackEvent) => {
    console.log('track')
    const streams = e.streams
    setRemoteStream(streams[0])
  }, [])

  useEffect(() => {
    peer.addEventListener('track', handleTrackEvent)
    return () => {
      peer.removeEventListener('track', handleTrackEvent)
    }
  }, [peer, handleTrackEvent])
  return (
    <PeerContext.Provider
      value={{
        peer,
        createOffer: createOffer2,
        createAnswer: createAnswer2,
        setRemoteAnswer: setRemoteAnswer2,
        sendStream: sendStream2,
        remoteStream,
        peerManager,
        peerElements,
      }}
    >
      {props.children}
    </PeerContext.Provider>
  )
}
