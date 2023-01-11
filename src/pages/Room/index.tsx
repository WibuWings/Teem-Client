import { Button, Card, Drawer, Input, Layout, message, notification, Space, Spin } from 'antd'
import React, { useEffect, useState } from 'react'
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
import { SocketProvider, SOCKET_EVENT } from '@/providers/Socket'
import { useJoinRoomMutation } from './apiSlice'
import { JoinRoomDTO, User } from './model'
import { is } from 'immer/dist/internal'

type RoomParams = {
  roomCode: string
}

export function Room() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { socket } = useSocketContext()
  const { peer, createOffer, createAnswer, setRemoteAnswer, sendStream, remoteStream } =
    usePeerContext()
  const [mediaStream, setMediaStream] = useState<MediaStream | undefined>()

  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const roomInfo = useAppSelector((state) => state.room)

  const [joinRoom, { isLoading: isLoadingJoinRoom, error: errorJoinRoom }] = useJoinRoomMutation()

  const [isInLobby, setIsInLobby] = useState(true)

  const [isCollapsedMessage, setIsCollapsedMessage] = useState(false)
  const [isOpenMic, setIsOpenMic] = useState(false)
  const [isOpenCamera, setOpenCamera] = useState(false)

  const [pinUser, setPinUser] = useState<User | undefined>()

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
    setOpenCamera((cur) => !cur)
  }
  const leaveCall = () => {
    // navigate(rc(RouteKey.JoinRoom).path)
    socket.disconnect()
  }

  const handleNewUserJoined = async () => {
    const offer = await createOffer()
    socket.emit(SOCKET_EVENT.EMIT.CALL_USER, { roomCode: roomInfo.code, offer })
  }
  const handleIncommingCall = async (data: any) => {
    const ans = await createAnswer(data.offer)
    socket.emit(SOCKET_EVENT.EMIT.CALL_ACCEPTED, { ans, toUser: data.from })
  }
  const handleCallAccepted = async (data) => {
    console.log(data)
    await setRemoteAnswer(data.ans)
  }
  const getMyMediaStream = async (camera: boolean, mic: boolean) => {
    let All_mediaDevices = navigator.mediaDevices
    if (!All_mediaDevices || !All_mediaDevices.getUserMedia) {
      alert('Camera not supported.')
      return
    }

    try {
      const media = await All_mediaDevices.getUserMedia({
        audio: mic,
        video: camera,
      })
      setMediaStream(media)
      sendStream(media)
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
    socket.on(SOCKET_EVENT.ON.USER_CONNECTED, (user: User) => {
      notification.info({
        message: `${user.username} joined room`,
      })
      handleNewUserJoined()
      dispatch(pushNewUserToRoom(user))
    })
    // new incoming caller
    socket.on(SOCKET_EVENT.ON.INCOMMING_CALL, handleIncommingCall)
    // accept incoming call
    socket.on(SOCKET_EVENT.ON.CALL_ACCEPTED, handleCallAccepted)
    // user left room
    socket.on(SOCKET_EVENT.ON.USER_DISCONNECTED, (user: User) => {
      notification.info({
        message: `${user.username} left room`,
      })
      dispatch(removeUserFromRoom(user.socketId))
    })
    // disconnect
    socket.on('disconnect', (reason) => {
      console.log(reason)
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, you need to reconnect manually
        socket.connect()
      }
      // else the socket will automatically try to reconnect
    })
    return () => {
      socket.off(SOCKET_EVENT.ON.USER_CONNECTED)
      socket.off(SOCKET_EVENT.ON.USER_DISCONNECTED)
      socket.off('disconnect')
    }
  }, [])
  useEffect(() => {
    if (isOpenCamera) {
      getMyMediaStream(isOpenCamera, isOpenMic)
    }
  }, [isOpenCamera])
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
                    stream={item.socketId === socket.id ? mediaStream : remoteStream}
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
              onEnterUserID={async (username) => {
                const offer = await createOffer()
                joinRoom({
                  roomCode: searchParams.get('roomCode')!,
                  username,
                  socketId: socket.id,
                })
                  .unwrap()
                  .then((value) => {
                    // console.log(value)
                    socket.emit(SOCKET_EVENT.EMIT.JOIN_ROOM, {
                      roomCode: value.room.code,
                      socketId: socket.id,
                    })
                  })
                setIsInLobby(false)
                // socket.emit(SOCKET_EVENT.EMIT.JOIN_ROOM, {
                //   roomCode: searchParams.get('roomCode'),
                //   username,
                //   socketId: socket.id,
                // } as JoinRoomDTO)
                // socket.emit('call:offer', { roomCode: searchParams.get('roomCode'), userID, offer })
                // dispatch(setroomCodeAndUserID({ userID, roomCode: searchParams.get('roomCode') ?? '' }))
              }}
            />
          </Layout.Content>
        )}
      </Layout>
    </Spin>
  )
}
