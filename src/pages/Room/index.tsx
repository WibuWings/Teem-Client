import { Button, Card, Drawer, Input, Layout, message, notification, Space, Spin } from 'antd'
import React, { useCallback, useEffect, useRef, useState } from 'react'
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
import Peer from 'peerjs'
import { waitApi } from '@/utils/async'
import { io, Socket } from 'socket.io-client'
import { API_URL } from '@/config'
import { trackForMutations } from '@reduxjs/toolkit/dist/immutableStateInvariantMiddleware'
import { getResourceUrl } from '@/transforms/url'
import { PAGE_INFO } from '@/constants/page'

type PeerElement = {
  peer: Peer
  socketId: string
  remoteStream?: MediaStream
}

export function RoomPage() {
  // react hook
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  // socket & peer
  const { socket } = useSocketContext()
  const [mediaStream, setMediaStream] = useState<MediaStream | undefined>()
  // screen
  const screenStreamRef = useRef<MediaStream | undefined>()
  const screenSocketRef = useRef<Socket<any, any> | undefined>()
  const screenPeerInstanceList = useRef<PeerElement[]>([])
  //
  const peerInstanceList = useRef<PeerElement[]>([])
  const [streamList, setStreamList] = useState<
    {
      socketId: string
      remoteStream?: MediaStream
    }[]
  >([])

  // room API
  const [joinRoom, { isLoading: isLoadingJoinRoom, error: errorJoinRoom }] = useJoinRoomMutation()
  // state
  const roomInfo = useAppSelector((state) => state.room)
  const [isInLobby, setIsInLobby] = useState(true)
  const [isCollapsedMessage, setIsCollapsedMessage] = useState(true)
  const [isOpenMic, setIsOpenMic] = useState(false)
  const [isOpenCamera, setIsOpenCamera] = useState(false)
  const [isShareScreen, setIsShareScreen] = useState(false)
  const [pinUser, setPinUser] = useState<User | undefined>()

  const pushNewPeer = (
    peerElements: PeerElement[],
    selfSocketId: string,
    ortherSocketId: string
  ) => {
    const peer = new Peer(selfSocketId + ortherSocketId)
    peer.on('open', (id) => {
      console.log(`peer ${id} opened`)
    })
    const newPeerElement: PeerElement = {
      peer,
      socketId: ortherSocketId,
    }
    newPeerElement.peer.on('call', (call) => {
      console.log('on incoming call')
      call.answer(undefined) // Answer the call with an A/V stream.
      call.on('stream', (remoteStream) => {
        // Show stream in some <video> element.
        newPeerElement.remoteStream = remoteStream
        setStreamList(
          peerElements
            .filter((p) => p.remoteStream)
            .map((p) => ({
              socketId: p.socketId,
              remoteStream: p.remoteStream,
            }))
        )
      })
    })
    peerElements.push(newPeerElement)
    return newPeerElement
  }

  // message notification context
  const [messageApi, messageContextHolder] = message.useMessage()
  const info = () => {
    messageApi.info({
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
  const toggleShareScreen = async () => {
    if (!isShareScreen) {
      setIsShareScreen(true)
      try {
        const screenMedia = await navigator.mediaDevices.getDisplayMedia({
          audio: true,
          video: true,
        })
        if (!screenSocketRef.current) {
          screenSocketRef.current = io(API_URL)
        } else {
          screenSocketRef.current.connect()
        }

        screenMedia.getTracks().forEach((track) => {
          track.onended = () => {
            console.log('end share screen media')
            setIsShareScreen(false)
            screenSocketRef.current?.disconnect()
          }
        })
        screenStreamRef.current = screenMedia
        screenSocketRef.current?.on('connect', () => {
          joinRoom({
            roomCode: searchParams.get('roomCode')!,
            username:
              roomInfo.members.find((m) => m.socketId === socket.id)?.username + '(Share)',
            socketId: screenSocketRef.current?.id ?? '',
          })
            .unwrap()
            .then(async (value) => {
              value.room.members
                .filter((m) => m.socketId !== screenSocketRef.current?.id)
                .forEach((m) => {
                  const newPeer = pushNewPeer(
                    screenPeerInstanceList.current,
                    screenSocketRef.current!.id,
                    m.socketId
                  )
                })
              await waitApi(3000)
              screenPeerInstanceList.current.forEach((p) =>
                p.peer.call(p.socketId + screenSocketRef.current!.id, screenStreamRef.current!)
              )
              screenSocketRef.current?.emit(SOCKET_EVENT.EMIT.JOIN_ROOM, {
                roomCode: value.room.code,
                socketId: screenSocketRef.current.id,
              })
            })
        })
        joinRoom({
          roomCode: searchParams.get('roomCode')!,
          username: roomInfo.members.find((m) => m.socketId === socket.id)?.username + '(Share)',
          socketId: screenSocketRef.current?.id ?? '',
        })
          .unwrap()
          .then(async (value) => {
            value.room.members
              .filter((m) => m.socketId !== screenSocketRef.current?.id)
              .forEach((m) => {
                const newPeer = pushNewPeer(
                  screenPeerInstanceList.current,
                  screenSocketRef.current!.id,
                  m.socketId
                )
              })
            await waitApi(3000)
            screenPeerInstanceList.current.forEach((p) =>
              p.peer.call(p.socketId + screenSocketRef.current!.id, screenStreamRef.current!)
            )
            screenSocketRef.current?.emit(SOCKET_EVENT.EMIT.JOIN_ROOM, {
              roomCode: value.room.code,
              socketId: screenSocketRef.current.id,
            })
          })
      } catch (err: any) {
        console.log(err.name + ': ' + err.message)
      }
    } else {
      setIsShareScreen(false)
      console.log('end share screen media')
      screenStreamRef.current?.getTracks().forEach((track) => track.stop())
      screenSocketRef.current?.disconnect()
    }
  }
  const leaveCall = () => {
    navigate(rc(RouteKey.JoinRoom).path)
    socket?.disconnect()
    screenSocketRef.current?.disconnect()
  }
  const shareRoom = () => {
    navigator.clipboard.writeText(window.location.href)
    messageApi.success({
      content: 'Copy link to room successfully',
      icon: <Icon.CheckCircleOutlined />,
    })
  }
  // peer event handler
  const handleNewUserJoined = async (user: User) => {
    if (user.socketId !== screenSocketRef.current?.id) {
      if (user.username.includes('Share')) {
        setIsShareScreen(false)
        screenStreamRef.current?.getTracks().forEach((track) => track.stop())
        screenSocketRef.current?.disconnect()
      }
      notification.info({
        message: user.username.includes('Share')
          ? `${user.username} shared screen`
          : `${user.username} joined room`,
      })
      dispatch(pushNewUserToRoom(user))

      const newPeerElement = pushNewPeer(peerInstanceList.current, socket.id, user.socketId)

      if (mediaStream) {
        await waitApi(3000)
        console.log('calling')
        newPeerElement.peer.call(user.socketId + socket.id, mediaStream)
      }
      if (screenStreamRef.current) {
        await waitApi(3000)
        console.log('calling')
        newPeerElement.peer.call(user.socketId + socket.id, screenStreamRef.current)
      }
    }
  }
  // socket event
  const handleUserDisconnected = (user: User) => {
    if (roomInfo.members.find((m) => m.socketId === user.socketId)) {
      if (!user.username.includes('Share')) {
        notification.info({
          message: `${user.username} left room`,
        })
      }
      dispatch(removeUserFromRoom(user.socketId))
    }
  }
  const handleDisconnect = (reason: any) => {
    console.log(reason)
    if (reason === 'io server disconnect' || reason === 'transport close') {
      socket?.connect()
    } else {
      leaveCall()
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
    // user left room
    socket?.on(SOCKET_EVENT.ON.USER_DISCONNECTED, handleUserDisconnected)
    // disconnect
    socket?.on('disconnect', handleDisconnect)
    return () => {
      socket?.off(SOCKET_EVENT.ON.USER_CONNECTED)
      socket?.off(SOCKET_EVENT.ON.USER_DISCONNECTED)
      socket?.off('disconnect')
    }
  }, [socket, handleNewUserJoined, handleUserDisconnected, handleDisconnect])

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
  }, [isOpenCamera, isOpenMic])

  useEffect(() => {
    if (mediaStream && roomInfo.members.length > 1) {
      peerInstanceList.current.forEach((e) => {
        e.peer.call(e.socketId + socket.id, mediaStream)
      })
    }
  }, [mediaStream])

  if (!searchParams.get('roomCode')) return <PrepairRoom />
  return (
    <Spin spinning={isLoadingJoinRoom}>
      <Layout
        className={styles.room}
        style={{ backgroundImage: `url("${getResourceUrl(PAGE_INFO.BACKGROUND)}") ` }}
      >
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
                  type={isShareScreen ? 'primary' : 'default'}
                  onClick={toggleShareScreen}
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
                  onClick={shareRoom}
                  icon={<Icon.ShareAltOutlined />}
                  size="large"
                ></Button>
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
                        : item.socketId === screenSocketRef.current?.id
                        ? screenStreamRef.current
                        : streamList.find((e) => e.socketId === item.socketId)?.remoteStream
                    }
                    muted={item.socketId === socket?.id}
                    isTurnOnCamera={
                      item.socketId === socket?.id
                        ? isOpenCamera
                        : item.socketId === screenSocketRef.current?.id
                        ? isOpenCamera
                        : streamList.find((e) => e.socketId === item.socketId)?.remoteStream !==
                          undefined
                    }
                    isYou={item.socketId === socket?.id ? true : false}
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
                  .then(async (value) => {
                    value.room.members
                      .filter((m) => m.socketId !== socket.id)
                      .forEach((m) => {
                        const newPeer = pushNewPeer(
                          peerInstanceList.current,
                          socket.id,
                          m.socketId
                        )
                      })
                    if (mediaStream) {
                      await waitApi(3000)
                      peerInstanceList.current.forEach((p) =>
                        p.peer.call(p.socketId + socket.id, mediaStream)
                      )
                    }
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
