import React, {
  ReactChildren,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
//init context
export const PeerContext = React.createContext<{
  peer?: RTCPeerConnection
  createOffer?: () => Promise<RTCSessionDescriptionInit>
  createAnswer?: (offer: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit>
  setRemoteAnswer?: (ans: RTCSessionDescriptionInit) => Promise<void>
  sendStream?: (stream: MediaStream) => void
  remoteStream?: MediaStream
}>({
  peer: undefined,
  createOffer: undefined,
  createAnswer: undefined,
  setRemoteAnswer: undefined,
  sendStream: undefined,
  remoteStream: undefined,
})

type Props = {
  children: ReactElement
}

export const PeerProvider = (props: Props) => {
  const [remoteStream, setRemoteStream] = useState<MediaStream | undefined>()

  const peer = useMemo(
    () =>
      new RTCPeerConnection({
        iceServers: [
          {
            urls: ['stun:stun.l.google.com:19302', 'stun:global.stun.twilio.com:3478'],
          },
        ],
      }),
    []
  )

  // init offet
  const createOffer = async () => {
    const offer = await peer.createOffer()
    await peer.setLocalDescription(offer)
    return offer
  }
  //init answer
  const createAnswer = async (offer: RTCSessionDescriptionInit) => {
    await peer.setRemoteDescription(offer)
    const answer = await peer.createAnswer()
    await peer.setLocalDescription(answer)
    return answer
  }
  // set remote answer
  const setRemoteAnswer = async (ans: RTCSessionDescriptionInit) => {
    await peer.setRemoteDescription(ans)
  }
  // send stream
  const sendStream = useCallback(
    (stream: MediaStream) => {
      const tracks = stream.getTracks()
      console.log(tracks)
      tracks.forEach((track) => peer.addTrack(track, stream))
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
        createOffer,
        createAnswer,
        setRemoteAnswer,
        sendStream,
        remoteStream,
      }}
    >
      {props.children}
    </PeerContext.Provider>
  )
}
