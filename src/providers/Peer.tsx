import React, { ReactChildren, ReactElement, useEffect, useMemo, useState } from 'react'
// init peer
var remoteStream: MediaStream | undefined = undefined
const peer = new RTCPeerConnection({
  iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302', 'stun:global.stun.twilio.com:3478'],
    },
  ],
})
peer.addEventListener('track', (e) => {
  console.log(e.streams)
  remoteStream = e.streams[0]
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
// set remote answer
const setRemoteAnswer = async (ans: RTCSessionDescriptionInit) => {
  await peer.setRemoteDescription(ans)
}
// send stream
const sendStream = (stream: MediaStream) => {
  const tracks = stream.getTracks()
  tracks.forEach((track) => peer.addTrack(track, stream))
}
//init context
export const PeerContext = React.createContext<{
  peer: RTCPeerConnection
  createOffer: () => Promise<RTCSessionDescriptionInit>
  createAnswer: (offer: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit>
  setRemoteAnswer: (ans: RTCSessionDescriptionInit) => Promise<void>
  sendStream: (stream: MediaStream) => void
  remoteStream?: MediaStream
}>({
  peer,
  createOffer,
  createAnswer,
  setRemoteAnswer,
  sendStream,
})

type Props = {
  children: ReactElement
}

export const PeerProvider = (props: Props) => {
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
