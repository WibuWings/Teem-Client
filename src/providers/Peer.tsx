import React, { ReactChildren, ReactElement, useMemo } from 'react'
// init peer
const peer = new RTCPeerConnection({
  iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302', 'stun:global.stun.twilio.com:3478'],
    },
  ],
})
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
//init context
export const PeerContext = React.createContext<{
  peer: RTCPeerConnection
  createOffer: () => Promise<RTCSessionDescriptionInit>
  createAnswer: (offer: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit>
}>({
  peer,
  createOffer,
  createAnswer,
})

type Props = {
  children: ReactElement
}

export const PeerProvider = (props: Props) => {
  return (
    <PeerContext.Provider value={{ peer, createOffer, createAnswer }}>
      {props.children}
    </PeerContext.Provider>
  )
}
