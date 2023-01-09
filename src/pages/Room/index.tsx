import { Button, Card, Drawer, Input, Layout, message, notification, Space } from 'antd'
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

type RoomParams = {
  roomCode: string
}

export function Room() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { socket } = useSocketContext()
  const { peer, createOffer, createAnswer } = usePeerContext()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const roomInfo = useAppSelector((state) => state.room)

  const [joinRoom, { isLoading: isLoadingJoinRoom, error: errorJoinRoom }] = useJoinRoomMutation()

  const [isInLobby, setIsInLobby] = useState(true)

  const [isCollapsedMessage, setIsCollapsedMessage] = useState(false)
  const [isOpenMic, setIsOpenMic] = useState(false)
  const [isOpenCamera, setOpenCamera] = useState(false)

  const numberOfUser = 10
  const users = [...Array(numberOfUser).keys()]
  const [pinUser, setPinUser] = useState<number | undefined>(users[0])

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
    navigate(rc(RouteKey.JoinRoom).path)
  }

  //handle not existing room
  useEffect(() => {
    if (!searchParams.get('roomCode')) {
      navigate(rc(RouteKey.JoinRoom).path)
    } else {
    }
  }, [])

  const handleAnswer = async (data: any) => {
    const { offer, ...rest } = data
    const answer = await createAnswer(offer)
    socket.emit('call:accept', { ...rest, answer })
  }
  // handle socket event
  useEffect(() => {
    // new user joined room
    socket.on(SOCKET_EVENT.ON.USER_CONNECTED, (user: User) => {
      notification.info({
        message: `${user.username} joined room`,
      })
      dispatch(pushNewUserToRoom(user))
    })
    // user left room
    socket.on(SOCKET_EVENT.ON.USER_DISCONNECTED, (user: User) => {
      notification.info({
        message: `${user.username} left room`,
      })
      dispatch(removeUserFromRoom(user.socketId))
    })
    return () => {
      socket.off(SOCKET_EVENT.ON.USER_CONNECTED)
    }
  }, [])

  if (!searchParams.get('roomCode')) return <PrepairRoom />
  return (
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
            <UserGrid
              pinUser={pinUser}
              users={users}
              renderItems={(item, idx) => (
                <UserFrame
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
              setIsInLobby(false)
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
  )
}
