import { Button, Card, Drawer, Input, Layout, message, notification, Space, Spin } from 'antd'
import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as Icon from '@ant-design/icons'

import { PrepairRoom } from './components/PrepairRoom'

import styles from './style.module.less'
import { rc, RouteKey } from '@/routes'
import { UserGrid } from './components/UserGrid/UserGrid'
import { IncallMessage } from './components/IncallMessage'
import { UserFrame } from './components/UserFrame'
import { Overlay } from './components/Overlay'
import { useAppDispatch, useAppSelector, usePeerContext, useSocketContext } from '@/hooks'
import { pushNewUserToRoom, removeUserFromRoom } from './slice'
import { SOCKET_EVENT } from '@/providers/Socket'
import { useJoinRoomMutation } from './apiSlice'
import { JoinRoomDTO, User, Room } from './model'

type RoomParams = {
  roomCode: string
}

export function RoomPage() {
  // react hook
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  // socket & peer
  const { socket } = useSocketContext()
  const { peerElements, peerManager } = usePeerContext()
  const [mediaStream, setMediaStream] = useState<MediaStream | undefined>()

  // room API
  const [joinRoom, { isLoading: isLoadingJoinRoom, error: errorJoinRoom }] = useJoinRoomMutation()
  // state
  const roomInfo = useAppSelector((state) => state.room)
  const [isInLobby, setIsInLobby] = useState(true)
  const [isCollapsedMessage, setIsCollapsedMessage] = useState(true)
  const [isOpenMic, setIsOpenMic] = useState(false)
  const [isOpenCamera, setIsOpenCamera] = useState(false)
  const [pinUser, setPinUser] = useState<User | undefined>()

  // message notification context
  const [messageApi, messageContextHolder] = message.useMessage()
  const info = () => {
    messageApi.warning({
      content: 'hello',
      icon: <Icon.AlertFilled />,
    })
  }
  // controll handler
  const toggleCollapsMessage = () => {
    setIsCollapsedMessage((cur) => !cur)
  }
  const toggleOpenMic = () => {
    setIsOpenMic((cur) => !cur)
  }
  const toggleOpenCamera = () => {
    setIsOpenCamera((cur) => !cur)
  }
  const leaveCall = () => {
    // navigate(rc(RouteKey.JoinRoom).path)
    socket?.disconnect()
  }
  // peer event handler
  const handleNewUserJoined = async (user: User) => {
    notification.info({
      message: `${user.username} joined room`,
    })
    dispatch(pushNewUserToRoom(user))

    const newPeerElement = peerManager.pushNewPeer(user.socketId)
    newPeerElement.peer.addEventListener('negotiationneeded', handleNegotiation)
    newPeerElement.peer.addEventListener('icecandidate', (e) =>
      handleIceCandidate(e, newPeerElement.peer, user.socketId)
    )
    newPeerElement.peer.addEventListener('iceconnectionstatechange', handleRestartIce)

    if (mediaStream) {
      console.log('preparing to set track to peer')
      peerManager.sendStream(newPeerElement.peer, mediaStream)
    }
  }
  const handleNegotiation = async (data: any) => {
    console.log('negotiation needed')
    // const localOffer = await createOffer?.()
    const toPeer = peerElements.find((e) => e.peer === data.srcElement)
    const localOffer = await peerManager.createOffer(toPeer?.peer!)
    socket?.emit(SOCKET_EVENT.EMIT.CALL_USER, {
      offer: localOffer,
      toSocketId: toPeer?.socketId,
    })
  }
  const handleIceCandidate = (
    data: RTCPeerConnectionIceEvent,
    peer: RTCPeerConnection,
    toSocketId: string
  ) => {
    console.log('ice')
    if (peer.remoteDescription)
      socket?.emit(SOCKET_EVENT.EMIT.ICE_CANDIDATE, {
        candidate: data.candidate,
        toSocketId,
      })
  }
  const handleIceAccepted = async ({ candidate, toSocketId }: any) => {
    console.log('ice accepted', toSocketId)
    if (toSocketId && candidate) {
      const fromPeer = peerElements.find((e) => e.socketId === toSocketId)
      console.log('fromPeer', fromPeer)
      if (fromPeer?.peer.remoteDescription && fromPeer?.peer.iceConnectionState === 'new') {
        await fromPeer?.peer.addIceCandidate(candidate)
        console.log('ice added')
      }
    }
  }
  const handleRestartIce = (e: any) => {
    console.log(e.srcElement.iceConnectionState)
    if (e.srcElement.iceConnectionState === 'failed') {
      console.log('ice conflict')
      e.srcElement.restartIce()
    }
  }
  // socket event
  const handleIncommingCall = async (data: any) => {
    console.log('have a offer', data)
    const fromPeer = peerElements.find((e) => e.socketId === data.from.socketId)
    const ans = await peerManager.createAnswer(fromPeer?.peer!, data.offer)
    socket?.emit(SOCKET_EVENT.EMIT.CALL_ACCEPTED, { ans, toUser: data.from })
  }
  const handleCallAccepted = async (data: any) => {
    console.log('have a answer', data)
    const fromPeer = peerElements.find((e) => e.socketId == data.from.socketId)
    await peerManager.setRemoteAnswer(fromPeer?.peer!, data.ans)
  }
  const handleUserDisconnected = (user: User) => {
    notification.info({
      message: `${user.username} left room`,
    })
    dispatch(removeUserFromRoom(user.socketId))
  }
  const handleDisconnect = (reason: any) => {
    console.log(reason)
    if (reason === 'io server disconnect') {
      socket?.connect()
    }
  }
  // get stream
  const getMyMediaStream = async (camera: boolean, mic: boolean) => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: mic,
        video: camera,
      })
      setMediaStream(media)
    } catch (err: any) {
      console.log(err.name + ': ' + err.message)
    }
  }
  //handle not existing room
  useEffect(() => {
    if (!searchParams.get('roomCode')) {
      navigate(rc(RouteKey.JoinRoom).path)
    } else {
    }
  }, [])
  // handle socket event
  useEffect(() => {
    // new user joined room
    socket?.on(SOCKET_EVENT.ON.USER_CONNECTED, handleNewUserJoined)
    // new incoming caller
    socket?.on(SOCKET_EVENT.ON.INCOMMING_CALL, handleIncommingCall)
    // accept incoming call
    socket?.on(SOCKET_EVENT.ON.CALL_ACCEPTED, handleCallAccepted)
    socket?.on(SOCKET_EVENT.ON.ICE_CANDIDATE, handleIceAccepted)
    // user left room
    socket?.on(SOCKET_EVENT.ON.USER_DISCONNECTED, handleUserDisconnected)
    // disconnect
    socket?.on('disconnect', handleDisconnect)
    return () => {
      socket?.off(SOCKET_EVENT.ON.USER_CONNECTED)
      socket?.off(SOCKET_EVENT.ON.INCOMMING_CALL)
      socket?.off(SOCKET_EVENT.ON.CALL_ACCEPTED)
      socket?.off(SOCKET_EVENT.ON.ICE_CANDIDATE)
      socket?.off(SOCKET_EVENT.ON.USER_DISCONNECTED)
      socket?.off('disconnect')
    }
  }, [
    socket,
    handleNewUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleIceAccepted,
    handleUserDisconnected,
    handleDisconnect,
  ])

  useEffect(() => {
    if (isOpenCamera || isOpenMic) {
      getMyMediaStream(isOpenCamera, isOpenMic)
    }
    if (!isOpenMic) {
      mediaStream?.getAudioTracks()?.[0]?.stop()
    }
    if (!isOpenCamera) {
      mediaStream?.getVideoTracks()?.[0]?.stop()
    }
  }, [isOpenCamera])

  useEffect(() => {
    if (mediaStream && roomInfo.members.length > 1) {
      peerElements.forEach((e) => {
        peerManager.sendStream(e.peer, mediaStream)
      })
    }
  }, [mediaStream])

  if (!searchParams.get('roomCode')) return <PrepairRoom />
  return (
    <Spin spinning={isLoadingJoinRoom}>
      <Layout className={styles.room}>
        {messageContextHolder}
        {!isInLobby ? (
          <>
            <Layout.Content style={{ position: 'relative' }}>
              <Space className={styles['btn-control']}>
                <Button
                  type={isOpenMic ? 'primary' : 'default'}
                  onClick={toggleOpenMic}
                  icon={isOpenMic ? <Icon.AudioOutlined /> : <Icon.AudioMutedOutlined />}
                  size="large"
                ></Button>
                <Button
                  type={isOpenCamera ? 'primary' : 'default'}
                  onClick={toggleOpenCamera}
                  icon={isOpenCamera ? <Icon.CameraOutlined /> : <Icon.CameraOutlined />}
                  size="large"
                ></Button>
                <Button
                  type={isCollapsedMessage ? 'default' : 'primary'}
                  onClick={toggleCollapsMessage}
                  icon={<Icon.MessageOutlined />}
                  size="large"
                ></Button>
                <Button
                  type={isCollapsedMessage ? 'default' : 'primary'}
                  onClick={toggleCollapsMessage}
                  icon={<Icon.LaptopOutlined />}
                  size="large"
                ></Button>
                <Button
                  type={isCollapsedMessage ? 'default' : 'primary'}
                  onClick={toggleCollapsMessage}
                  icon={<Icon.TeamOutlined />}
                  size="large"
                ></Button>
                <Button onClick={info} icon={<Icon.AlertOutlined />} size="large"></Button>
                <Button
                  onClick={leaveCall}
                  icon={<Icon.LogoutOutlined />}
                  danger
                  type="primary"
                  size="large"
                ></Button>
              </Space>
              <UserGrid<User>
                pinUser={pinUser}
                users={roomInfo.members}
                renderItems={(item, idx) => (
                  <UserFrame<User>
                    key={idx}
                    user={item}
                    isPin={pinUser === item}
                    onClickPin={(user) => {
                      if (user === pinUser) {
                        setPinUser(undefined)
                      } else {
                        setPinUser(user)
                      }
                    }}
                    stream={
                      item.socketId === socket?.id
                        ? mediaStream
                        : peerElements.find((e) => e.socketId === item.socketId)?.remoteStream
                    }
                    muted={item.socketId === socket?.id}
                  />
                )}
              />
            </Layout.Content>
            <Layout.Sider
              collapsible={true}
              collapsed={isCollapsedMessage}
              trigger={null}
              width={400}
              collapsedWidth={0}
            >
              <IncallMessage isCollapsed={isCollapsedMessage} onCollapse={toggleCollapsMessage} />
            </Layout.Sider>
          </>
        ) : (
          <Layout.Content>
            <Overlay
              stream={mediaStream}
              onToggleCam={(toggle) => setIsOpenCamera(toggle)}
              onToggleMic={(toggle) => setIsOpenMic(toggle)}
              onEnterUserID={async (username) => {
                joinRoom({
                  roomCode: searchParams.get('roomCode')!,
                  username,
                  socketId: socket?.id ?? '',
                })
                  .unwrap()
                  .then((value) => {
                    value.room.members
                      .filter((m) => m.socketId !== socket.id)
                      .forEach((m) => {
                        const newPeerEle = peerManager.pushNewPeer(m.socketId)
                        newPeerEle.peer.addEventListener('negotiationneeded', handleNegotiation)
                        newPeerEle.peer.addEventListener('icecandidate', (e) =>
                          handleIceCandidate(e, newPeerEle.peer, newPeerEle?.socketId)
                        )
                        newPeerEle.peer.addEventListener(
                          'iceconnectionstatechange',
                          handleRestartIce
                        )
                      })
                    socket?.emit(SOCKET_EVENT.EMIT.JOIN_ROOM, {
                      roomCode: value.room.code,
                      socketId: socket.id,
                    })
                  })
                setIsInLobby(false)
              }}
            />
          </Layout.Content>
        )}
      </Layout>
    </Spin>
  )
}
